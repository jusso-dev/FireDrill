import { nanoid } from "nanoid";
import { pool } from "./db.js";
import { activeIncidents } from "./metrics.js";
import { SCENARIOS } from "@firedrill/shared";
import type { Incident, ScenarioId, TimelineEvent } from "@firedrill/shared";

function rowToIncident(row: Record<string, unknown>): Incident {
  return {
    id: row.id as string,
    scenarioId: row.scenario_id as ScenarioId,
    status: row.status as "open" | "resolved",
    startedAt: (row.started_at as Date).toISOString(),
    endedAt: row.ended_at ? (row.ended_at as Date).toISOString() : null,
    affectedServices: row.affected_services as string[],
    summary: row.summary as string,
    timeline: row.timeline as TimelineEvent[],
  };
}

export async function createIncident(scenarioId: ScenarioId): Promise<Incident> {
  const id = `inc_${nanoid(10)}`;
  const def = SCENARIOS[scenarioId];
  const startedAt = new Date();
  const timeline: TimelineEvent[] = [
    {
      at: startedAt.toISOString(),
      kind: "incident_started",
      message: `${def.name} scenario triggered`,
    },
  ];
  await pool.query(
    `INSERT INTO incidents (id, scenario_id, status, started_at, affected_services, summary, timeline)
     VALUES ($1, $2, 'open', $3, $4::jsonb, $5, $6::jsonb)`,
    [
      id,
      scenarioId,
      startedAt,
      JSON.stringify(def.affectedServices),
      `${def.name}: ${def.description}`,
      JSON.stringify(timeline),
    ],
  );
  await refreshActiveGauge();
  return {
    id,
    scenarioId,
    status: "open",
    startedAt: startedAt.toISOString(),
    endedAt: null,
    affectedServices: def.affectedServices,
    summary: `${def.name}: ${def.description}`,
    timeline,
  };
}

export async function appendTimeline(id: string, event: TimelineEvent): Promise<void> {
  await pool.query(
    `UPDATE incidents
       SET timeline = COALESCE(timeline, '[]'::jsonb) || $2::jsonb
     WHERE id = $1`,
    [id, JSON.stringify(event)],
  );
}

export async function resolveIncident(id: string): Promise<Incident | null> {
  const endedAt = new Date();
  const event: TimelineEvent = {
    at: endedAt.toISOString(),
    kind: "incident_resolved",
    message: "Scenario disabled, incident resolved",
  };
  const result = await pool.query(
    `UPDATE incidents
       SET status = 'resolved',
           ended_at = $2,
           timeline = COALESCE(timeline, '[]'::jsonb) || $3::jsonb
     WHERE id = $1 AND status = 'open'
     RETURNING *`,
    [id, endedAt, JSON.stringify(event)],
  );
  await refreshActiveGauge();
  if (result.rowCount === 0) return null;
  return rowToIncident(result.rows[0]);
}

export async function getIncident(id: string): Promise<Incident | null> {
  const { rows } = await pool.query("SELECT * FROM incidents WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  return rowToIncident(rows[0]);
}

export async function listIncidents(opts: { status?: "open" | "resolved"; limit?: number } = {}) {
  const limit = opts.limit ?? 50;
  const params: unknown[] = [];
  let where = "";
  if (opts.status) {
    params.push(opts.status);
    where = `WHERE status = $${params.length}`;
  }
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT * FROM incidents ${where} ORDER BY started_at DESC LIMIT $${params.length}`,
    params,
  );
  return rows.map(rowToIncident);
}

export async function activeIncidentForScenario(scenarioId: ScenarioId): Promise<Incident | null> {
  const { rows } = await pool.query(
    "SELECT * FROM incidents WHERE scenario_id = $1 AND status = 'open' ORDER BY started_at DESC LIMIT 1",
    [scenarioId],
  );
  if (rows.length === 0) return null;
  return rowToIncident(rows[0]);
}

export async function countActive(): Promise<number> {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM incidents WHERE status = 'open'");
  return rows[0].n as number;
}

export async function refreshActiveGauge(): Promise<void> {
  try {
    activeIncidents.set(await countActive());
  } catch {
    /* db may be down during tests */
  }
}

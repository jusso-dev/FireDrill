import { nanoid } from "nanoid";
import { pool } from "./db.js";
import { activeIncidents } from "./metrics.js";
import { logger } from "./logger.js";
import { SCENARIOS } from "@firedrill/shared";
import type { Incident, ScenarioId, TimelineEvent } from "@firedrill/shared";

interface IncidentRow {
  id: string;
  scenario_id: string;
  status: string;
  started_at: Date;
  ended_at: Date | null;
  affected_services: string[];
  summary: string;
  timeline: TimelineEvent[];
}

function rowToIncident(row: IncidentRow): Incident {
  return {
    id: row.id,
    scenarioId: row.scenario_id as ScenarioId,
    status: row.status === "resolved" ? "resolved" : "open",
    startedAt: row.started_at.toISOString(),
    endedAt: row.ended_at ? row.ended_at.toISOString() : null,
    affectedServices: row.affected_services,
    summary: row.summary,
    timeline: row.timeline ?? [],
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
  const summary = `${def.name}: ${def.description}`;
  await pool.query(
    `INSERT INTO incidents (id, scenario_id, status, started_at, affected_services, summary, timeline)
     VALUES ($1, $2, 'open', $3, $4::jsonb, $5, $6::jsonb)`,
    [
      id,
      scenarioId,
      startedAt,
      JSON.stringify(def.affectedServices),
      summary,
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
    summary,
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
  const { rows, rowCount } = await pool.query<IncidentRow>(
    `UPDATE incidents
        SET status = 'resolved',
            ended_at = $2,
            timeline = COALESCE(timeline, '[]'::jsonb) || $3::jsonb
      WHERE id = $1 AND status = 'open'
      RETURNING *`,
    [id, endedAt, JSON.stringify(event)],
  );
  await refreshActiveGauge();
  if (rowCount === 0) return null;
  return rowToIncident(rows[0]);
}

export async function getIncident(id: string): Promise<Incident | null> {
  const { rows } = await pool.query<IncidentRow>(
    "SELECT * FROM incidents WHERE id = $1",
    [id],
  );
  return rows.length === 0 ? null : rowToIncident(rows[0]);
}

export async function listIncidents(
  opts: { status?: "open" | "resolved"; limit?: number } = {},
): Promise<Incident[]> {
  const limit = Math.min(Math.max(1, opts.limit ?? 50), 500);
  const params: unknown[] = [];
  let where = "";
  if (opts.status) {
    params.push(opts.status);
    where = `WHERE status = $${params.length}`;
  }
  params.push(limit);
  const { rows } = await pool.query<IncidentRow>(
    `SELECT * FROM incidents ${where} ORDER BY started_at DESC LIMIT $${params.length}`,
    params,
  );
  return rows.map(rowToIncident);
}

export async function activeIncidentForScenario(
  scenarioId: ScenarioId,
): Promise<Incident | null> {
  const { rows } = await pool.query<IncidentRow>(
    `SELECT * FROM incidents
      WHERE scenario_id = $1 AND status = 'open'
      ORDER BY started_at DESC
      LIMIT 1`,
    [scenarioId],
  );
  return rows.length === 0 ? null : rowToIncident(rows[0]);
}

export async function countActive(): Promise<number> {
  const { rows } = await pool.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM incidents WHERE status = 'open'",
  );
  return rows[0].n;
}

/**
 * Best-effort refresh of the active-incidents gauge. We swallow errors here
 * because the gauge is observability — failing to update it should never
 * propagate up and fail the caller (e.g. resolveIncident).
 */
export async function refreshActiveGauge(): Promise<void> {
  try {
    activeIncidents.set(await countActive());
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "failed to refresh active incidents gauge");
  }
}

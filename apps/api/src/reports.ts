import { RUNBOOKS, SCENARIOS } from "@firedrill/shared";
import type { Incident, IncidentReport } from "@firedrill/shared";

export function generateReport(incident: Incident): IncidentReport {
  const scenario = SCENARIOS[incident.scenarioId];
  const runbook = RUNBOOKS[incident.scenarioId];
  const durationMs = incident.endedAt
    ? new Date(incident.endedAt).getTime() - new Date(incident.startedAt).getTime()
    : Date.now() - new Date(incident.startedAt).getTime();
  const durationMin = Math.round(durationMs / 60_000);

  const summary =
    `Incident ${incident.id} (${scenario.name}) ` +
    `${incident.status === "resolved" ? "resolved" : "ongoing"} after ${durationMin} minute(s). ` +
    `Affected services: ${incident.affectedServices.join(", ")}.`;

  const suspectedRootCause =
    `${scenario.name} scenario was deliberately triggered via FireDrill control plane. ` +
    `In a real incident the analogous root cause would be: ${scenario.description}`;

  return {
    incidentId: incident.id,
    generatedAt: new Date().toISOString(),
    summary,
    timeline: incident.timeline,
    affectedServices: incident.affectedServices,
    detectedSymptoms: scenario.symptoms,
    suspectedRootCause,
    remediation: runbook.immediateMitigation,
    prevention: runbook.longTermFix,
    source: "template",
  };
}

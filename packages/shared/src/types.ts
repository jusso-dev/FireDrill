export type ScenarioId =
  | "latency_spike"
  | "error_storm"
  | "db_slowdown"
  | "queue_backlog"
  | "worker_failure"
  | "memory_pressure";

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  affectedServices: string[];
  symptoms: string[];
  defaultIntensity: number;
}

export interface ScenarioState {
  id: ScenarioId;
  active: boolean;
  startedAt: string | null;
  endedAt: string | null;
  intensity: number;
  incidentId: string | null;
}

export type IncidentStatus = "open" | "resolved";

export interface TimelineEvent {
  at: string;
  kind: string;
  message: string;
}

export interface Incident {
  id: string;
  scenarioId: ScenarioId;
  status: IncidentStatus;
  startedAt: string;
  endedAt: string | null;
  affectedServices: string[];
  summary: string;
  timeline: TimelineEvent[];
}

export interface IncidentReport {
  incidentId: string;
  generatedAt: string;
  summary: string;
  timeline: TimelineEvent[];
  affectedServices: string[];
  detectedSymptoms: string[];
  suspectedRootCause: string;
  remediation: string[];
  prevention: string[];
  source: "template" | "llm";
}

export interface Alert {
  id: string;
  name: string;
  severity: "warning" | "critical";
  message: string;
  firingSince: string;
  scenarioId: ScenarioId | null;
}

export interface ServiceHealth {
  service: string;
  status: "healthy" | "degraded" | "down";
  detail: string;
}

export interface OverviewSnapshot {
  services: ServiceHealth[];
  requestRate: number;
  errorRate: number;
  p95LatencyMs: number;
  queueDepth: number;
  failedJobs: number;
  databaseHealthy: boolean;
  activeIncidents: Incident[];
  recentIncidents: Incident[];
  activeAlerts: Alert[];
}

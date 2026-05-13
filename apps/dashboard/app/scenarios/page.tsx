"use client";
import {
  Badge,
  Button,
  Card,
  ErrorPanel,
  PageHeader,
  SectionLabel,
} from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import { postJson } from "@/lib/api";
import type { Scenario, ScenarioId, ScenarioState } from "@firedrill/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ScenarioMeta extends Scenario {
  minIntensity: number;
  maxIntensity: number;
  intensityUnit: string;
  state: ScenarioState;
}

type ScenarioListResp = { scenarios: ScenarioMeta[] };

export default function ScenariosPage() {
  const { data, error } = usePoll<ScenarioListResp>("/api/scenarios", 2000);
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggle(id: ScenarioId, enabled: boolean, intensity?: number) {
    setPending(id);
    setActionError(null);
    try {
      await postJson(`/api/simulate/${id}`, { enabled, intensity });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  }
  async function reset() {
    setPending("__reset");
    setActionError(null);
    try {
      await postJson("/api/simulate/reset", {});
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  }

  const liveCount = data?.scenarios.filter((s) => s.state.active).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scenarios"
        subtitle="Trigger an incident to drive failures through metrics, alerts and runbooks. Each scenario opens an incident on enable and resolves it on disable."
        alarm={liveCount > 0}
        status={
          liveCount > 0 ? (
            <span className="text-ember-500">
              {liveCount} scenario{liveCount > 1 ? "s" : ""} live
            </span>
          ) : (
            <span className="text-signal-green">all off</span>
          )
        }
        actions={
          <Button
            variant="ghost"
            onClick={reset}
            disabled={pending === "__reset"}
          >
            {pending === "__reset" ? "resetting…" : "reset all"}
          </Button>
        }
      />

      {error && <ErrorPanel title="Cannot reach API" message={error} />}
      {actionError && <ErrorPanel title="Action failed" message={actionError} />}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.scenarios.map((s) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            pending={pending === s.id}
            onToggle={(enabled, intensity) => toggle(s.id, enabled, intensity)}
          />
        ))}
        {!data && !error && (
          <Card>
            <SectionLabel>Loading</SectionLabel>
            <p className="mt-3 text-sm text-steel-400">Fetching scenario state…</p>
          </Card>
        )}
      </section>
    </div>
  );
}

function ScenarioCard({
  scenario,
  pending,
  onToggle,
}: {
  scenario: ScenarioMeta;
  pending: boolean;
  onToggle: (enabled: boolean, intensity?: number) => void;
}) {
  const active = scenario.state.active;
  const [intensity, setIntensity] = useState<number>(scenario.state.intensity);

  // Keep the slider in sync when the upstream state changes (e.g. another
  // tab disables the scenario), but don't fight the user mid-drag.
  useEffect(() => {
    if (!pending) setIntensity(scenario.state.intensity);
  }, [scenario.state.intensity, pending]);

  const unit = scenario.intensityUnit ?? "";

  return (
    <Card alarm={active}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-bone-100">
              {scenario.name}
            </h3>
            {active && <Badge tone="bad">live</Badge>}
          </div>
          <p className="text-sm text-steel-400 mt-1 max-w-[44ch]">
            {scenario.description}
          </p>
        </div>
        <Button
          variant={active ? "danger" : "alarm"}
          disabled={pending}
          onClick={() => onToggle(!active, active ? undefined : intensity)}
        >
          {pending ? "…" : active ? "disable" : "trigger"}
        </Button>
      </div>

      <div className="mt-5 pt-4 border-t border-[var(--border)] space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="eyebrow">intensity</span>
            <span className="font-mono text-sm text-bone-100 tabular-nums">
              {intensity}
              {unit && <span className="text-steel-500 ml-1">{unit}</span>}
            </span>
          </div>
          <input
            type="range"
            min={scenario.minIntensity ?? 0}
            max={scenario.maxIntensity ?? 100}
            value={intensity}
            disabled={active || pending}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="mt-2 w-full accent-ember-500 disabled:opacity-50"
            aria-label={`${scenario.name} intensity`}
          />
          <div className="mt-1 flex justify-between text-[10px] font-mono text-steel-500">
            <span>{scenario.minIntensity ?? 0}</span>
            <span>{scenario.maxIntensity ?? 100}</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono">
          <Field label="affects">{scenario.affectedServices.join(" · ")}</Field>
          <Field label="started">
            {scenario.state.startedAt
              ? new Date(scenario.state.startedAt).toLocaleTimeString()
              : "—"}
          </Field>
          <Field label="duration">
            {active && scenario.state.startedAt
              ? formatDuration(scenario.state.startedAt)
              : "—"}
          </Field>
          <Field label="incident">
            {scenario.state.incidentId && active ? (
              <Link
                href={`/incidents/${scenario.state.incidentId}`}
                className="text-ember-500 hover:text-ember-400"
              >
                {scenario.state.incidentId} →
              </Link>
            ) : (
              "—"
            )}
          </Field>
        </dl>
      </div>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-bone-100 font-mono">{children}</dd>
    </div>
  );
}

function formatDuration(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime();
  if (ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

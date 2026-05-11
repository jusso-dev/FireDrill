"use client";
import {
  Badge,
  BayTag,
  Button,
  Card,
  CardEyebrow,
  DispatchLine,
} from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import { postJson } from "@/lib/api";
import type { Scenario, ScenarioState } from "@firedrill/shared";
import Link from "next/link";
import { useState } from "react";

type ScenarioListResp = {
  scenarios: (Scenario & { state: ScenarioState })[];
};

export default function ScenariosPage() {
  const { data, error } = usePoll<ScenarioListResp>("/api/scenarios", 2000);
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(id: string, enabled: boolean) {
    setPending(id);
    try {
      await postJson(`/api/simulate/${id}`, { enabled });
    } finally {
      setPending(null);
    }
  }
  async function reset() {
    setPending("__reset");
    try {
      await postJson("/api/simulate/reset", {});
    } finally {
      setPending(null);
    }
  }

  const liveCount = data?.scenarios.filter((s) => s.state.active).length ?? 0;

  return (
    <div className="space-y-8">
      <DispatchLine
        bay="03"
        page="Scenarios"
        alarm={liveCount > 0}
        state={
          liveCount > 0 ? (
            <span className="text-ember-500">{liveCount} scenario{liveCount > 1 ? "s" : ""} live</span>
          ) : (
            <span className="text-signal-green">all toggles cold</span>
          )
        }
      />

      <div className="flex items-end justify-between">
        <p className="text-sm text-steel-400 max-w-[60ch]">
          Pull a lever, watch the alarm fire. Each scenario opens an incident
          on enable and resolves it on disable.
        </p>
        <Button
          variant="ghost"
          onClick={reset}
          disabled={pending === "__reset"}
        >
          {pending === "__reset" ? "resetting…" : "reset all"}
        </Button>
      </div>

      {error && (
        <Card alarm>
          <CardEyebrow alarm>Couldn’t reach API</CardEyebrow>
          <p className="mt-2 text-sm text-ember-400 font-mono">{error}</p>
        </Card>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.scenarios.map((s, i) => {
          const active = s.state.active;
          return (
            <Card key={s.id} alarm={active} rivets>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <BayTag bay={i + 1} alarm={active} />
                    {active && <Badge tone="bad">live</Badge>}
                  </div>
                  <h3 className="mt-3 text-[1.25rem] leading-tight font-semibold tracking-tight text-bone-100">
                    {s.name}
                  </h3>
                  <p className="text-sm text-steel-400 mt-2 max-w-[42ch]">
                    {s.description}
                  </p>
                </div>
                <Button
                  variant={active ? "danger" : "alarm"}
                  disabled={pending === s.id}
                  onClick={() => toggle(s.id, !active)}
                >
                  {pending === s.id ? "…" : active ? "disable" : "trigger"}
                </Button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono">
                <Field label="affects">
                  {s.affectedServices.join(" · ")}
                </Field>
                <Field label="intensity">{s.state.intensity}</Field>
                <Field label="started">
                  {s.state.startedAt
                    ? new Date(s.state.startedAt).toLocaleTimeString()
                    : "—"}
                </Field>
                <Field label="duration">
                  {active && s.state.startedAt
                    ? formatDuration(s.state.startedAt)
                    : "—"}
                </Field>
              </div>

              <div className="mt-5 pt-4 border-t border-concrete-700/60">
                <div className="dispatch-eyebrow text-steel-400">
                  Symptoms
                </div>
                <ul className="mt-2 space-y-1 text-xs text-steel-300">
                  {s.symptoms.map((sym, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-concrete-600 font-mono">·</span>
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {active && s.state.incidentId && (
                <div className="mt-5 pt-4 border-t border-ember-900/50">
                  <Link
                    href={`/incidents/${s.state.incidentId}`}
                    className="dispatch-eyebrow text-ember-500 hover:text-ember-400"
                  >
                    open incident {s.state.incidentId} →
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </section>
    </div>
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
      <div className="dispatch-eyebrow text-concrete-600">{label}</div>
      <div className="mt-1 text-bone-100 font-mono">{children}</div>
    </div>
  );
}

function formatDuration(startedAt: string) {
  const ms = Date.now() - new Date(startedAt).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

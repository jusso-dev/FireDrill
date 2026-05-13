"use client";
import {
  Card,
  ErrorPanel,
  PageHeader,
  SectionLabel,
  StatusPill,
} from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import type { OverviewSnapshot } from "@firedrill/shared";

const ROLES: Record<string, { role: string; detail: string }> = {
  api: {
    role: "Edge · HTTP",
    detail: "Fastify · scenario host · /metrics · port 4000",
  },
  worker: {
    role: "Background",
    detail: "BullMQ consumer · emails / orders / invoices · port 4001",
  },
  postgres: {
    role: "Datastore",
    detail: "Primary OLTP · incidents, products, orders",
  },
  redis: {
    role: "Broker",
    detail: "BullMQ broker · scenario state cache",
  },
};

export default function ServicesPage() {
  const { data, error } = usePoll<OverviewSnapshot>("/api/overview", 3000);
  const services = data?.services ?? [];
  const degraded = services.filter((s) => s.status !== "healthy").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        subtitle="The four components of the stack and their current status."
        alarm={degraded > 0}
        status={
          degraded > 0 ? (
            <span className="text-ember-500">
              {degraded} service{degraded > 1 ? "s" : ""} degraded
            </span>
          ) : (
            <span className="text-signal-green">all healthy</span>
          )
        }
      />

      {error && <ErrorPanel title="Cannot reach API" message={error} />}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s) => {
          const meta = ROLES[s.service] ?? { role: "service", detail: "" };
          return (
            <Card key={s.service} alarm={s.status === "down"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-bone-100">
                    {s.service}
                  </h3>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-steel-400 mt-1">
                    {meta.role}
                  </div>
                </div>
                <StatusPill status={s.status} />
              </div>
              <p className="mt-4 text-xs text-steel-400 font-mono">{meta.detail}</p>
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <span className="eyebrow">status</span>
                <p className="mt-1 text-sm text-bone-200">{s.detail}</p>
              </div>
            </Card>
          );
        })}
      </section>

      <Card>
        <SectionLabel>Topology</SectionLabel>
        <pre className="mt-3 text-[11px] leading-[1.5] font-mono text-steel-300 overflow-x-auto">
{`browser  →  dashboard  →  api  ─┬─→  postgres
                                └─→  redis  ←─  worker
                prometheus  →  scrapes  api + worker
                grafana     →  queries  prometheus`}
        </pre>
      </Card>
    </div>
  );
}

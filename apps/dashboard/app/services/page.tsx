"use client";
import {
  BayTag,
  Card,
  CardEyebrow,
  DispatchLine,
  StatusPill,
} from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import type { OverviewSnapshot } from "@firedrill/shared";

const ROLES: Record<string, { role: string; line: string }> = {
  api: {
    role: "Edge / HTTP",
    line: "Fastify · scenario host · /metrics · port 4000",
  },
  worker: {
    role: "Background",
    line: "BullMQ consumer · emails / orders / invoices · /metrics on 4001",
  },
  postgres: {
    role: "Datastore",
    line: "Primary OLTP · incidents, products, orders",
  },
  redis: {
    role: "Broker",
    line: "BullMQ broker · scenario state cache",
  },
};

export default function ServicesPage() {
  const { data } = usePoll<OverviewSnapshot>("/api/overview", 3000);
  const degraded = (data?.services ?? []).filter((s) => s.status !== "healthy").length;
  return (
    <div className="space-y-8">
      <DispatchLine
        bay="04"
        page="Services"
        alarm={degraded > 0}
        state={
          degraded > 0 ? (
            <span className="text-ember-500">{degraded} bay{degraded > 1 ? "s" : ""} not green</span>
          ) : (
            <span className="text-signal-green">apparatus check ok</span>
          )
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data?.services ?? []).map((s, i) => {
          const meta = ROLES[s.service] ?? { role: "service", line: "" };
          const alarm = s.status === "down";
          return (
            <Card key={s.service} alarm={alarm} rivets>
              <div className="flex items-start justify-between">
                <div>
                  <BayTag bay={i + 1} alarm={alarm} />
                  <h3 className="mt-2 text-[1.25rem] font-semibold tracking-tight text-bone-100">
                    {s.service}
                  </h3>
                  <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-steel-400 mt-1">
                    {meta.role}
                  </div>
                </div>
                <StatusPill status={s.status} />
              </div>

              <div className="mt-5 pt-4 border-t border-concrete-700/60">
                <div className="dispatch-eyebrow text-steel-400">Role</div>
                <p className="mt-1 text-sm text-bone-200 font-mono">
                  {meta.line}
                </p>
              </div>

              <div className="mt-4">
                <div className="dispatch-eyebrow text-steel-400">Status detail</div>
                <p className="mt-1 text-sm text-bone-200">{s.detail}</p>
              </div>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardEyebrow>Topology</CardEyebrow>
        <pre className="mt-4 text-[11px] leading-[1.4] font-mono text-steel-300 overflow-x-auto">
{`browser  →  dashboard:3000  →  api:4000  ─┬─→  postgres:5432
                                          └─→  redis:6379  ←─  worker:4001
                          prometheus:9090  →  scrape  api + worker
                          grafana:3001     →  query   prometheus`}
        </pre>
      </Card>
    </div>
  );
}

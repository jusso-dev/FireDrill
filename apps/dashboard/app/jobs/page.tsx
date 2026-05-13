"use client";
import { Card, ErrorPanel, PageHeader, SectionLabel } from "@/components/ui";
import { usePoll } from "@/components/usePoll";

type JobsResp = {
  queues: { name: string; counts: Record<string, number> }[];
};

const ORDER = ["wait", "active", "delayed", "failed", "completed"] as const;

export default function JobsPage() {
  const { data, error } = usePoll<JobsResp>("/api/jobs", 2000);
  const queues = data?.queues ?? [];
  const totalFailed = queues.reduce((acc, q) => acc + (q.counts.failed ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        subtitle="BullMQ queues consumed by the worker. Each POST /api/orders fans out to two queues."
        alarm={totalFailed > 0}
        status={
          totalFailed > 0 ? (
            <span className="text-ember-500">{totalFailed} failed</span>
          ) : (
            <span className="text-signal-green">queues clean</span>
          )
        }
      />

      {error && <ErrorPanel title="Cannot reach API" message={error} />}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queues.map((q) => (
          <Card key={q.name} alarm={(q.counts.failed ?? 0) > 0}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold tracking-tight text-bone-100">
                {q.name}
              </h3>
              <span className="eyebrow">queue</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {ORDER.filter((k) => k in q.counts).map((k) => {
                const v = q.counts[k];
                const isFail = k === "failed" && v > 0;
                return (
                  <div
                    key={k}
                    className="rounded bg-[var(--bg)] border border-[var(--border)] p-3"
                  >
                    <div className="eyebrow">{k}</div>
                    <div
                      className={
                        "mt-1 font-mono text-lg tabular-nums " +
                        (isFail ? "text-ember-500" : "text-bone-100")
                      }
                    >
                      {v}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </section>

      <Card>
        <SectionLabel>About the producers</SectionLabel>
        <p className="mt-3 text-sm text-bone-200 max-w-[72ch]">
          Each <code className="text-ember-400">POST /api/orders</code> enqueues
          an <code className="text-ember-400">order</code> job and an{" "}
          <code className="text-ember-400">email</code> job. Enable{" "}
          <span className="font-mono text-bone-100">queue_backlog</span> to make
          the API enqueue extras faster than the worker can drain. Enable{" "}
          <span className="font-mono text-bone-100">worker_failure</span> to
          have the worker throw on a fraction of every job.
        </p>
      </Card>
    </div>
  );
}

"use client";
import { BayTag, Card, CardEyebrow, DispatchLine } from "@/components/ui";
import { usePoll } from "@/components/usePoll";

type JobsResp = {
  queues: { name: string; counts: Record<string, number> }[];
};

const ORDER = ["wait", "active", "delayed", "failed", "completed"];

export default function JobsPage() {
  const { data } = usePoll<JobsResp>("/api/jobs", 2000);
  const totalFailed = (data?.queues ?? []).reduce(
    (acc, q) => acc + (q.counts.failed ?? 0),
    0,
  );
  return (
    <div className="space-y-8">
      <DispatchLine
        bay="05"
        page="Jobs"
        alarm={totalFailed > 0}
        state={
          totalFailed > 0 ? (
            <span className="text-ember-500">{totalFailed} failed</span>
          ) : (
            <span className="text-signal-green">queues clean</span>
          )
        }
      />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(data?.queues ?? []).map((q, i) => (
          <Card key={q.name} alarm={(q.counts.failed ?? 0) > 0}>
            <div className="flex items-center justify-between">
              <BayTag bay={i + 1} alarm={(q.counts.failed ?? 0) > 0} />
              <span className="dispatch-eyebrow text-steel-400">queue</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-bone-100">
              {q.name}
            </h3>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {ORDER.filter((k) => k in q.counts).map((k) => {
                const v = q.counts[k];
                const isFail = k === "failed" && v > 0;
                return (
                  <div
                    key={k}
                    className="rounded-[2px] bg-concrete-900/80 border border-concrete-700 p-3"
                  >
                    <div className="dispatch-eyebrow text-concrete-600">
                      {k}
                    </div>
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
        <CardEyebrow>About the producers</CardEyebrow>
        <p className="mt-3 text-sm text-bone-200 max-w-[72ch]">
          The API enqueues an <code className="text-ember-400">order</code> and
          an <code className="text-ember-400">email</code> job for every POST
          /api/orders. Enable{" "}
          <span className="font-mono text-bone-100">queue_backlog</span> to make
          the API enqueue extras until the worker can&apos;t keep up. Enable{" "}
          <span className="font-mono text-bone-100">worker_failure</span> to
          have the worker throw on a fraction of every job.
        </p>
      </Card>
    </div>
  );
}

"use client";
import { BayTag, Card, CardEyebrow, DispatchLine } from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import type { Scenario } from "@firedrill/shared";

type Runbook = {
  scenarioId: string;
  title: string;
  symptoms: string[];
  detection: string[];
  immediateMitigation: string[];
  longTermFix: string[];
  usefulCommands: string[];
};

type Resp = {
  runbooks: { scenario: Scenario; runbook: Runbook }[];
};

export default function RunbooksPage() {
  const { data } = usePoll<Resp>("/api/runbooks", 30000);
  return (
    <div className="space-y-8">
      <DispatchLine
        bay="08"
        page="Runbooks"
        state={
          <span className="text-steel-300">
            {data?.runbooks.length ?? 0} drills on file
          </span>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {(data?.runbooks ?? []).map(({ scenario, runbook }, i) => (
          <Card key={scenario.id} className="scroll-mt-24" rivets>
            <a id={scenario.id} />
            <div className="flex items-center justify-between">
              <BayTag bay={i + 1} />
              <span className="dispatch-eyebrow text-steel-400">
                {scenario.id}
              </span>
            </div>
            <h3 className="mt-2 text-[1.5rem] leading-tight font-semibold tracking-tight text-bone-100">
              {runbook.title}
            </h3>
            <Block title="Symptoms" items={runbook.symptoms} />
            <Block title="How to detect" items={runbook.detection} />
            <Block
              title="Immediate mitigation"
              items={runbook.immediateMitigation}
              numbered
            />
            <Block title="Long-term fix" items={runbook.longTermFix} />
            <Block
              title="Useful commands"
              items={runbook.usefulCommands}
              mono
            />
          </Card>
        ))}
      </section>
    </div>
  );
}

function Block({
  title,
  items,
  mono,
  numbered,
}: {
  title: string;
  items: string[];
  mono?: boolean;
  numbered?: boolean;
}) {
  return (
    <div className="mt-5 pt-4 border-t border-concrete-700/60">
      <CardEyebrow>{title}</CardEyebrow>
      <ul className="mt-2 space-y-1.5">
        {items.map((s, i) => (
          <li
            key={i}
            className={
              "flex gap-3 text-sm " +
              (mono ? "font-mono text-steel-300" : "text-bone-200")
            }
          >
            <span
              className={
                "font-mono text-[11px] tabular-nums " +
                (numbered ? "text-ember-500" : "text-concrete-600")
              }
            >
              {numbered ? String(i + 1).padStart(2, "0") : "·"}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

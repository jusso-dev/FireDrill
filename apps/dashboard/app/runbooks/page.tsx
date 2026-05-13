"use client";
import { Card, ErrorPanel, PageHeader, SectionLabel } from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import type { Scenario } from "@firedrill/shared";
import { useMemo, useState } from "react";

interface Runbook {
  scenarioId: string;
  title: string;
  symptoms: string[];
  detection: string[];
  immediateMitigation: string[];
  longTermFix: string[];
  usefulCommands: string[];
}

type Resp = {
  runbooks: { scenario: Scenario; runbook: Runbook }[];
};

export default function RunbooksPage() {
  const { data, error } = usePoll<Resp>("/api/runbooks", 30_000);
  const [query, setQuery] = useState("");

  const runbooks = data?.runbooks ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return runbooks;
    return runbooks.filter(({ scenario, runbook }) => {
      return (
        scenario.name.toLowerCase().includes(q) ||
        scenario.id.toLowerCase().includes(q) ||
        runbook.symptoms.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [runbooks, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Runbooks"
        subtitle="One runbook per scenario: symptoms, detection, mitigation, and prevention."
        status={
          <span className="text-steel-300">
            {filtered.length} of {runbooks.length}
          </span>
        }
      />

      {error && <ErrorPanel title="Cannot reach API" message={error} />}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="search runbooks…"
        className="w-full md:w-80 bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono text-bone-100 placeholder-steel-500 focus:outline-none focus:border-ember-700"
      />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map(({ scenario, runbook }) => (
          <Card key={scenario.id} className="scroll-mt-24">
            <a id={scenario.id} />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-bone-100">
                {runbook.title}
              </h3>
              <span className="eyebrow">{scenario.id}</span>
            </div>
            <Block title="Symptoms" items={runbook.symptoms} />
            <Block title="How to detect" items={runbook.detection} />
            <Block title="Immediate mitigation" items={runbook.immediateMitigation} numbered />
            <Block title="Long-term fix" items={runbook.longTermFix} />
            <Block title="Useful commands" items={runbook.usefulCommands} mono />
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
    <div className="mt-4 pt-3 border-t border-[var(--border)]">
      <SectionLabel>{title}</SectionLabel>
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
                "font-mono text-[11px] tabular-nums shrink-0 " +
                (numbered ? "text-ember-500" : "text-steel-500")
              }
            >
              {numbered ? `${String(i + 1).padStart(2, "0")}.` : "·"}
            </span>
            <span className="break-words">{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

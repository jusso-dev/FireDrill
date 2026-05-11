"use client";
import { cn } from "@/lib/cn";
import { type ReactNode } from "react";

/* ------------------------------ surfaces -------------------------------- */

export function Card({
  className,
  children,
  rivets = false,
  alarm = false,
}: {
  className?: string;
  children: ReactNode;
  rivets?: boolean;
  alarm?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-[3px] bg-concrete-800 border border-concrete-700",
        "shadow-bay overflow-hidden",
        alarm && "border-ember-700 bg-gradient-to-br from-ember-950/80 to-concrete-800 shadow-emberglow",
        rivets && "rivets",
        className,
      )}
    >
      {rivets && (
        <>
          <span className="rivet-tl" />
          <span className="rivet-tr" />
          <span className="rivet-bl" />
          <span className="rivet-br" />
        </>
      )}
      <div className="p-5 relative">{children}</div>
    </div>
  );
}

export function CardEyebrow({
  children,
  alarm = false,
}: {
  children: ReactNode;
  alarm?: boolean;
}) {
  return (
    <div
      className={cn(
        "dispatch-eyebrow",
        alarm ? "text-ember-500" : "text-steel-400",
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <CardEyebrow>{children}</CardEyebrow>;
}

/* --------------------------------- bay tag ------------------------------ */

export function BayTag({
  bay,
  alarm = false,
  className,
}: {
  bay: string | number;
  alarm?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5",
        "bay-tag text-[10px]",
        alarm ? "text-ember-500" : "text-concrete-600",
        className,
      )}
    >
      <span className="text-[8px] tracking-[0.3em] text-concrete-600">BAY</span>
      <span>{typeof bay === "number" ? String(bay).padStart(2, "0") : bay}</span>
    </span>
  );
}

/* -------------------------------- metrics ------------------------------- */

export function MetricTile({
  bay,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  bay: number | string;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const valueTone = {
    neutral: "text-bone-100",
    good: "text-signal-green",
    warn: "text-signal-yellow",
    bad: "text-ember-500",
  }[tone];

  const indicator = {
    neutral: null,
    good: <DotPill tone="good" />,
    warn: <DotPill tone="warn" />,
    bad: <DotPill tone="bad" />,
  }[tone];

  return (
    <div className="relative rounded-[3px] bg-concrete-800 border border-concrete-700 shadow-bay overflow-hidden">
      {/* top hairline + label strip */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5 border-b border-concrete-700/60 steel-surface">
        <div className="flex items-center gap-2">
          <BayTag bay={bay} alarm={tone === "bad"} />
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-steel-400">
            {label}
          </span>
        </div>
        {indicator}
      </div>
      <div className="px-4 pt-4 pb-4">
        <div className={cn("font-mono text-[1.95rem] leading-none tabular-nums", valueTone)}>
          {value}
        </div>
        {hint && (
          <div className="mt-2 text-[11px] text-steel-500 font-mono tracking-wide">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

function DotPill({ tone }: { tone: "good" | "warn" | "bad" }) {
  const cls = {
    good: "bg-signal-green",
    warn: "bg-signal-yellow",
    bad: "bg-ember-500",
  }[tone];
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        cls,
        tone === "bad" && "alarm-pulse shadow-[0_0_8px_oklch(0.64_0.21_38/_0.8)]",
      )}
    />
  );
}

/* -------------------------------- status -------------------------------- */

export function StatusDot({
  status,
  pulse = false,
}: {
  status: "healthy" | "degraded" | "down";
  pulse?: boolean;
}) {
  const cls = {
    healthy: "bg-signal-green shadow-[0_0_8px_oklch(0.72_0.16_155/0.6)]",
    degraded: "bg-signal-yellow shadow-[0_0_8px_oklch(0.83_0.16_92/0.55)]",
    down: "bg-ember-500 shadow-[0_0_10px_oklch(0.64_0.21_38/0.8)]",
  }[status];
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        cls,
        pulse && status !== "healthy" && "alarm-pulse",
      )}
    />
  );
}

export function StatusPill({
  status,
}: {
  status: "healthy" | "degraded" | "down";
}) {
  const cls = {
    healthy: "border-signal-green/40 text-signal-green",
    degraded: "border-signal-yellow/40 text-signal-yellow",
    down: "border-ember-500/50 text-ember-500",
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-concrete-900/80",
        "font-mono text-[10px] uppercase tracking-[0.18em]",
        cls,
      )}
    >
      <StatusDot status={status} pulse={status !== "healthy"} />
      {status}
    </span>
  );
}

/* --------------------------------- badge -------------------------------- */

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const cls = {
    neutral: "border-concrete-600 text-steel-300 bg-concrete-900",
    good: "border-signal-green/40 text-signal-green bg-signal-green-dim/15",
    warn: "border-signal-yellow/40 text-signal-yellow bg-signal-yellow-dim/15",
    bad: "border-ember-500/40 text-ember-500 bg-ember-950/40",
    info: "border-signal-ice/40 text-signal-ice bg-signal-ice-dim/15",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border",
        "font-mono text-[10px] uppercase tracking-[0.18em]",
        cls,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------- button ------------------------------- */

export function Button({
  variant = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "danger" | "ghost" | "alarm";
}) {
  const v = {
    default:
      "bg-bone-100 hover:bg-bone-200 text-concrete-950 border border-bone-200/40 font-semibold",
    alarm:
      "bg-ember-600 hover:bg-ember-500 text-bone-100 border border-ember-500 shadow-[0_8px_24px_-12px_oklch(0.56_0.20_35/0.6)]",
    danger:
      "bg-ember-900 hover:bg-ember-800 text-bone-100 border border-ember-700",
    ghost:
      "bg-transparent hover:bg-concrete-800 text-steel-300 border border-concrete-700",
  }[variant];
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-[2px]",
        "font-mono text-[11px] tracking-[0.18em] uppercase",
        "transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
        v,
        className,
      )}
    />
  );
}

/* ------------------------------ dispatch line --------------------------- */

export function DispatchLine({
  bay,
  page,
  state,
  alarm = false,
}: {
  bay: string;
  page: string;
  state: ReactNode;
  alarm?: boolean;
}) {
  return (
    <header className="relative">
      <div
        className={cn(
          "absolute -top-1 left-0 right-0 h-0.5",
          alarm ? "alarm-strip" : "hairline",
        )}
      />
      <div className="flex items-end justify-between gap-6 pt-4">
        <div>
          <div className="flex items-center gap-3">
            <BayTag bay={bay} alarm={alarm} />
            <span className="dispatch-eyebrow text-steel-400">Dispatch</span>
          </div>
          <h1
            className={cn(
              "mt-2 text-[2.1rem] leading-none font-semibold tracking-tight",
              alarm ? "text-ember-500" : "text-bone-100",
            )}
          >
            {page}
          </h1>
        </div>
        <div className="text-right">
          <div className="dispatch-eyebrow text-steel-400">Status</div>
          <div className="mt-2 text-sm font-mono text-steel-300">{state}</div>
        </div>
      </div>
    </header>
  );
}

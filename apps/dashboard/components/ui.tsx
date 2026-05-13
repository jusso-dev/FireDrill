"use client";
import { cn } from "@/lib/cn";
import { type ReactNode } from "react";

/* -------------------------- surfaces -------------------------- */

export function Card({
  className,
  children,
  alarm = false,
}: {
  className?: string;
  children: ReactNode;
  alarm?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-[var(--surface)] p-5",
        alarm
          ? "border-ember-700/70 bg-gradient-to-br from-ember-950/40 to-[var(--surface)]"
          : "border-[var(--border)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({
  children,
  alarm = false,
  className,
}: {
  children: ReactNode;
  alarm?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "eyebrow",
        alarm ? "text-ember-500" : undefined,
        className,
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------- metrics --------------------------- */

type Tone = "neutral" | "good" | "warn" | "bad";

const VALUE_TONE: Record<Tone, string> = {
  neutral: "text-bone-100",
  good: "text-signal-green",
  warn: "text-signal-yellow",
  bad: "text-ember-500",
};

const DOT_TONE: Record<Exclude<Tone, "neutral">, string> = {
  good: "bg-signal-green",
  warn: "bg-signal-yellow",
  bad: "bg-ember-500",
};

export function MetricTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {tone !== "neutral" && (
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              DOT_TONE[tone],
              tone === "bad" && "pulse",
            )}
          />
        )}
      </div>
      <div className={cn("mt-2 font-mono text-3xl leading-none tabular-nums", VALUE_TONE[tone])}>
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-[11px] text-steel-500 font-mono">{hint}</div>
      )}
    </div>
  );
}

/* -------------------------- status ---------------------------- */

type Status = "healthy" | "degraded" | "down";

export function StatusDot({
  status,
  pulse = false,
}: {
  status: Status;
  pulse?: boolean;
}) {
  const cls = {
    healthy: "bg-signal-green",
    degraded: "bg-signal-yellow",
    down: "bg-ember-500",
  }[status];
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        cls,
        pulse && status !== "healthy" && "pulse",
      )}
    />
  );
}

export function StatusPill({ status }: { status: Status }) {
  const cls = {
    healthy: "border-signal-green/40 text-signal-green",
    degraded: "border-signal-yellow/40 text-signal-yellow",
    down: "border-ember-500/50 text-ember-500",
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-[var(--bg)]",
        "font-mono text-[10px] uppercase tracking-wider",
        cls,
      )}
    >
      <StatusDot status={status} pulse={status !== "healthy"} />
      {status}
    </span>
  );
}

/* -------------------------- badge ----------------------------- */

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const cls = {
    neutral: "border-[var(--border)] text-steel-300 bg-[var(--bg)]",
    good: "border-signal-green/40 text-signal-green bg-signal-green-dim/15",
    warn: "border-signal-yellow/40 text-signal-yellow bg-signal-yellow-dim/15",
    bad: "border-ember-500/40 text-ember-500 bg-ember-950/40",
    info: "border-signal-ice/40 text-signal-ice bg-signal-ice-dim/15",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border",
        "font-mono text-[10px] uppercase tracking-wider",
        cls,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------- button ---------------------------- */

export function Button({
  variant = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "danger" | "ghost" | "alarm" | "primary";
}) {
  const v = {
    default:
      "bg-bone-100 hover:bg-bone-200 text-concrete-950 border border-bone-200/40 font-semibold",
    primary:
      "bg-bone-100 hover:bg-bone-200 text-concrete-950 border border-bone-200/40 font-semibold",
    alarm:
      "bg-ember-600 hover:bg-ember-500 text-bone-100 border border-ember-500 shadow-[0_4px_16px_-8px_oklch(0.56_0.20_35/0.6)]",
    danger:
      "bg-ember-900 hover:bg-ember-800 text-bone-100 border border-ember-700",
    ghost:
      "bg-transparent hover:bg-concrete-800 text-steel-300 border border-[var(--border)]",
  }[variant];
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded",
        "font-medium text-xs tracking-wide",
        "transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
        v,
        className,
      )}
    />
  );
}

/* -------------------------- header ---------------------------- */

export function PageHeader({
  title,
  subtitle,
  status,
  alarm = false,
  actions,
}: {
  title: string;
  subtitle?: string;
  status?: ReactNode;
  alarm?: boolean;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight",
            alarm ? "text-ember-500" : "text-bone-100",
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-steel-400 max-w-[64ch]">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {status && (
          <div className="text-sm font-mono text-steel-300">{status}</div>
        )}
        {actions}
      </div>
    </header>
  );
}

/* -------------------------- error ----------------------------- */

export function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <Card alarm>
      <SectionLabel alarm>{title}</SectionLabel>
      <p className="mt-2 text-sm font-mono text-ember-400 break-words">{message}</p>
      <p className="mt-2 text-xs text-steel-400">
        Check the API is running:{" "}
        <code className="text-bone-200">docker compose ps api</code>
      </p>
    </Card>
  );
}

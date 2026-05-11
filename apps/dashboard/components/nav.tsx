"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Overview", bay: "01" },
  { href: "/incidents", label: "Incidents", bay: "02" },
  { href: "/scenarios", label: "Scenarios", bay: "03" },
  { href: "/services", label: "Services", bay: "04" },
  { href: "/jobs", label: "Jobs", bay: "05" },
  { href: "/logs", label: "Logs", bay: "06" },
  { href: "/reports", label: "Reports", bay: "07" },
  { href: "/runbooks", label: "Runbooks", bay: "08" },
  { href: "/settings", label: "Settings", bay: "09" },
];

function StationMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-9 w-9"
      role="img"
      aria-label="FireDrill emblem"
    >
      <defs>
        <linearGradient id="emblem-ember" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.72 0.19 42)" />
          <stop offset="1" stopColor="oklch(0.50 0.18 34)" />
        </linearGradient>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="oklch(0.20 0.010 40)"
        stroke="oklch(0.36 0.012 40)"
      />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke="oklch(0.30 0.012 40)"
        strokeDasharray="2 3"
      />
      {/* axe + hose-cross silhouette */}
      <path
        d="M20 44 L36 18"
        stroke="oklch(0.74 0.010 220)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M44 44 L28 18"
        stroke="oklch(0.74 0.010 220)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* central flame */}
      <path
        d="M32 22 C36 28 38 32 36 38 C34 42 30 42 28 38 C26 32 28 28 32 22 Z"
        fill="url(#emblem-ember)"
      />
      <text
        x="32"
        y="58"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="6"
        fill="oklch(0.62 0.011 220)"
        letterSpacing="0.18em"
      >
        F.D
      </text>
    </svg>
  );
}

function StationClock() {
  const [time, setTime] = useState<string>(() => formatNow());
  useEffect(() => {
    const t = setInterval(() => setTime(formatNow()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[11px] tracking-[0.18em] text-steel-400">
      {time}
    </span>
  );
}

function formatNow() {
  const d = new Date();
  return d
    .toLocaleTimeString([], { hour12: false })
    .replace(/(\d{2}):(\d{2}):(\d{2})/, "$1:$2:$3");
}

export function SideNav() {
  const path = usePathname();
  return (
    <aside
      className={cn(
        "hidden lg:flex lg:w-[240px] shrink-0 flex-col",
        "border-r border-concrete-700",
        "bg-concrete-900 relative",
      )}
      style={{
        boxShadow:
          "inset -8px 0 24px -16px oklch(0.05 0.005 40 / 0.9), 24px 0 64px -32px oklch(0.05 0.005 40 / 0.7)",
      }}
    >
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <StationMark />
          <div>
            <div className="dispatch-eyebrow text-ember-500">Station 24</div>
            <h1 className="bay-tag text-[1.35rem] leading-none text-bone-100 mt-1">
              FireDrill
            </h1>
          </div>
        </div>
        <div className="hairline mt-5" />
        <div className="mt-3 flex items-center justify-between">
          <span className="dispatch-eyebrow text-steel-400">on duty</span>
          <StationClock />
        </div>
      </div>

      <nav className="flex flex-col px-3 pb-4">
        {links.map((l) => {
          const active =
            l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "group relative grid grid-cols-[28px_1fr] items-center gap-3 px-3 py-2.5 rounded-[2px]",
                "transition-colors duration-150",
                active
                  ? "bg-ember-950/70 text-bone-100"
                  : "text-steel-400 hover:bg-concrete-800 hover:text-bone-100",
              )}
            >
              <span
                className={cn(
                  "bay-tag text-[10px] leading-none text-right",
                  active ? "text-ember-500" : "text-concrete-600 group-hover:text-steel-400",
                )}
              >
                {l.bay}
              </span>
              <span className="font-mono text-[12.5px] tracking-[0.06em] uppercase">
                {l.label}
              </span>
              {active && (
                <span
                  aria-hidden
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-ember-500 shadow-[0_0_8px_oklch(0.64_0.21_38/_0.8)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 pb-5">
        <div className="hairline mb-3" />
        <div className="flex items-end justify-between">
          <div>
            <div className="dispatch-eyebrow text-concrete-600">SHIFT</div>
            <div className="font-mono text-xs text-steel-300">B · NIGHT</div>
          </div>
          <div className="text-right">
            <div className="dispatch-eyebrow text-concrete-600">BUILD</div>
            <div className="font-mono text-xs text-steel-300">v0.1.0</div>
          </div>
        </div>
        <p className="mt-4 text-[10px] leading-relaxed font-mono text-concrete-600 uppercase tracking-[0.14em]">
          drill apparatus only.<br />not for prod fire.
        </p>
      </div>
    </aside>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Overview" },
  { href: "/incidents", label: "Incidents" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/services", label: "Services" },
  { href: "/jobs", label: "Jobs" },
  { href: "/logs", label: "Logs" },
  { href: "/reports", label: "Reports" },
  { href: "/runbooks", label: "Runbooks" },
  { href: "/settings", label: "Settings" },
];

function Mark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-7 w-7"
      role="img"
      aria-label="FireDrill"
    >
      <defs>
        <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.72 0.19 42)" />
          <stop offset="1" stopColor="oklch(0.50 0.18 34)" />
        </linearGradient>
      </defs>
      <path
        d="M16 4 C20 11 22 14 20 21 C18.5 25 13.5 25 12 21 C10 14 12 11 16 4 Z"
        fill="url(#flame)"
      />
    </svg>
  );
}

export function SideNav() {
  const path = usePathname();
  return (
    <aside
      className={cn(
        "hidden lg:flex lg:w-[220px] shrink-0 flex-col",
        "border-r border-[var(--border)] bg-[var(--surface)]",
      )}
    >
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Mark />
          <span className="text-base font-semibold tracking-tight text-bone-100 group-hover:text-ember-500 transition-colors">
            FireDrill
          </span>
        </Link>
      </div>

      <nav className="flex flex-col px-2 pb-4 gap-0.5">
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center px-3 py-2 rounded text-sm transition-colors",
                active
                  ? "bg-ember-950/50 text-bone-100"
                  : "text-steel-300 hover:bg-concrete-800 hover:text-bone-100",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-ember-500"
                />
              )}
              <span className="ml-1">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 pb-5">
        <p className="text-[11px] leading-relaxed text-steel-500">
          SRE incident simulator.<br />Not for production use.
        </p>
      </div>
    </aside>
  );
}

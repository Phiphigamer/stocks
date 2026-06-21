"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/forecast", label: "AI Forecast" },
  { href: "/portfolio/claude", label: "Claude Portfolio" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">TS</span>
          <span>
            TechMarket Signals
            <br />
            <small>Global Tech Intelligence</small>
          </span>
        </Link>
        <div className="nav-links">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={active ? "active" : ""}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

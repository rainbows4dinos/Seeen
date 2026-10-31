"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const ITEMS = [
  { href: "/", label: "Directory", match: (p: string) => p === "/" || p.startsWith("/connections") || p === "/export" },
  { href: "/scenes", label: "Scenes", match: (p: string) => p.startsWith("/scenes") },
  { href: "/follow-ups", label: "Follow-ups", match: (p: string) => p.startsWith("/follow-ups") },
];

// Nav chips (Figma "Nav Chip"): the current section inverts. Reading the
// path is request data, so the static fallback renders first.
export function MainNav() {
  return (
    <Suspense fallback={<Chips pathname={null} />}>
      <CurrentChips />
    </Suspense>
  );
}

function CurrentChips() {
  return <Chips pathname={usePathname()} />;
}

function Chips({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex flex-wrap gap-1.5">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="nav-chip"
          aria-current={pathname && item.match(pathname) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

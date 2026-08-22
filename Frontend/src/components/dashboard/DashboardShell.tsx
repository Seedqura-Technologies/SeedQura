"use client";

import { AppShell } from "@/components/layout/AppShell";

const links = [
  { href: "/dashboard", label: "Dashboard", tab: "home" },
  { href: "/dashboard?tab=products", label: "Products", tab: "products" },
  { href: "/dashboard?tab=purchased", label: "Purchased", tab: "purchased" },
];

export function DashboardShell({
  children,
  title,
  tab,
}: {
  children: React.ReactNode;
  title: string;
  tab: string;
}) {
  return (
    <AppShell
      title={title}
      badge="Student"
      links={links.map((l) => ({
        href: l.href,
        label: l.label,
        active: tab === l.tab,
      }))}
    >
      {children}
    </AppShell>
  );
}

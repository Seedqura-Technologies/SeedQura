"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/schedules", label: "Schedules" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/enrollments", label: "Enrollments" },
  { href: "/admin/export", label: "Export" },
];

export function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();

  return (
    <AppShell
      title={title}
      badge="Admin"
      links={links.map((l) => ({
        href: l.href,
        label: l.label,
        active:
          l.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(l.href),
      }))}
    >
      {children}
    </AppShell>
  );
}

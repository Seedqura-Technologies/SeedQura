"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MagneticButton } from "@/components/ui/MagneticButton";

type Course = {
  id: string;
  name: string;
  description: string;
  duration: string;
  schedule_summary: string;
  price_display: string;
  price_inr: number | null;
  display_status: string;
  featured: boolean;
};

type Enrollment = {
  id: string;
  status: string;
  payment_status: string;
  progress_pct: number;
  course: Course | null;
};

type Me = {
  profile: { full_name: string; email: string | null; role: string };
  enrollments: Enrollment[];
  notifications: {
    id: string;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string;
  }[];
  unreadCount: number;
  profileComplete: boolean;
  upcomingSessions: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    meeting_url: string | null;
    instructor_name: string;
    course?: { id: string; name: string } | null;
  }[];
};

export function StudentDashboard() {
  const search = useSearchParams();
  const tab = search.get("tab") || "home";
  const [me, setMe] = useState<Me | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meData, coursesData] = await Promise.all([
          apiFetch("/student/me"),
          apiFetch("/courses"),
        ]);
        if (cancelled) return;
        setMe(meData);
        setCourses(coursesData.courses || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title = useMemo(() => {
    if (tab === "products") return "Products";
    if (tab === "purchased") return "Purchased Products";
    return "Dashboard";
  }, [tab]);

  async function markAllRead() {
    await apiFetch("/student/notifications/read-all", { method: "POST" });
    setMe((prev) =>
      prev
        ? {
            ...prev,
            unreadCount: 0,
            notifications: prev.notifications.map((n) => ({
              ...n,
              read_at: n.read_at || new Date().toISOString(),
            })),
          }
        : prev
    );
  }

  if (loading) {
    return (
      <DashboardShell title="Dashboard" tab={tab}>
        <p className="text-muted">Loading…</p>
      </DashboardShell>
    );
  }

  if (error || !me) {
    return (
      <DashboardShell title="Dashboard" tab={tab}>
        <p className="text-red-600">{error || "Unable to load dashboard"}</p>
      </DashboardShell>
    );
  }

  const name = me.profile.full_name || "there";

  return (
    <DashboardShell title={title} tab={tab}>
      {tab === "home" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Welcome
            </p>
            <h2 className="mt-3 text-2xl font-medium text-text">
              Welcome, {name}! We&apos;re glad to have you here.
            </h2>
            <p className="mt-3 text-muted">
              Browse products, enroll in courses, and track your purchases here.
            </p>
          </div>

          <div className="glass-card p-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Profile
            </p>
            <p className="mt-3 text-lg text-text">
              {me.profileComplete ? "Profile complete" : "Complete your profile"}
            </p>
            <p className="mt-2 text-sm text-muted">{me.profile.email}</p>
          </div>

          <div className="glass-card p-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Upcoming classes
            </p>
            <ul className="mt-4 space-y-3">
              {(me.upcomingSessions || []).slice(0, 5).map((s) => (
                <li key={s.id} className="text-sm">
                  <p className="font-medium text-text">
                    {s.title}
                    {s.course?.name ? (
                      <span className="font-normal text-muted">
                        {" "}
                        · {s.course.name}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-muted">
                    {new Date(s.starts_at).toLocaleString()}
                    {s.instructor_name ? ` · ${s.instructor_name}` : ""}
                  </p>
                  {s.meeting_url && (
                    <a
                      href={s.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent"
                    >
                      Join class
                    </a>
                  )}
                </li>
              ))}
              {(me.upcomingSessions || []).length === 0 && (
                <li className="text-sm text-muted">
                  No upcoming sessions yet. You&apos;ll be notified by email when
                  a class is scheduled.
                </li>
              )}
            </ul>
          </div>

          <div className="glass-card p-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                Notifications ({me.unreadCount})
              </p>
              {me.unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-medium text-accent"
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="mt-4 space-y-3">
              {me.notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="text-sm">
                  <p className={n.read_at ? "text-muted" : "font-medium text-text"}>
                    {n.title}
                  </p>
                  {n.body && <p className="text-muted">{n.body}</p>}
                </li>
              ))}
              {me.notifications.length === 0 && (
                <li className="text-sm text-muted">No notifications yet.</li>
              )}
            </ul>
          </div>

          <div className="glass-card p-8 lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Recent activity
            </p>
            <p className="mt-3 text-sm text-muted">
              {me.enrollments.length
                ? `You have ${me.enrollments.length} enrollment(s).`
                : "No recent enrollments yet."}
            </p>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((c) => (
            <article key={c.id} className="glass-card flex flex-col p-8">
              <h2 className="text-xl font-medium text-text">{c.name}</h2>
              <p className="mt-3 flex-1 text-sm text-muted">{c.description}</p>
              <div className="mt-4 space-y-1 text-xs text-muted">
                <p>Duration: {c.duration || "—"}</p>
                <p>Schedule: {c.schedule_summary || "—"}</p>
                <p>Status: {c.display_status}</p>
              </div>
              <div className="mt-6 flex items-end justify-between gap-4">
                <p className="text-2xl font-medium text-text">
                  {c.price_display || "—"}
                </p>
                {c.price_inr != null && c.price_inr > 0 ? (
                  <MagneticButton href={`/enroll/${c.id}`} variant="primary">
                    Enroll Now
                  </MagneticButton>
                ) : (
                  <MagneticButton href="/#contact" variant="secondary">
                    Inquire
                  </MagneticButton>
                )}
              </div>
            </article>
          ))}
          {courses.length === 0 && (
            <p className="text-muted">No published courses yet.</p>
          )}
        </div>
      )}

      {tab === "purchased" && (
        <div className="space-y-4">
          {me.enrollments.map((e) => (
            <article key={e.id} className="glass-card p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium text-text">
                    {e.course?.name || "Course"}
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Enrollment: <span className="text-text">{e.status}</span>
                    {" · "}
                    Payment: <span className="text-text">{e.payment_status}</span>
                    {" · "}
                    Progress:{" "}
                    <span className="text-text">{e.progress_pct}%</span>
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {e.course?.id && (
                  <MagneticButton
                    href="/dashboard"
                    variant="secondary"
                  >
                    View upcoming sessions
                  </MagneticButton>
                )}
                <MagneticButton
                  href="#"
                  variant="secondary"
                  className="pointer-events-none opacity-50"
                >
                  Learning materials (soon)
                </MagneticButton>
                <MagneticButton
                  href="#"
                  variant="secondary"
                  className="pointer-events-none opacity-50"
                >
                  Certificate (soon)
                </MagneticButton>
              </div>
            </article>
          ))}
          {me.enrollments.length === 0 && (
            <p className="text-muted">
              No purchases yet.{" "}
              <a href="/dashboard?tab=products" className="text-accent">
                Browse products
              </a>
            </p>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

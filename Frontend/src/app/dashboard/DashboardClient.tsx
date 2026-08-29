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

function enrollmentLabel(status: string, paymentStatus: string): string {
  if (paymentStatus === "awaiting_verification") return "Pending verification";
  if (status === "active" && paymentStatus === "paid") return "Active";
  if (status === "rejected") return "Not approved";
  if (status === "pending_payment") return "Payment pending";
  if (status === "refunded") return "Refunded";
  return status.replaceAll("_", " ");
}

function paymentLabel(paymentStatus: string): string {
  if (paymentStatus === "awaiting_verification") return "Awaiting verification";
  if (paymentStatus === "paid") return "Paid";
  if (paymentStatus === "failed") return "Couldn’t verify";
  if (paymentStatus === "pending") return "Pending";
  if (paymentStatus === "refunded") return "Refunded";
  return paymentStatus.replaceAll("_", " ");
}

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  timestamp: string;
  course: { id: string; name: string } | null;
  session: { id: string; title: string } | null;
};

type Me = {
  profile: { full_name: string; email: string | null; role: string };
  enrollments: Enrollment[];
  notifications: Notification[];
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
  const [slow, setSlow] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const slowTimer = window.setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, 4000);

    (async () => {
      try {
        setLoading(true);
        setError("");
        setSlow(false);
        // Home/purchased only need /student/me — load courses when opening Products
        const meData = await apiFetch("/student/me");
        if (cancelled) return;
        setMe(meData);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load";
          const aborted =
            err instanceof Error &&
            (err.name === "AbortError" || /abort/i.test(msg));
          setError(
            aborted
              ? "The server is waking up. Please try again in a moment."
              : msg
          );
        }
      } finally {
        window.clearTimeout(slowTimer);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
    };
  }, [reloadKey]);

  useEffect(() => {
    if (tab !== "products" || courses.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const coursesData = await apiFetch("/courses");
        if (!cancelled) setCourses(coursesData.courses || []);
      } catch {
        /* products tab can show empty on failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, courses.length]);

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
              read: true,
              readAt: n.readAt || new Date().toISOString(),
            })),
          }
        : prev
    );
  }

  async function markRead(id: string) {
    await apiFetch(`/student/notifications/${id}/read`, { method: "POST" });
    setMe((prev) => {
      if (!prev) return prev;
      const wasUnread = prev.notifications.some((n) => n.id === id && !n.read);
      return {
        ...prev,
        unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
        notifications: prev.notifications.map((n) =>
          n.id === id
            ? { ...n, read: true, readAt: n.readAt || new Date().toISOString() }
            : n
        ),
      };
    });
  }

  function formatNotificationTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) {
    return (
      <DashboardShell title="Dashboard" tab={tab}>
        <div className="dashboard-loading space-y-2">
          <p>{slow ? "Waking up the server…" : "Loading…"}</p>
          {slow ? (
            <p className="text-sm text-muted">
              First load after idle can take up to a minute. Refresh usually works
              once the API is online.
            </p>
          ) : null}
        </div>
      </DashboardShell>
    );
  }

  if (error || !me) {
    return (
      <DashboardShell title="Dashboard" tab={tab}>
        <div className="space-y-4">
          <p className="text-error">{error || "Unable to load dashboard"}</p>
          <MagneticButton
            type="button"
            variant="secondary"
            onClick={() => setReloadKey((n) => n + 1)}
          >
            Try again
          </MagneticButton>
        </div>
      </DashboardShell>
    );
  }

  const name = me.profile.full_name || "there";

  return (
    <DashboardShell title={title} tab={tab}>
      {tab === "home" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-8">
            <p className="eyebrow-pill mb-4 inline-flex">Welcome</p>
            <h2 className="text-2xl font-medium text-text">
              Welcome, {name}! We&apos;re glad to have you here.
            </h2>
            <p className="mt-3 text-muted">
              Browse products, enroll in courses, and track your purchases here.
            </p>
          </div>

          <div className="glass-card p-8">
            <p className="eyebrow-pill mb-4 inline-flex">Profile</p>
            <p className="text-lg text-text">
              {me.profileComplete ? "Profile complete" : "Complete your profile"}
            </p>
            <p className="mt-2 text-sm text-muted">{me.profile.email}</p>
          </div>

          <div className="glass-card p-8">
            <p className="eyebrow-pill mb-4 inline-flex">Upcoming classes</p>
            <ul className="space-y-3">
              {(me.upcomingSessions || []).slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="border-b border-[var(--border)] pb-3 text-sm last:border-0 last:pb-0"
                >
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
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="eyebrow-pill inline-flex">
                Notifications ({me.unreadCount})
              </p>
              {me.unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-accent transition-opacity hover:opacity-80"
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-72 space-y-0 overflow-y-auto">
              {me.notifications.slice(0, 8).map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-[var(--border)] py-3 text-sm last:border-0 ${
                    n.read ? "" : "bg-[var(--surface)]/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={n.read ? "text-muted" : "font-medium text-text"}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="shrink-0 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-1 text-xs leading-relaxed text-muted">{n.body}</p>
                  )}
                  <p className="mt-2 text-[11px] text-muted">
                    {n.course?.name ? (
                      <span>{n.course.name}</span>
                    ) : null}
                    {n.course?.name && n.session?.title ? " · " : null}
                    {n.session?.title ? <span>{n.session.title}</span> : null}
                    {(n.course?.name || n.session?.title) && n.timestamp ? " · " : null}
                    {n.timestamp ? (
                      <time dateTime={n.timestamp}>{formatNotificationTime(n.timestamp)}</time>
                    ) : null}
                  </p>
                </li>
              ))}
              {me.notifications.length === 0 && (
                <li className="text-sm text-muted">No notifications yet.</li>
              )}
            </ul>
          </div>

          <div className="glass-card p-8 lg:col-span-2">
            <p className="eyebrow-pill mb-4 inline-flex">Recent activity</p>
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
                <p className="text-2xl font-medium tabular-nums text-gradient">
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
                    Enrollment:{" "}
                    <span className="text-text">
                      {enrollmentLabel(e.status, e.payment_status)}
                    </span>
                    {" · "}
                    Payment:{" "}
                    <span
                      className={
                        e.payment_status === "awaiting_verification"
                          ? "text-amber-400"
                          : e.payment_status === "failed" ||
                              e.status === "rejected"
                            ? "text-error"
                            : "text-text"
                      }
                    >
                      {paymentLabel(e.payment_status)}
                    </span>
                    {" · "}
                    Progress:{" "}
                    <span className="text-text">{e.progress_pct}%</span>
                  </p>
                  {e.payment_status === "awaiting_verification" && (
                    <p className="mt-2 text-sm text-muted">
                      We&apos;re verifying your UTR. Access unlocks after
                      approval (usually within a few hours). If it&apos;s not
                      unlocked within 24 hours, email
                      gethelp.seedqura@gmail.com — do not pay again.
                    </p>
                  )}
                  {(e.status === "rejected" ||
                    e.payment_status === "failed") && (
                    <p className="mt-2 text-sm text-muted">
                      We couldn&apos;t match your UTR. Email{" "}
                      <a
                        href="mailto:gethelp.seedqura@gmail.com"
                        className="text-accent hover:text-text"
                      >
                        gethelp.seedqura@gmail.com
                      </a>{" "}
                      — do not pay again.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {e.status === "active" && e.payment_status === "paid" && e.course?.id && (
                  <MagneticButton
                    href="/dashboard"
                    variant="secondary"
                  >
                    View upcoming sessions
                  </MagneticButton>
                )}
                {e.status === "active" && e.payment_status === "paid" && (
                <MagneticButton
                  href="#"
                  variant="secondary"
                  className="pointer-events-none opacity-50"
                >
                  Learning materials (soon)
                </MagneticButton>
                )}
                {e.payment_status === "awaiting_verification" && (
                  <span className="inline-flex items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-300">
                    Pending verification
                  </span>
                )}
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

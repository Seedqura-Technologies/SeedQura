"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

type Session = {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  location: string;
  status: string;
  google_event_id: string | null;
};

const empty = {
  title: "",
  description: "",
  instructor_name: "",
  starts_at: "",
  ends_at: "",
  meeting_url: "",
  location: "",
};

function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string) {
  return new Date(local).toISOString();
}

export default function AdminCourseSessionsPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const [courseName, setCourseName] = useState(courseId);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function load() {
    const [coursesData, sessionsData] = await Promise.all([
      apiFetch("/admin/courses"),
      apiFetch(`/admin/courses/${courseId}/sessions`),
    ]);
    const course = (coursesData.courses || []).find(
      (c: { id: string }) => c.id === courseId
    );
    if (course) setCourseName(course.name);
    setSessions(sessionsData.sessions || []);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      const body = {
        title: form.title,
        description: form.description,
        instructor_name: form.instructor_name,
        starts_at: fromLocalInput(form.starts_at),
        ends_at: fromLocalInput(form.ends_at),
        meeting_url: form.meeting_url || null,
        location: form.location,
      };
      let result;
      if (editing) {
        result = await apiFetch(`/admin/sessions/${editing}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        result = await apiFetch(`/admin/courses/${courseId}/sessions`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setInfo(
        `Saved. Notified ${result.notified ?? 0} enrolled student(s)${
          result.googleEventId ? " · Google Calendar synced" : ""
        }.`
      );
      setForm(empty);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  function edit(s: Session) {
    setEditing(s.id);
    setForm({
      title: s.title,
      description: s.description || "",
      instructor_name: s.instructor_name || "",
      starts_at: toLocalInput(s.starts_at),
      ends_at: toLocalInput(s.ends_at),
      meeting_url: s.meeting_url || "",
      location: s.location || "",
    });
  }

  async function cancelSession(id: string) {
    if (!confirm("Cancel this session and notify enrolled students?")) return;
    await apiFetch(`/admin/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
    await load();
  }

  async function removeSession(id: string) {
    if (!confirm("Delete this session?")) return;
    await apiFetch(`/admin/sessions/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AdminShell title={`Sessions · ${courseName}`}>
      <p className="mb-6 text-sm text-muted">
        <Link href="/admin/courses" className="text-accent">
          ← Courses
        </Link>
        {" · "}
        Creating or updating a session emails enrolled students and syncs Google
        Calendar when configured.
      </p>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {info && <p className="mb-4 text-accent">{info}</p>}

      <form
        onSubmit={onSubmit}
        className="glass-card mb-10 grid gap-3 p-6 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 text-lg font-medium text-text">
          {editing ? "Edit session" : "Add session"}
        </h2>
        <input
          required
          placeholder="Session title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <input
          placeholder="Instructor"
          value={form.instructor_name}
          onChange={(e) =>
            setForm({ ...form, instructor_name: e.target.value })
          }
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <label className="text-sm text-muted">
          Starts
          <input
            required
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm text-text"
          />
        </label>
        <label className="text-sm text-muted">
          Ends
          <input
            required
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm text-text"
          />
        </label>
        <input
          placeholder="Meeting URL (Zoom / Meet)"
          value={form.meeting_url}
          onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <input
          placeholder="Location (optional)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="md:col-span-2 rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
          rows={3}
        />
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2 text-sm text-white"
          >
            {editing ? "Update & notify" : "Create & notify"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
              className="rounded-xl border border-[var(--glass-border)] px-4 py-2 text-sm"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[var(--glass-border)] bg-white/40 px-4 py-3"
          >
            <div>
              <p className="font-medium text-text">
                {s.title}{" "}
                <span className="text-xs text-muted">({s.status})</span>
              </p>
              <p className="text-xs text-muted">
                {new Date(s.starts_at).toLocaleString()} →{" "}
                {new Date(s.ends_at).toLocaleString()}
              </p>
              {s.instructor_name && (
                <p className="text-xs text-muted">Instructor: {s.instructor_name}</p>
              )}
              {s.meeting_url && (
                <a
                  href={s.meeting_url}
                  className="text-xs text-accent"
                  target="_blank"
                  rel="noreferrer"
                >
                  Meeting link
                </a>
              )}
            </div>
            <div className="flex gap-3 text-sm">
              {s.status !== "cancelled" && (
                <>
                  <button
                    type="button"
                    className="text-accent"
                    onClick={() => edit(s)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-accent"
                    onClick={() => cancelSession(s.id)}
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                type="button"
                className="text-red-600"
                onClick={() => removeSession(s.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-muted">No sessions yet for this course.</p>
        )}
      </div>
    </AdminShell>
  );
}

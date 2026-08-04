"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

type Course = {
  id: string;
  name: string;
  description: string;
  duration: string;
  schedule_summary: string;
  price_inr: number | null;
  price_display: string;
  status: string;
  display_status: string;
  featured: boolean;
  seat_limit: number | null;
  registration_deadline: string | null;
  banner_url: string | null;
  tagline: string;
  category: string;
  level: string;
  format: string;
};

const emptyForm = {
  id: "",
  name: "",
  tagline: "",
  description: "",
  category: "Course",
  level: "",
  duration: "",
  format: "",
  schedule_summary: "",
  price_inr: "",
  price_display: "",
  status: "draft",
  display_status: "Open",
  seat_limit: "",
  registration_deadline: "",
  banner_url: "",
  featured: false,
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const data = await apiFetch("/admin/courses");
    setCourses(data.courses || []);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed")
    );
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const body = {
        ...form,
        price_inr: form.price_inr === "" ? null : Number(form.price_inr),
        seat_limit: form.seat_limit === "" ? null : Number(form.seat_limit),
        registration_deadline: form.registration_deadline || null,
        banner_url: form.banner_url || null,
        features: [],
      };
      if (editing) {
        await apiFetch(`/admin/courses/${editing}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/admin/courses", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  function edit(c: Course) {
    setEditing(c.id);
    setForm({
      id: c.id,
      name: c.name,
      tagline: c.tagline || "",
      description: c.description || "",
      category: c.category || "Course",
      level: c.level || "",
      duration: c.duration || "",
      format: c.format || "",
      schedule_summary: c.schedule_summary || "",
      price_inr: c.price_inr == null ? "" : String(c.price_inr),
      price_display: c.price_display || "",
      status: c.status,
      display_status: c.display_status || "Open",
      seat_limit: c.seat_limit == null ? "" : String(c.seat_limit),
      registration_deadline: c.registration_deadline || "",
      banner_url: c.banner_url || "",
      featured: c.featured,
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this course?")) return;
    await apiFetch(`/admin/courses/${id}`, { method: "DELETE" });
    await load();
  }

  async function togglePublish(c: Course) {
    const status = c.status === "published" ? "draft" : "published";
    await apiFetch(`/admin/courses/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <AdminShell title="Courses">
      {error && <p className="mb-4 text-red-600">{error}</p>}

      <form onSubmit={onSubmit} className="glass-card mb-10 grid gap-3 p-6 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-medium text-text">
          {editing ? `Edit ${editing}` : "Create course"}
        </h2>
        {!editing && (
          <input
            required
            placeholder="id (slug)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
          />
        )}
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <input
          placeholder="Tagline"
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="md:col-span-2 rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
          rows={3}
        />
        <input
          placeholder="Duration"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <input
          placeholder="Schedule summary"
          value={form.schedule_summary}
          onChange={(e) =>
            setForm({ ...form, schedule_summary: e.target.value })
          }
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <input
          placeholder="Price INR"
          value={form.price_inr}
          onChange={(e) => setForm({ ...form, price_inr: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <input
          placeholder="Price display"
          value={form.price_display}
          onChange={(e) => setForm({ ...form, price_display: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <input
          placeholder="Seat limit"
          value={form.seat_limit}
          onChange={(e) => setForm({ ...form, seat_limit: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <input
          type="date"
          placeholder="Registration deadline"
          value={form.registration_deadline}
          onChange={(e) =>
            setForm({ ...form, registration_deadline: e.target.value })
          }
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <input
          placeholder="Banner URL"
          value={form.banner_url}
          onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-3 py-2 text-sm"
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          Featured
        </label>
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2 text-sm text-white"
          >
            {editing ? "Update" : "Create"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
              className="rounded-xl border border-[var(--glass-border)] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {courses.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--glass-border)] bg-white/40 px-4 py-3"
          >
            <div>
              <p className="font-medium text-text">
                {c.name}{" "}
                <span className="text-xs text-muted">({c.status})</span>
              </p>
              <p className="text-xs text-muted">
                {c.price_display} · {c.duration}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link
                href={`/admin/courses/${c.id}/sessions`}
                className="text-accent"
              >
                Sessions
              </Link>
              <button type="button" className="text-accent" onClick={() => edit(c)}>
                Edit
              </button>
              <button
                type="button"
                className="text-accent"
                onClick={() => togglePublish(c)}
              >
                {c.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                className="text-red-600"
                onClick={() => remove(c.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

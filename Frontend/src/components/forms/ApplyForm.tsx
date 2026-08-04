"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { postJson } from "@/lib/api";

const yearOptions = [
  "1st Year UG",
  "2nd Year UG",
  "3rd Year UG",
  "4th Year UG",
  "Postgraduate",
  "Graduate / Other",
];

const interestOptions = ["Agriculture AI", "Medical AI", "Both"];

type FormState = {
  name: string;
  email: string;
  phone: string;
  institution: string;
  year: string;
  portfolio: string;
  interest: string;
  statement: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function ApplyForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    institution: "",
    year: "",
    portfolio: "",
    interest: "",
    statement: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email.";
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ""))) {
      next.phone = "Enter a valid 10-digit Indian mobile number.";
    }
    if (form.institution.trim().length < 2) {
      next.institution = "Institution is required.";
    }
    if (!form.year) next.year = "Please select your year/level.";
    if (!form.interest) next.interest = "Please select an interest area.";
    if (form.statement.trim().length < 10) {
      next.statement = "Please write at least 10 characters.";
    }
    if (form.statement.length > 500) {
      next.statement = "Statement must be 500 characters or less.";
    }
    if (form.portfolio.trim()) {
      try {
        new URL(form.portfolio);
      } catch {
        next.portfolio = "Please enter a valid URL.";
      }
    }
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await postJson<{ ok?: boolean }>("/api/apply", {
        ...form,
        portfolio: form.portfolio.trim() || null,
      });
      setSuccess(true);
    } catch {
      setFormError("Unable to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center text-accent">
        <h2 className="text-xl font-semibold">Application received!</h2>
        <p className="mt-2">
          We&apos;ll review your application and get back to you within 48 hours.
        </p>
      </div>
    );
  }

  const inputClass = "input-premium";
  const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="apply-name" className={labelClass}>
          Full name
        </label>
        <input
          id="apply-name"
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="apply-email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="apply-email"
          type="email"
          className={inputClass}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="apply-phone" className="mb-1.5 block text-sm font-medium">
          Phone
        </label>
        <input
          id="apply-phone"
          type="tel"
          className={inputClass}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="apply-institution" className="mb-1.5 block text-sm font-medium">
          College / Institution
        </label>
        <input
          id="apply-institution"
          className={inputClass}
          value={form.institution}
          onChange={(e) => setForm({ ...form, institution: e.target.value })}
        />
        {errors.institution && (
          <p className="mt-1 text-sm text-red-600">{errors.institution}</p>
        )}
      </div>

      <div>
        <label htmlFor="apply-year" className="mb-1.5 block text-sm font-medium">
          Year / Level
        </label>
        <select
          id="apply-year"
          className={inputClass}
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
        >
          <option value="">Select year / level</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
      </div>

      <div>
        <label htmlFor="apply-portfolio" className="mb-1.5 block text-sm font-medium">
          LinkedIn or GitHub <span className="text-text-muted">(optional)</span>
        </label>
        <input
          id="apply-portfolio"
          type="url"
          placeholder="https://"
          className={inputClass}
          value={form.portfolio}
          onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
        />
        {errors.portfolio && (
          <p className="mt-1 text-sm text-red-600">{errors.portfolio}</p>
        )}
      </div>

      <div>
        <label htmlFor="apply-interest" className="mb-1.5 block text-sm font-medium">
          Interest area
        </label>
        <select
          id="apply-interest"
          className={inputClass}
          value={form.interest}
          onChange={(e) => setForm({ ...form, interest: e.target.value })}
        >
          <option value="">Select interest area</option>
          {interestOptions.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        {errors.interest && <p className="mt-1 text-sm text-red-600">{errors.interest}</p>}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="apply-statement" className="text-sm font-medium">
            Why do you want to join?
          </label>
          <span className="text-xs text-text-muted">{form.statement.length}/500</span>
        </div>
        <textarea
          id="apply-statement"
          rows={5}
          maxLength={500}
          className={inputClass}
          value={form.statement}
          onChange={(e) => setForm({ ...form, statement: e.target.value })}
        />
        {errors.statement && (
          <p className="mt-1 text-sm text-red-600">{errors.statement}</p>
        )}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <MagneticButton type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Application"
        )}
      </MagneticButton>
    </form>
  );
}

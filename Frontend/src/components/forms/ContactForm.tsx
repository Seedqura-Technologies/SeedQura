"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { postJson } from "@/lib/api";

export const contactSubjects = [
  "General Inquiry",
  "Partnership",
  "Academy",
  "Research Collaboration",
] as const;

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const inputClass = "input-premium";

type ContactFormProps = {
  subject?: string;
  onSubjectChange?: (subject: string) => void;
};

export function ContactForm({ subject, onSubjectChange }: ContactFormProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: subject ?? "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (subject !== undefined && subject !== form.subject) {
      setForm((prev) => ({ ...prev, subject }));
    }
  }, [subject, form.subject]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Please enter a valid email.";
    if (!form.subject) next.subject = "Please select a subject.";
    if (form.message.trim().length < 10) next.message = "Message must be at least 10 characters.";
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
      await postJson<{ ok?: boolean }>("/api/contact", form);
      setSuccess(true);
    } catch {
      setFormError("Unable to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function setSubject(value: string) {
    setForm((prev) => ({ ...prev, subject: value }));
    onSubjectChange?.(value);
  }

  if (success) {
    return (
      <p className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center text-accent">
        Thank you! Your message has been received. We&apos;ll get back to you soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
            Name
          </label>
          <input
            id="contact-name"
            className={inputClass}
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            className={inputClass}
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
          Subject
        </label>
        <select
          id="contact-subject"
          className={inputClass}
          value={form.subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="" className="bg-card">Select a subject</option>
          {contactSubjects.map((s) => (
            <option key={s} value={s} className="bg-card">{s}</option>
          ))}
        </select>
        {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          className={inputClass}
          placeholder="Tell us about your project..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <MagneticButton type="submit" variant="primary" disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </MagneticButton>
    </form>
  );
}

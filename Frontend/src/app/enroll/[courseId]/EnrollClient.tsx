"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { LegalConsentCheckbox } from "@/components/legal/LegalConsentCheckbox";

type Props = { courseId: string };

type CourseInfo = {
  id: string;
  name: string;
  price_inr: number | null;
  price_display: string | null;
};

type Step = "terms" | "details" | "pay" | "done" | "already_pending";

const DEGREES = [
  "MBBS",
  "BDS",
  "BAMS / BHMS / BUMS",
  "B.Sc Nursing",
  "B.Pharm",
  "B.Tech / B.E.",
  "B.Sc",
  "M.Sc",
  "MD / MS",
  "PhD",
  "Other",
] as const;

const YEARS = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "Intern",
  "PG / Resident",
  "Working professional",
  "Other",
] as const;

/** Exact QR map — never fall back to a wrong amount-locked QR. */
const QR_BY_PRICE: Record<number, { src: string; label: string }> = {
  4999: { src: "/payments/upi-4999.jpg", label: "₹4,999" },
  19999: { src: "/payments/upi-19999.jpg", label: "₹19,999" },
};

function qrForPrice(priceInr: number | null | undefined): {
  src: string;
  label: string;
} | null {
  if (priceInr == null) return null;
  return QR_BY_PRICE[priceInr] ?? null;
}

function formatInr(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function maskUtr(utr: string): string {
  const u = utr.trim();
  if (u.length <= 6) return "••••••";
  return `${u.slice(0, 3)}••••${u.slice(-3)}`;
}

export function EnrollClient({ courseId }: Props) {
  const [step, setStep] = useState<Step>("terms");
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [utr, setUtr] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const [pendingUtr, setPendingUtr] = useState<string | null>(null);
  const [pendingAt, setPendingAt] = useState<string | null>(null);
  const [allowResubmit, setAllowResubmit] = useState(false);

  const upiId =
    process.env.NEXT_PUBLIC_UPI_ID?.trim() || "ansulsingh67890-1@oksbi";

  const qr = useMemo(() => qrForPrice(course?.price_inr), [course?.price_inr]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [courseRes, meRes] = await Promise.all([
          apiFetch(`/courses/${courseId}`),
          apiFetch("/student/me").catch(() => null),
        ]);
        if (cancelled) return;
        setCourse(courseRes.course);
        const profile = meRes?.profile;
        if (profile?.full_name) setFullName(profile.full_name);
        if (profile?.phone) setPhone(String(profile.phone));

        const existing = (meRes?.enrollments || []).find(
          (e: {
            course_id?: string;
            course?: { id?: string };
            payment_status?: string;
            status?: string;
            utr?: string | null;
            utr_submitted_at?: string | null;
          }) =>
            (e.course_id === courseId || e.course?.id === courseId) &&
            e.payment_status === "awaiting_verification"
        );
        if (existing && !allowResubmit) {
          setPendingUtr(existing.utr || null);
          setPendingAt(existing.utr_submitted_at || null);
          setStep("already_pending");
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load course"
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, allowResubmit]);

  function goDetails() {
    setConsentError("");
    if (!acceptedTerms) {
      setConsentError(
        "Please accept the terms and policies before continuing."
      );
      return;
    }
    setStep("details");
  }

  function goPay(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (fullName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (institution.trim().length < 2) {
      setError("Enter your college / institution.");
      return;
    }
    if (!degree) {
      setError("Select your degree.");
      return;
    }
    if (!yearOfStudy) {
      setError("Select your year of study.");
      return;
    }
    setStep("pay");
  }

  async function submitUtr(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/payments/utr-submit", {
        method: "POST",
        body: JSON.stringify({
          courseId,
          utr: utr.trim(),
          fullName: fullName.trim(),
          phone: phone.replace(/\s/g, ""),
          institution: institution.trim(),
          degree,
          yearOfStudy,
        }),
      });
      setDoneMessage(
        res.message ||
          "Submitted — we’ll verify your UTR and unlock access (usually within a few hours)."
      );
      setStep("done");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Submit failed";
      setError(
        `${raw} Your payment is safe — do not pay again. Email gethelp.seedqura@gmail.com with your UTR if this continues.`
      );
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Enroll
        </h1>
        <p className="mt-6 text-error">{loadError}</p>
        <MagneticButton href="/academy" variant="secondary" className="mt-8">
          Back to Learnings
        </MagneticButton>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Enroll
        </h1>
        <p className="mt-6 text-muted">Loading course…</p>
      </div>
    );
  }

  if (step === "already_pending") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Already submitted
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          We already have a UTR for <span className="text-text">{course.name}</span>
          {pendingUtr ? (
            <>
              {" "}
              (<span className="font-mono text-text">{maskUtr(pendingUtr)}</span>)
            </>
          ) : null}
          . Please wait for verification —{" "}
          <span className="text-text">do not pay again</span>.
        </p>
        {pendingAt && (
          <p className="mt-2 text-xs text-muted">
            Submitted {new Date(pendingAt).toLocaleString()}
          </p>
        )}
        <p className="mt-4 text-sm text-muted">
          If it&apos;s not unlocked within 24 hours, email{" "}
          <Link
            href="mailto:gethelp.seedqura@gmail.com"
            className="text-accent hover:text-text"
          >
            gethelp.seedqura@gmail.com
          </Link>
          .
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <MagneticButton
            href="/dashboard?tab=purchased"
            variant="primary"
            className="w-full"
          >
            Go to dashboard
          </MagneticButton>
          <button
            type="button"
            className="text-sm text-muted hover:text-text"
            onClick={() => {
              setAllowResubmit(true);
              setStep("terms");
            }}
          >
            I need to submit a different UTR
          </button>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Payment submitted
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-muted">{doneMessage}</p>
        <p className="mt-3 text-sm text-muted">
          You’ll see <span className="text-text">Pending verification</span> on
          your dashboard until we approve. If it&apos;s not unlocked within 24
          hours, email gethelp.seedqura@gmail.com — do not pay again.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <MagneticButton
            href="/dashboard?tab=purchased"
            variant="primary"
            className="w-full"
          >
            Go to dashboard
          </MagneticButton>
          <MagneticButton href="/academy" variant="secondary" className="w-full">
            Back to Learnings
          </MagneticButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-center text-3xl font-medium tracking-tight text-text">
        Enroll
      </h1>
      <p className="mt-2 text-center text-sm text-muted">{course.name}</p>
      <p className="mt-1 text-center text-sm font-medium text-text">
        {course.price_display || formatInr(course.price_inr)}
      </p>

      {step === "terms" && (
        <>
          <p className="mt-4 text-center text-sm leading-relaxed text-muted">
            Review and accept our policies, then share your details and pay via
            UPI. Access unlocks after we verify your UTR.
          </p>
          <div className="mt-8 space-y-5 rounded-2xl border border-white/8 bg-[var(--surface-1)] p-6">
            <LegalConsentCheckbox
              id="enroll-terms"
              variant="enroll"
              checked={acceptedTerms}
              onChange={setAcceptedTerms}
              error={consentError}
            />
            <MagneticButton
              type="button"
              variant="primary"
              className="w-full"
              onClick={goDetails}
            >
              Continue
            </MagneticButton>
            <MagneticButton
              href="/academy"
              variant="secondary"
              className="w-full"
            >
              Back to Learnings
            </MagneticButton>
          </div>
        </>
      )}

      {step === "details" && (
        <form
          onSubmit={goPay}
          className="mt-8 space-y-4 rounded-2xl border border-white/8 bg-[var(--surface-1)] p-6"
        >
          <p className="text-sm text-muted">Step 1 of 2 — Your details</p>
          <label className="block text-sm">
            <span className="text-muted">Full name</span>
            <input
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-premium mt-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Phone</span>
            <input
              required
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-premium mt-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">College / institution</span>
            <input
              required
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="input-premium mt-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Degree</span>
            <select
              required
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="input-premium mt-1.5"
            >
              <option value="">Select…</option>
              {DEGREES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-muted">Year of study</span>
            <select
              required
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
              className="input-premium mt-1.5"
            >
              <option value="">Select…</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex flex-col gap-3 pt-2">
            <MagneticButton type="submit" variant="primary" className="w-full">
              Continue to payment
            </MagneticButton>
            <button
              type="button"
              className="text-sm text-muted hover:text-text"
              onClick={() => {
                setError("");
                setStep("terms");
              }}
            >
              Back
            </button>
          </div>
        </form>
      )}

      {step === "pay" && (
        <form
          onSubmit={submitUtr}
          className="mt-8 space-y-5 rounded-2xl border border-white/8 bg-[var(--surface-1)] p-6"
        >
          <p className="text-sm text-muted">Step 2 of 2 — Pay via UPI</p>
          <div>
            <p className="text-lg font-medium text-text">
              Pay exactly {formatInr(course.price_inr)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Until Seedqura Technologies LLP banking is ready, payments go to
              the founder&apos;s UPI. You&apos;ll see{" "}
              <span className="text-text">Ansul</span> (founder, Seedqura
              Technologies LLP) as the recipient.
            </p>
          </div>

          {qr ? (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white p-3">
              <Image
                src={qr.src}
                alt={`UPI QR for ${qr.label}`}
                width={480}
                height={480}
                className="mx-auto h-auto w-full max-w-[280px]"
                priority
              />
            </div>
          ) : (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              QR isn&apos;t available for this amount. Open any UPI app and pay{" "}
              <span className="font-medium text-text">
                exactly {formatInr(course.price_inr)}
              </span>{" "}
              to the UPI ID below, then paste your UTR.
            </p>
          )}

          <p className="text-center text-sm text-muted">
            UPI ID:{" "}
            <span className="select-all font-medium text-text">{upiId}</span>
          </p>

          <label className="block text-sm">
            <span className="text-muted">UTR / UPI transaction ID</span>
            <input
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="Paste from your UPI app"
              className="input-premium mt-1.5 font-mono tracking-wide"
              autoComplete="off"
            />
          </label>

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex flex-col gap-3 pt-1">
            <MagneticButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Submitting…" : "Submit for verification"}
            </MagneticButton>
            <button
              type="button"
              className="text-sm text-muted hover:text-text"
              disabled={loading}
              onClick={() => {
                setError("");
                setStep("details");
              }}
            >
              Back
            </button>
          </div>

          <p className="text-center text-xs text-muted">
            Need help?{" "}
            <Link
              href="mailto:gethelp.seedqura@gmail.com"
              className="text-accent hover:text-text"
            >
              gethelp.seedqura@gmail.com
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

import Link from "next/link";

type LegalConsentCheckboxProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: "terms" | "privacy" | "contact" | "enroll";
  error?: string;
};

const copy = {
  terms: (
    <>
      I agree to the{" "}
      <Link href="/terms" className="text-accent hover:text-text" target="_blank">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="text-accent hover:text-text" target="_blank">
        Privacy Policy
      </Link>
      .
    </>
  ),
  privacy: (
    <>
      I have read the{" "}
      <Link href="/privacy" className="text-accent hover:text-text" target="_blank">
        Privacy Policy
      </Link>{" "}
      and consent to Seedqura processing my personal data as described therein.
    </>
  ),
  contact: (
    <>
      I consent to Seedqura processing my details to respond to this inquiry, as
      described in the{" "}
      <Link href="/privacy" className="text-accent hover:text-text" target="_blank">
        Privacy Policy
      </Link>
      .
    </>
  ),
  enroll: (
    <>
      I agree to the{" "}
      <Link href="/terms" className="text-accent hover:text-text" target="_blank">
        Terms of Service
      </Link>
      ,{" "}
      <Link href="/privacy" className="text-accent hover:text-text" target="_blank">
        Privacy Policy
      </Link>
      , and{" "}
      <Link href="/refund-policy" className="text-accent hover:text-text" target="_blank">
        Refund Policy
      </Link>
      .
    </>
  ),
};

export function LegalConsentCheckbox({
  id,
  checked,
  onChange,
  variant = "terms",
  error,
}: LegalConsentCheckboxProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
        <span>{copy[variant]}</span>
      </label>
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
}

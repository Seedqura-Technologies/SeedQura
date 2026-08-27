"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MagneticButton } from "@/components/ui/MagneticButton";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site-error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Something went wrong
        </p>
        <h1 className="mt-4 text-2xl font-medium tracking-tight text-text">
          This page couldn&apos;t load
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your account and payments are fine. Try again, or head home.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <MagneticButton type="button" variant="primary" onClick={reset}>
            Try again
          </MagneticButton>
          <MagneticButton href="/" variant="secondary">
            Home
          </MagneticButton>
        </div>
        <p className="mt-6 text-xs text-muted">
          Need help?{" "}
          <Link
            href="mailto:gethelp.seedqura@gmail.com"
            className="text-accent hover:text-text"
          >
            gethelp.seedqura@gmail.com
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import {
  RESEARCH_FELLOWSHIP_APPLY_URL,
  RESEARCH_FELLOWSHIP_ID,
} from "@/lib/fellowship";
import { EnrollClient } from "./EnrollClient";

export function FellowshipEnrollClient() {
  return (
    <div className="mx-auto max-w-lg space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Research Fellowship
        </h1>
        <p className="mt-2 text-sm text-muted">3 months · Live weekends · 30 seats</p>
        <p className="mt-1 text-sm font-medium text-text">
          ₹19,999 incl. GST · payable only upon selection
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/8 bg-[var(--surface-1)] p-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Step 1 · Apply
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Applications are reviewed on the official selection form. Profile
          review and track allocation follow. No payment until you receive a
          selection offer.
        </p>
        <MagneticButton
          href={RESEARCH_FELLOWSHIP_APPLY_URL}
          variant="primary"
          className="w-full !min-h-11"
        >
          Apply for Selection
          <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden />
        </MagneticButton>
        <p className="text-center text-xs text-muted">
          Opens Google Form · same link we use on LinkedIn
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/8 bg-[var(--surface-1)] p-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Step 2 · If selected
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Received a selection offer? Complete the program fee below within 72
          hours. We verify your UTR and unlock fellowship access.
        </p>
        <EnrollClient courseId={RESEARCH_FELLOWSHIP_ID} paymentOnly />
      </div>

      <div className="text-center">
        <Link
          href="/academy/research-fellowship"
          className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-accent"
        >
          Program details
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

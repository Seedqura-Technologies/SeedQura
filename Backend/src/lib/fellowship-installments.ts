/** Research Fellowship installment math and access helpers. */

import {
  RESEARCH_FELLOWSHIP_FULL_INR,
  RESEARCH_FELLOWSHIP_ID,
  RESEARCH_FELLOWSHIP_MONTHLY_INR,
} from "./fellowship-gate.js";

export const RESEARCH_FELLOWSHIP_INSTALLMENT_COUNT = 3;
/** Days between monthly installment due dates */
export const RESEARCH_FELLOWSHIP_INSTALLMENT_INTERVAL_DAYS = 30;
/** Remind when due within this many days (or overdue) */
export const RESEARCH_FELLOWSHIP_REMINDER_WINDOW_DAYS = 3;
/** Do not re-send reminder more often than this */
export const RESEARCH_FELLOWSHIP_REMINDER_COOLDOWN_DAYS = 5;

export type FellowshipPaymentPlan = "full" | "monthly";

export type EnrollmentInstallmentState = {
  payment_plan: string | null;
  installments_total: number | null;
  installments_paid: number | null;
  installment_amount_inr: number | null;
  next_installment_due_at: string | null;
  payment_status: string;
  status: string;
};

export function isFellowshipProgramAccess(
  status: string,
  paymentStatus: string
): boolean {
  return (
    status === "active" &&
    (paymentStatus === "paid" || paymentStatus === "partial")
  );
}

export function formatInrAmount(amountInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInr);
}

export function addDaysIso(from: Date, days: number): string {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function planMeta(plan: FellowshipPaymentPlan): {
  installmentsTotal: number;
  installmentAmountInr: number;
} {
  if (plan === "monthly") {
    return {
      installmentsTotal: RESEARCH_FELLOWSHIP_INSTALLMENT_COUNT,
      installmentAmountInr: RESEARCH_FELLOWSHIP_MONTHLY_INR,
    };
  }
  return {
    installmentsTotal: 1,
    installmentAmountInr: RESEARCH_FELLOWSHIP_FULL_INR,
  };
}

export function nextInstallmentNumber(state: EnrollmentInstallmentState): number {
  return Math.max(0, Number(state.installments_paid) || 0) + 1;
}

export function canPayNextInstallment(state: EnrollmentInstallmentState): boolean {
  if (state.payment_status !== "partial") return false;
  if (state.payment_plan !== "monthly") return false;
  const paid = Number(state.installments_paid) || 0;
  const total =
    Number(state.installments_total) || RESEARCH_FELLOWSHIP_INSTALLMENT_COUNT;
  return paid > 0 && paid < total;
}

export function remainingInstallments(state: EnrollmentInstallmentState): number {
  const paid = Number(state.installments_paid) || 0;
  const total =
    Number(state.installments_total) || RESEARCH_FELLOWSHIP_INSTALLMENT_COUNT;
  return Math.max(0, total - paid);
}

export function fellowshipAmountDisplay(opts: {
  amountInr: number;
  plan: FellowshipPaymentPlan | string;
  installmentNumber: number;
  installmentsTotal: number;
}): string {
  const base = formatInrAmount(opts.amountInr);
  if (opts.plan === "monthly" && opts.installmentsTotal > 1) {
    return `${base} · installment ${opts.installmentNumber} of ${opts.installmentsTotal}`;
  }
  if (opts.plan === "full") {
    return `${base} · full program`;
  }
  return base;
}

export function isResearchFellowshipCourse(courseId: string): boolean {
  return courseId === RESEARCH_FELLOWSHIP_ID;
}

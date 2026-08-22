"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { LegalConsentCheckbox } from "@/components/legal/LegalConsentCheckbox";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Props = { courseId: string };

export function EnrollClient({ courseId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started || !acceptedTerms) return;

    let cancelled = false;

    async function start() {
      setStatus("Preparing checkout…");
      setError("");
      try {
        const order = await apiFetch("/payments/order", {
          method: "POST",
          body: JSON.stringify({ courseId }),
        });
        if (cancelled) return;

        if (order.devMode) {
          setStatus("Completing enrollment (dev mode — Razorpay keys unset)…");
          await apiFetch("/payments/verify", {
            method: "POST",
            body: JSON.stringify({
              razorpay_order_id: order.orderId,
              paymentId: order.paymentId,
              enrollmentId: order.enrollmentId,
              courseId,
              devComplete: true,
            }),
          });
          router.replace("/dashboard?tab=purchased");
          return;
        }

        setReady(true);
        setStatus("Opening payment…");

        const openCheckout = () => {
          if (!window.Razorpay) {
            setError("Razorpay failed to load");
            return;
          }
          const rzp = new window.Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "Seedqura",
            description: order.courseName,
            order_id: order.orderId,
            prefill: {
              name: order.studentName,
              email: order.studentEmail,
            },
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              try {
                setStatus("Verifying payment…");
                await apiFetch("/payments/verify", {
                  method: "POST",
                  body: JSON.stringify({
                    ...response,
                    paymentId: order.paymentId,
                    enrollmentId: order.enrollmentId,
                    courseId,
                  }),
                });
                router.replace("/dashboard?tab=purchased");
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Verification failed"
                );
              }
            },
            modal: {
              ondismiss: async () => {
                try {
                  await apiFetch("/payments/failed", {
                    method: "POST",
                    body: JSON.stringify({
                      courseId,
                      paymentId: order.paymentId,
                    }),
                  });
                } catch {
                  /* ignore */
                }
                setError("Payment cancelled");
                setStatus("");
              },
            },
          });
          rzp.open();
        };

        if (window.Razorpay) openCheckout();
        else {
          const t = setInterval(() => {
            if (window.Razorpay) {
              clearInterval(t);
              openCheckout();
            }
          }, 200);
          setTimeout(() => clearInterval(t), 10000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Checkout failed");
          setStatus("");
        }
      }
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [courseId, router, started, acceptedTerms]);

  function beginCheckout() {
    setConsentError("");
    if (!acceptedTerms) {
      setConsentError("Please accept the terms and policies before continuing to payment.");
      return;
    }
    setStarted(true);
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-lg">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        <h1 className="text-center text-3xl font-medium tracking-tight text-text">
          Enroll
        </h1>
        <p className="mt-4 text-center text-sm leading-relaxed text-muted">
          Before payment, review and accept our policies. Checkout uses Razorpay
          and may set third-party cookies as described in our Cookie Policy.
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
            onClick={beginCheckout}
          >
            Continue to payment
          </MagneticButton>
          <MagneticButton href="/academy" variant="secondary" className="w-full">
            Back to Academy
          </MagneticButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <h1 className="text-3xl font-medium tracking-tight text-text">Enroll</h1>
      {status && <p className="mt-6 text-muted">{status}</p>}
      {error && (
        <div className="mt-8 space-y-4">
          <p className="text-red-600">{error}</p>
          <MagneticButton href="/academy" variant="secondary">
            Back to Academy
          </MagneticButton>
        </div>
      )}
      {ready && !error && (
        <p className="mt-4 text-sm text-muted">
          If the payment window didn&apos;t open, check your popup blocker.
        </p>
      )}
    </div>
  );
}

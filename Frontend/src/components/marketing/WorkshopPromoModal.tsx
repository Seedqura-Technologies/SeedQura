"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import {
  WORKSHOP_EXPIRES_AT,
  WORKSHOP_REGISTER_URL,
  WORKSHOP_STORAGE_KEY,
} from "@/lib/workshop";

export { WORKSHOP_REGISTER_URL };

const STORAGE_KEY = WORKSHOP_STORAGE_KEY;
/** Brief beat after paint — invitation, not ambush */
const OPEN_DELAY_MS = 1400;
const DISMISS_DAYS = 2;

/** Homepage + research/about — Academy has its own Live Clinic band */
const PUBLIC_PREFIXES = ["/", "/research", "/about", "/contact"];

function isPublicMarketingPath(pathname: string): boolean {
  if (pathname.startsWith("/dashboard")) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/login")) return false;
  if (pathname.startsWith("/signup")) return false;
  if (pathname.startsWith("/apply")) return false;
  if (pathname.startsWith("/enroll")) return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/academy")) return false;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p))
  );
}

function shouldAutoOpen(): boolean {
  if (typeof window === "undefined") return false;
  if (Date.now() > WORKSHOP_EXPIRES_AT) return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { dismissedUntil?: number };
    if (parsed.dismissedUntil && Date.now() < parsed.dismissedUntil) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

function persistDismiss() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        dismissedUntil: Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000,
      })
    );
  } catch {
    /* private mode */
  }
}

const ease = [0.22, 1, 0.36, 1] as const;

export function WorkshopPromoModal() {
  const pathname = usePathname() || "/";
  const titleId = useId();
  const descId = useId();
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const close = useCallback(() => {
    persistDismiss();
    setOpen(false);
  }, []);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isPublicMarketingPath(pathname)) {
      setOpen(false);
      return;
    }
    if (!shouldAutoOpen()) return;

    const t = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [ready, pathname]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => ctaRef.current?.focus(), 120);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, close]);

  if (!ready) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[220] flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          {/* Backdrop — intentional dismiss only (no click-away) */}
          <motion.div
            className="absolute inset-0 bg-[rgba(5,5,5,0.84)] backdrop-blur-[12px]"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Soft brand glow behind the panel */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(34,211,165,0.14) 0%, rgba(232,168,60,0.06) 42%, transparent 70%)",
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 0.7, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="relative z-10 flex w-full max-w-[880px] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[var(--shadow-glass),0_0_0_1px_rgba(34,211,165,0.08)] sm:flex-row"
            initial={{ opacity: 0, y: 32, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.5, ease }}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(0,0,0,0.35)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label="Close workshop invitation"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>

            {/* Visual plane — flyer as invitation object, click → Razorpay */}
            <a
              href={WORKSHOP_REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => persistDismiss()}
              className="group relative block h-[168px] w-full shrink-0 overflow-hidden sm:h-auto sm:w-[44%] sm:max-w-[380px]"
              aria-label="Register for the workshop — opens Razorpay"
            >
              <Image
                src="/workshops/ai-healthcare-flyer.jpg"
                alt=""
                fill
                className="object-cover object-[center_14%] transition duration-700 ease-out group-hover:scale-[1.03] sm:object-top"
                sizes="(max-width: 640px) 100vw, 380px"
                priority
                unoptimized
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-[rgba(15,15,14,0.25)] to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-[rgba(15,15,14,0.2)] sm:to-[var(--surface-1)]"
                aria-hidden
              />
              <div
                className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--surface-1)] to-transparent sm:hidden"
                aria-hidden
              />
              <span className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,211,165,0.28)] bg-[rgba(8,8,8,0.55)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--accent)] backdrop-blur-sm sm:bottom-5 sm:left-5">
                Live workshop
              </span>
            </a>

            <div className="relative flex flex-1 flex-col px-5 pb-6 pt-4 sm:px-8 sm:py-9 sm:pl-7">
              <motion.div
                className="mb-4 flex items-center gap-2.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4, ease }}
              >
                <Image
                  src="/logo-mark.png"
                  alt=""
                  width={26}
                  height={26}
                  className="h-[26px] w-[26px] object-contain"
                  unoptimized
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text)]">
                    Seedqura
                  </p>
                  <p className="text-[11px] tracking-wide text-[var(--text-muted)]">
                    Academy invitation
                  </p>
                </div>
              </motion.div>

              <motion.p
                className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-dim)] px-3 py-1 text-[11px] font-medium tracking-[0.04em] text-[var(--accent)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.4, ease }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_rgba(34,211,165,0.18)]" />
                3–4 Oct · 10:00–12:00 IST · ₹499
              </motion.p>

              <motion.h2
                id={titleId}
                className="max-w-[18ch] text-[1.55rem] font-semibold leading-[1.18] tracking-tight text-[var(--text)] sm:text-[1.85rem]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45, ease }}
              >
                AI in Healthcare &amp; Startup Innovation
              </motion.h2>

              <motion.p
                id={descId}
                className="mt-3 max-w-[34ch] text-[14.5px] leading-relaxed text-[var(--text-muted)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.45, ease }}
              >
                A clinician from AIIMS. A builder of startups. One live
                session — certificate included.
              </motion.p>

              <motion.div
                className="mt-5 flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.45, ease }}
              >
                <div className="flex -space-x-2.5">
                  <Image
                    src="/workshops/bhavna.jpg"
                    alt="Dr. Bhavna Gupta"
                    width={42}
                    height={42}
                    className="h-[42px] w-[42px] rounded-full border-2 border-[var(--surface-1)] object-cover ring-1 ring-[var(--accent-border)]"
                    unoptimized
                  />
                  <Image
                    src="/workshops/vaibhav.jpg"
                    alt="Dr. S. Vaibhav"
                    width={42}
                    height={42}
                    className="h-[42px] w-[42px] rounded-full border-2 border-[var(--surface-1)] object-cover ring-1 ring-[var(--accent-border)]"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 text-[13px] leading-snug">
                  <p className="font-medium text-[var(--text)]">
                    Dr. Bhavna Gupta · Dr. S. Vaibhav
                  </p>
                  <p className="text-[var(--text-muted)]">
                    AIIMS Rishikesh · Startup mentoring
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.45, ease }}
              >
                <a
                  ref={ctaRef}
                  href={WORKSHOP_REGISTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => persistDismiss()}
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] px-6 text-sm font-semibold tracking-wide text-[#041512] shadow-[var(--shadow-glow)] transition duration-200 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Register &amp; pay
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={2}
                    aria-hidden
                  />
                </a>
                <button
                  type="button"
                  onClick={close}
                  className="min-h-11 self-center rounded-[var(--radius)] px-2 text-[12px] text-[var(--text-faint)]/80 transition hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:self-auto"
                >
                  Continue browsing
                </button>
              </motion.div>

              <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-faint)]">
                Secure Razorpay checkout. Registration confirms only after
                payment — receipt emailed to you.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

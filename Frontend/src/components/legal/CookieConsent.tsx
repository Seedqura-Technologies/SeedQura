"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getLegalData } from "@/lib/legal";
import {
  CONSENT_STORAGE_KEY,
  type ConsentPreferences,
  defaultConsent,
  loadConsent,
  saveConsent,
} from "@/lib/consent";

type CookieConsentProps = {
  className?: string;
};

export function CookieConsent({ className }: CookieConsentProps) {
  const legal = getLegalData();
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>(defaultConsent);

  useEffect(() => {
    const stored = loadConsent();
    if (!stored || stored.version !== legal.consentVersion) {
      setVisible(true);
      setPrefs(stored ?? defaultConsent);
    }
  }, [legal.consentVersion]);

  function acceptAll() {
    saveConsent({
      version: legal.consentVersion,
      essential: true,
      analytics: false,
      updatedAt: new Date().toISOString(),
    });
    setVisible(false);
  }

  function essentialOnly() {
    saveConsent({
      version: legal.consentVersion,
      essential: true,
      analytics: false,
      updatedAt: new Date().toISOString(),
    });
    setVisible(false);
    setShowPrefs(false);
  }

  function savePreferences() {
    saveConsent({
      version: legal.consentVersion,
      essential: true,
      analytics: prefs.analytics,
      updatedAt: new Date().toISOString(),
    });
    setVisible(false);
    setShowPrefs(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className={`fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-[var(--bg)]/92 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl ${className ?? ""}`}
    >
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="min-w-0 flex-1">
              <h2
                id="cookie-consent-title"
                className="text-sm font-semibold tracking-tight text-text"
              >
                Cookies & data preferences
              </h2>
              <p
                id="cookie-consent-desc"
                className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted"
              >
                We use essential cookies to keep you signed in and to record your
                choices. Payment checkout may use third-party cookies via Razorpay.
                We do not use advertising cookies. See our{" "}
                <Link href="/cookies" className="text-accent hover:text-text">
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-accent hover:text-text">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={essentialOnly}
              className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-text lg:hidden"
              aria-label="Dismiss and accept essential cookies only"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={acceptAll}
              className="btn-premium btn-primary min-h-10 whitespace-nowrap px-5 py-2 text-sm"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={essentialOnly}
              className="btn-premium btn-secondary min-h-10 whitespace-nowrap px-5 py-2 text-sm"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => (showPrefs ? savePreferences() : setShowPrefs(true))}
              className="min-h-10 px-2 text-sm font-medium text-accent hover:text-text sm:px-3"
            >
              {showPrefs ? "Save preferences" : "Manage preferences"}
            </button>
            <button
              type="button"
              onClick={essentialOnly}
              className="hidden shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-text lg:block"
              aria-label="Dismiss and accept essential cookies only"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showPrefs && (
          <div className="mt-4 grid gap-3 border-t border-white/6 pt-4 sm:grid-cols-2">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span>
                <span className="font-medium text-text">Essential</span>
                <span className="mt-0.5 block text-muted">
                  Required for login, security, and saving your consent choice.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, analytics: e.target.checked }))
                }
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span>
                <span className="font-medium text-text">Analytics</span>
                <span className="mt-0.5 block text-muted">
                  Not currently in use. Reserved if we enable optional analytics
                  later.
                </span>
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export { CONSENT_STORAGE_KEY };

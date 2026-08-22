export type ConsentPreferences = {
  version: string;
  essential: true;
  analytics: boolean;
  updatedAt: string;
};

export const CONSENT_STORAGE_KEY = "seedqura-consent";

export const defaultConsent: ConsentPreferences = {
  version: "",
  essential: true,
  analytics: false,
  updatedAt: "",
};

export function loadConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (parsed.essential !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(prefs: ConsentPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
}

export function hasValidConsent(version: string): boolean {
  const stored = loadConsent();
  return stored?.version === version;
}

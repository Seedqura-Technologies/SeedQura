import type { Request, Response, NextFunction } from "express";
import { getSupabaseAdmin } from "../lib/supabase.js";

export type AuthedRequest = Request & {
  userId?: string;
  userEmail?: string;
  profile?: {
    id: string;
    full_name: string;
    email: string | null;
    role: "student" | "admin";
    status: "active" | "suspended";
  };
};

type AuthCacheEntry = {
  userId: string;
  userEmail?: string;
  profile: NonNullable<AuthedRequest["profile"]>;
  expiresAt: number;
};

/** Short-lived auth cache so dashboard bursts don't re-hit Auth Admin on every request. */
const AUTH_CACHE_TTL_MS = 45_000;
const authCache = new Map<string, AuthCacheEntry>();

function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

function cacheKey(token: string): string {
  // Token prefix is enough as a cache key for the short TTL window
  return token.length > 48 ? token.slice(0, 48) : token;
}

function getCached(token: string): AuthCacheEntry | null {
  const key = cacheKey(token);
  const hit = authCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    authCache.delete(key);
    return null;
  }
  return hit;
}

function setCached(token: string, entry: Omit<AuthCacheEntry, "expiresAt">) {
  // Bound memory on long-running Render instances
  if (authCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of authCache) {
      if (v.expiresAt < now) authCache.delete(k);
    }
    if (authCache.size > 500) {
      const first = authCache.keys().next().value;
      if (first) authCache.delete(first);
    }
  }
  authCache.set(cacheKey(token), {
    ...entry,
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
  });
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = bearer(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const cached = getCached(token);
    if (cached) {
      if (cached.profile.status === "suspended") {
        res.status(403).json({ error: "Account suspended" });
        return;
      }
      req.userId = cached.userId;
      req.userEmail = cached.userEmail;
      req.profile = cached.profile;
      next();
      return;
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      console.warn("[auth] getUser failed", error?.message || "no user");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, email, role, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      res.status(401).json({ error: "Profile not found" });
      return;
    }
    if (profile.status === "suspended") {
      res.status(403).json({ error: "Account suspended" });
      return;
    }

    const typed = profile as AuthedRequest["profile"];
    req.userId = data.user.id;
    req.userEmail = data.user.email ?? profile.email ?? undefined;
    req.profile = typed;

    setCached(token, {
      userId: data.user.id,
      userEmail: req.userEmail,
      profile: typed!,
    });

    next();
  } catch (err) {
    console.error("[auth]", err);
    res.status(500).json({ error: "Auth failed" });
  }
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.profile?.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}

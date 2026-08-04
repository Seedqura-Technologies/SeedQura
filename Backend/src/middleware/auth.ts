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

function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
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

    req.userId = data.user.id;
    req.userEmail = data.user.email ?? profile.email ?? undefined;
    req.profile = profile as AuthedRequest["profile"];
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

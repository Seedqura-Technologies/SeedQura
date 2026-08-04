import { Router } from "express";
import { getSupabaseAdmin } from "../lib/supabase.js";
import type { AuthedRequest } from "../middleware/auth.js";

export const coursesRouter = Router();

coursesRouter.get("/", async (_req, res) => {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("courses")
      .select("*")
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("name");
    if (error) throw error;
    res.json({ courses: data ?? [] });
  } catch (err) {
    console.error("[courses]", err);
    res.status(500).json({ error: "Failed to list courses" });
  }
});

coursesRouter.get("/:id", async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("courses")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.status !== "published") {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    res.json({ course: data });
  } catch (err) {
    console.error("[courses]", err);
    res.status(500).json({ error: "Failed to get course" });
  }
});

/** Admin list (all statuses) — mounted separately under /api/admin/courses */
export const adminCoursesHandlers = {
  list: async (_req: AuthedRequest, res: import("express").Response) => {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("courses")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ courses: data ?? [] });
  },
};

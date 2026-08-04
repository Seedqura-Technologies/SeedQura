import { Router } from "express";

export const applyRouter = Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[6-9]\d{9}$/;
const validYears = [
  "1st Year UG",
  "2nd Year UG",
  "3rd Year UG",
  "4th Year UG",
  "Postgraduate",
  "Graduate / Other",
];
const validInterests = ["Agriculture AI", "Medical AI", "Both"];

applyRouter.post("/", (req, res) => {
  const { name, email, phone, institution, year, portfolio, interest, statement } =
    req.body ?? {};
  const fields: string[] = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    fields.push("name");
  }
  if (!email || typeof email !== "string" || !emailRegex.test(email)) {
    fields.push("email");
  }
  if (!phone || typeof phone !== "string" || !phoneRegex.test(phone.replace(/\s/g, ""))) {
    fields.push("phone");
  }
  if (!institution || typeof institution !== "string" || institution.trim().length < 2) {
    fields.push("institution");
  }
  if (!year || !validYears.includes(year)) {
    fields.push("year");
  }
  if (!interest || !validInterests.includes(interest)) {
    fields.push("interest");
  }
  if (!statement || typeof statement !== "string" || statement.trim().length < 10) {
    fields.push("statement");
  }
  if (statement && statement.length > 500) {
    fields.push("statement");
  }
  if (portfolio && typeof portfolio === "string" && portfolio.trim()) {
    try {
      new URL(portfolio);
    } catch {
      fields.push("portfolio");
    }
  }

  if (fields.length > 0) {
    return res.status(400).json({
      ok: false,
      error: "Validation failed",
      fields,
    });
  }

  console.log("[apply]", {
    name,
    email,
    phone,
    institution,
    year,
    portfolio,
    interest,
    statement,
  });

  return res.status(200).json({ ok: true, message: "Application received" });
});

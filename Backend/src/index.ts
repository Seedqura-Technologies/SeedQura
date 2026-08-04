import "dotenv/config";
import express from "express";
import cors from "cors";
import { contactRouter } from "./routes/contact.js";
import { applyRouter } from "./routes/apply.js";
import { coursesRouter } from "./routes/courses.js";
import { paymentsRouter } from "./routes/payments.js";
import { studentRouter } from "./routes/student.js";
import { adminRouter } from "./routes/admin.js";
import { connectRedis, pingRedis, isRedisEnabled } from "./lib/redis.js";
import { rateLimit } from "./middleware/rateLimit.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3020",
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", async (_req, res) => {
  const redis = isRedisEnabled() ? await pingRedis() : null;
  res.json({ ok: true, redis });
});

app.use("/api/contact", rateLimit("contact"), contactRouter);
app.use("/api/apply", rateLimit("apply"), applyRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/student", studentRouter);
app.use("/api/admin", adminRouter);

async function start() {
  if (isRedisEnabled()) {
    const connected = await connectRedis();
    console.log(
      connected
        ? "[redis] connected"
        : "[redis] unavailable, using in-memory fallbacks"
    );
  }

  app.listen(PORT, () => {
    console.log(`Seedqura API running on http://localhost:${PORT}`);
  });
}

start();

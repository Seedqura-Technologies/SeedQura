import type { Request, Response, NextFunction } from "express";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { getRedis, connectRedis } from "../lib/redis.js";

const WINDOW_SEC = 60;
const MAX_REQUESTS = 10;

type Limiter = {
  consume(key: string): Promise<unknown>;
};

const limiters = new Map<string, Limiter>();
let initPromise: Promise<void> | null = null;

async function initLimiters(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const redisReady = await connectRedis();
    const redis = getRedis();

    for (const endpoint of ["contact", "apply", "welcome"]) {
      if (redisReady && redis) {
        limiters.set(
          endpoint,
          new RateLimiterRedis({
            storeClient: redis,
            keyPrefix: `rl:${endpoint}`,
            points: MAX_REQUESTS,
            duration: WINDOW_SEC,
          })
        );
      } else {
        limiters.set(
          endpoint,
          new RateLimiterMemory({
            points: MAX_REQUESTS,
            duration: WINDOW_SEC,
          })
        );
      }
    }
  })();

  return initPromise;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? req.ip;
  }
  return req.ip ?? "unknown";
}

export function rateLimit(endpoint: "contact" | "apply" | "welcome") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await initLimiters();
      const limiter = limiters.get(endpoint);
      if (!limiter) {
        next();
        return;
      }

      await limiter.consume(getClientIp(req));
      next();
    } catch {
      res.status(429).json({
        ok: false,
        error: "Too many requests. Please try again later.",
      });
    }
  };
}

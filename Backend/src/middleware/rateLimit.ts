import type { Request, Response, NextFunction } from "express";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { getRedis, connectRedis } from "../lib/redis.js";

const WINDOW_SEC = 60;
const MAX_REQUESTS = 10;
const SCHEDULE_PUBLISH_MAX = 20;

type RateLimitEndpoint =
  | "contact"
  | "apply"
  | "welcome"
  | "schedule_publish";

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

    const endpoints: Array<{ name: RateLimitEndpoint; points: number }> = [
      { name: "contact", points: MAX_REQUESTS },
      { name: "apply", points: MAX_REQUESTS },
      { name: "welcome", points: MAX_REQUESTS },
      { name: "schedule_publish", points: SCHEDULE_PUBLISH_MAX },
    ];

    for (const endpoint of endpoints) {
      if (redisReady && redis) {
        limiters.set(
          endpoint.name,
          new RateLimiterRedis({
            storeClient: redis,
            keyPrefix: `rl:${endpoint.name}`,
            points: endpoint.points,
            duration: WINDOW_SEC,
          })
        );
      } else {
        limiters.set(
          endpoint.name,
          new RateLimiterMemory({
            points: endpoint.points,
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

export function rateLimit(endpoint: RateLimitEndpoint) {
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

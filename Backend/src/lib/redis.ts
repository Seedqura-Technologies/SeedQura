import { Redis } from "ioredis";

let client: Redis | null = null;
let connectAttempted = false;

export function isRedisEnabled(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!client && !connectAttempted) {
    connectAttempted = true;
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    client.on("error", (err: Error) => {
      console.warn("[redis] connection error:", err.message);
    });
  }

  return client;
}

export async function connectRedis(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }
    return true;
  } catch (err) {
    console.warn("[redis] unavailable, continuing without cache:", err);
    return false;
  }
}

export async function pingRedis(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

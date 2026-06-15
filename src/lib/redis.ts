import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

type MemoryEntry = {
  expiresAt: number;
  value: unknown;
};

const memoryCache = new Map<string, MemoryEntry>();

export const redis =
  env.REDIS_URL && env.REDIS_TOKEN
    ? new Redis({
        url: env.REDIS_URL,
        token: env.REDIS_TOKEN
      })
    : null;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redis) {
    return redis.get<T>(key);
  }

  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value as T;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number) {
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds });
    return;
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

export async function cacheDel(key: string) {
  if (redis) {
    await redis.del(key);
    return;
  }

  memoryCache.delete(key);
}

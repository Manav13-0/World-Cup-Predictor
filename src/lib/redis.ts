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

export async function acquireLock(key: string, ttlSeconds: number) {
  const lockKey = `lock:${key}`;
  const token = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  if (redis) {
    const result = await redis.set(lockKey, token, { nx: true, ex: ttlSeconds });
    return result ? token : null;
  }

  const existing = memoryCache.get(lockKey);
  if (existing && existing.expiresAt > Date.now()) {
    return null;
  }

  memoryCache.set(lockKey, {
    value: token,
    expiresAt: Date.now() + ttlSeconds * 1000
  });

  return token;
}

export async function releaseLock(key: string, token: string) {
  const lockKey = `lock:${key}`;

  if (redis) {
    const current = await redis.get<string>(lockKey);
    if (current === token) {
      await redis.del(lockKey);
    }
    return;
  }

  const current = memoryCache.get(lockKey);
  if (current && current.value === token) {
    memoryCache.delete(lockKey);
  }
}

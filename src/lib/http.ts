import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet } from "@/lib/redis";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return json({ error: "Validation failed", issues: error.flatten() }, 422);
  }

  if (error instanceof Error) {
    return json({ error: error.message }, 400);
  }

  return json({ error: "Unexpected server error" }, 500);
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Admin privileges required");
  }
  return user;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const bucketKey = `rate:${key}`;
  const bucket = (await cacheGet<{ count: number; resetAt: number }>(bucketKey)) ?? {
    count: 0,
    resetAt: Date.now() + windowSeconds * 1000
  };

  if (bucket.resetAt < Date.now()) {
    bucket.count = 0;
    bucket.resetAt = Date.now() + windowSeconds * 1000;
  }

  bucket.count += 1;
  await cacheSet(bucketKey, bucket, Math.ceil((bucket.resetAt - Date.now()) / 1000));

  if (bucket.count > limit) {
    throw new Error("Too many requests. Please retry shortly.");
  }
}

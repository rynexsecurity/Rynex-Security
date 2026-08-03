import { createHash } from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";

const MAX_JSON_BYTES = 16 * 1024;

export async function readStrictJson(request: Request, maxBytes = MAX_JSON_BYTES): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(length) || length > maxBytes) return null;
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return null;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) return null;
    const value: unknown = JSON.parse(text);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export function hasOnlyKeys(body: Record<string, unknown>, keys: readonly string[]) {
  return Object.keys(body).every((key) => keys.includes(key));
}

export function stringField(value: unknown, max: number, required = true): string | null {
  if (typeof value !== "string") return required ? null : "";
  const result = value.trim();
  return (required && !result) || result.length > max ? null : result;
}

export function sourceKey(request: Request): string {
  // Deployment must provide a verified source identity. Arbitrary X-Forwarded-For is never trusted.
  const configured = process.env.TRUSTED_SOURCE_HEADER;
  const value = configured ? request.headers.get(configured) : null;
  return value && /^[a-zA-Z0-9:._-]{1,128}$/.test(value) ? createHash("sha256").update(value).digest("hex").slice(0, 32) : "unverified";
}

export async function enforceRateLimit(scope: string, source: string, limit: number, windowMs: number): Promise<boolean> {
  const bucket = createHash("sha256").update(`${scope}:${source}`).digest("hex");
  const now = new Date(); const resetAt = new Date(now.getTime() + windowMs);
  // Atomic upsert/increment makes this shared by all instances using the same database.
  const row = await prisma.rateLimit.upsert({ where: { bucket }, create: { bucket, count: 1, resetAt }, update: { count: { increment: 1 } } });
  if (row.resetAt <= now) {
    const renewed = await prisma.rateLimit.update({ where: { bucket }, data: { count: 1, resetAt } });
    return renewed.count <= limit;
  }
  return row.count <= limit;
}

export const badRequest = () => NextResponse.json({ error: "Invalid request." }, { status: 400 });
export const tooManyRequests = () => NextResponse.json({ error: "Please try again later." }, { status: 429, headers: { "Retry-After": "60" } });

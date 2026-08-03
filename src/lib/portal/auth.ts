import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import prisma from "@/lib/portal/prisma";

export const COOKIE_NAME = "portal_session";
const MAX_AGE = 60 * 60 * 8;
const IDLE_MS = MAX_AGE * 1000;
const ABSOLUTE_MS = 24 * 60 * 60 * 1000;

export interface JWTPayload extends Record<string, unknown> { userId: string; email: string; role: string; name: string; mustChangePassword: boolean; sid: string; teamId?: string | null; }

function getSecret() {
  const value = process.env.JWT_SECRET?.trim();
  if (!value || value.length < 32 || /change[-_ ]?me|example|placeholder|rynex_security_portal/i.test(value)) {
    throw new Error("JWT_SECRET must be a non-placeholder secret of at least 32 characters");
  }
  return new TextEncoder().encode(value);
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(getSecret());
}

export async function createSession(user: Omit<JWTPayload, "sid">, userAgent?: string | null) {
  const now = new Date();
  const session = await prisma.session.create({ data: { userId: user.userId, idleExpiresAt: new Date(now.getTime() + IDLE_MS), absoluteExpiresAt: new Date(now.getTime() + ABSOLUTE_MS), userAgent: userAgent?.slice(0, 256) || null } });
  return signJWT({ ...user, sid: session.id });
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try { const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.sid !== "string" || typeof payload.role !== "string") return null;
    return payload as unknown as JWTPayload;
  } catch { return null; }
}

async function activeSession(token: string): Promise<JWTPayload | null> {
  const payload = await verifyJWT(token); if (!payload) return null;
  const now = new Date();
  const session = await prisma.session.findUnique({ where: { id: payload.sid }, include: { user: { select: { isActive: true, role: true, mustChangePassword: true } } } });
  if (!session || !session.user.isActive || session.revokedAt || session.idleExpiresAt <= now || session.absoluteExpiresAt <= now || session.user.role !== payload.role) return null;
  void prisma.session.update({ where: { id: session.id }, data: { lastActiveAt: now, idleExpiresAt: new Date(Math.min(now.getTime() + IDLE_MS, session.absoluteExpiresAt.getTime())) } }).catch(() => undefined);
  return { ...payload, mustChangePassword: session.user.mustChangePassword, role: session.user.role };
}

export async function getSessionFromRequest(req: NextRequest): Promise<JWTPayload | null> { const token = req.cookies.get(COOKIE_NAME)?.value; return token ? activeSession(token) : null; }
export async function getSession(): Promise<JWTPayload | null> { const store = await cookies(); const token = store.get(COOKIE_NAME)?.value; return token ? activeSession(token) : null; }
export async function revokeSession(sessionId: string) { await prisma.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } }); }
export async function revokeUserSessions(userId: string, exceptId?: string) { await prisma.session.updateMany({ where: { userId, revokedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) }, data: { revokedAt: new Date() } }); }
export function createSessionCookie(token: string) { return { name: COOKIE_NAME, value: token, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: MAX_AGE, path: "/" }; }
export function clearSessionCookie() { return { name: COOKIE_NAME, value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 0, path: "/" }; }

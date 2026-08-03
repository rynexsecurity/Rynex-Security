import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";
import { createSession, createSessionCookie } from "@/lib/portal/auth";
import { enforceRateLimit, hasOnlyKeys, readStrictJson, sourceKey, tooManyRequests } from "@/lib/security";
import { hashPassword, needsRehash } from "@/lib/password";

const DUMMY_HASH = "$2a$12$LQv3c1yqYF4nHhzKmR1uP.3aH2Akgv4Nhi17JvfHq1IC2dVGYG8wW";
const invalid = () => NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

export async function handleLogin(request: Request) {
  const body = await readStrictJson(request, 4096);
  if (!body || !hasOnlyKeys(body, ["email", "password"]) || typeof body.email !== "string" || typeof body.password !== "string") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const email = body.email.trim().toLowerCase(); const password = body.password;
  if (!email || email.length > 254 || password.length < 1 || password.length > 1024) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    const source = sourceKey(request);
    if (!(await enforceRateLimit("login:source", source, 20, 15 * 60_000)) || !(await enforceRateLimit("login:account", email, 8, 15 * 60_000))) return tooManyRequests();
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.isActive || !valid) return invalid();
    if (await needsRehash(user.passwordHash)) await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const token = await createSession({ userId: user.id, email: user.email, role: user.role, name: user.name, mustChangePassword: user.mustChangePassword }, request.headers.get("user-agent"));
    await prisma.auditLog.create({ data: { userId: user.id, action: "LOGIN", entityType: "USER", entityId: user.id, details: "Successful login" } });
    const response = NextResponse.json({ success: true, mustChangePassword: user.mustChangePassword, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    response.cookies.set(createSessionCookie(token));
    return response;
  } catch (error) {
    console.error("[portal-auth] login failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}

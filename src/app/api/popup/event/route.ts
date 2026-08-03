import { NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";
import { getSession } from "@/lib/portal/auth";
import { hasOnlyKeys, readStrictJson } from "@/lib/security";

const popupKey = "rynex-eclipse-2026";
const popupVersion = "1";

function originAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false });
  const state = await prisma.popupAcknowledgement.findUnique({ where: { userId_popupKey_popupVersion: { userId: session.userId, popupKey, popupVersion } } });
  const now = new Date();
  const eligible = !state?.acknowledgedAt && (!state?.snoozedUntil || state.snoozedUntil <= now);
  if (eligible) await prisma.popupAcknowledgement.upsert({ where: { userId_popupKey_popupVersion: { userId: session.userId, popupKey, popupVersion } }, create: { userId: session.userId, popupKey, popupVersion, lastShownAt: now, lastAction: "shown" }, update: { lastShownAt: now, lastAction: "shown" } });
  return NextResponse.json({ authenticated: true, eligible, serverTime: now.toISOString(), popupKey, popupVersion });
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await readStrictJson(request, 1024);
  if (!body || !hasOnlyKeys(body, ["action"]) || (body.action !== "acknowledge" && body.action !== "snooze")) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const now = new Date(); const snoozedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  // Acknowledge is monotonic: it always wins if concurrent with a snooze.
  const state = await prisma.popupAcknowledgement.upsert({
    where: { userId_popupKey_popupVersion: { userId: session.userId, popupKey, popupVersion } },
    create: body.action === "acknowledge" ? { userId: session.userId, popupKey, popupVersion, acknowledgedAt: now, lastAction: "acknowledged" } : { userId: session.userId, popupKey, popupVersion, snoozedUntil, lastAction: "snoozed" },
    update: body.action === "acknowledge" ? { acknowledgedAt: now, snoozedUntil: null, lastAction: "acknowledged" } : { lastAction: "snoozed" },
  });
  if (body.action === "snooze" && !state.acknowledgedAt) await prisma.popupAcknowledgement.update({ where: { id: state.id }, data: { snoozedUntil, lastAction: "snoozed" } });
  return NextResponse.json({ ok: true, serverTime: now.toISOString() });
}

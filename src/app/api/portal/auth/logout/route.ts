import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/portal/auth";

export async function POST() {
  const session = await getSession();
  if (session) { const { revokeSession } = await import("@/lib/portal/auth"); await revokeSession(session.sid); }
  const response = NextResponse.json({ success: true });
  const cookie = clearSessionCookie();
  response.cookies.set(cookie);
  return response;
}

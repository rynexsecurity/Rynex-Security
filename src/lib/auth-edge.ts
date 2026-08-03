import { jwtVerify } from "jose";

// Edge-safe verifier used only for optimistic routing. API/server authorization also checks Session.
function secret() {
  const value = process.env.JWT_SECRET?.trim();
  if (!value || value.length < 32 || /change[-_ ]?me|example|placeholder|rynex_security_portal/i.test(value)) return null;
  return new TextEncoder().encode(value);
}
export async function verifyEdgeJWT(token: string) {
  const key = secret(); if (!key) return null;
  try { const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] }); return typeof payload.userId === "string" && typeof payload.sid === "string" ? payload : null; } catch { return null; }
}

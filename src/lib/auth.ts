// Compatibility facade: all authentication now uses the canonical portal module.
import { getSession, verifyJWT, signJWT, createSession, createSessionCookie, clearSessionCookie, getSessionFromRequest } from "@/lib/portal/auth";
export { getSession, verifyJWT, signJWT, createSession, createSessionCookie, clearSessionCookie, getSessionFromRequest };
export async function getSessionUser(cookiesList: { get(name: string): { value?: string } | undefined }) {
  const token = cookiesList.get("portal_session")?.value;
  // Cookie stores originate from the active server request; use the canonical DB-backed validator.
  return token ? getSession() : null;
}

import * as jose from 'jose';
import bcrypt from 'bcrypt';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'rynex_security_portal_jwt_secret_key_2026_xyz'
);

export async function signJWT(payload: any): Promise<string> {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<any | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function getSessionUser(cookiesList: any): Promise<any | null> {
  const sessionCookie = cookiesList.get('portal_session')?.value;
  if (!sessionCookie) return null;
  return await verifyJWT(sessionCookie);
}


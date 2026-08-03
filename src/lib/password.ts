import bcrypt from 'bcrypt';

export const BCRYPT_COST = 12;

export function validatePassword(password: string, accountHints: string[] = []): string | null {
  if (typeof password !== 'string' || password.length < 12 || password.length > 1024) return 'Password does not meet security requirements.';
  const normalized = password.toLowerCase();
  if (['password', 'password123', 'qwerty', 'letmein', 'admin123'].some((value) => normalized.includes(value))) return 'Password does not meet security requirements.';
  if (accountHints.filter(Boolean).some((hint) => hint.length >= 3 && normalized.includes(hint.toLowerCase()))) return 'Password does not meet security requirements.';
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_COST);
  return await bcrypt.hash(password, salt);
}

export async function needsRehash(hash: string): Promise<boolean> { return bcrypt.getRounds(hash) < BCRYPT_COST; }

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

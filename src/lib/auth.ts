import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.AUTH_SECRET || 'finra-super-secret-key-change-in-production-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30 days session
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (!payload.sub || !payload.email) return null;
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) || undefined,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('finra_session')?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

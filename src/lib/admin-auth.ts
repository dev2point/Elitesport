import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isDatabaseConfigured } from '@/src/db';
import { getAuth } from './auth';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminSession {
  user: AdminUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

export class AdminUnauthorizedError extends Error {
  constructor(message = 'Accès administrateur requis.') {
    super(message);
    this.name = 'AdminUnauthorizedError';
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    const auth = getAuth();
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result || !result.user || !result.session) {
      return null;
    }

    const role = (result.user as { role?: unknown }).role;
    if (role !== 'admin') {
      return null;
    }

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: 'admin',
      },
      session: {
        id: result.session.id,
        userId: result.session.userId,
        expiresAt: result.session.expiresAt,
      },
    };
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    redirect('/admin/login');
  }
  return adminSession;
}

export async function assertAdminSession(): Promise<AdminSession> {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    throw new AdminUnauthorizedError();
  }
  return adminSession;
}

export function verifySetupToken(
  providedToken: string | null | undefined,
  expectedToken: string | null | undefined
): boolean {
  if (!providedToken || !expectedToken) {
    return false;
  }
  const a = Buffer.from(providedToken.trim(), 'utf8');
  const b = Buffer.from(expectedToken.trim(), 'utf8');
  if (a.length === 0 || a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

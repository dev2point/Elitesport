import crypto from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseConfigured } from '@/src/db';
import { account, user } from '@/src/db/schema';
import { verifySetupToken } from '@/src/lib/admin-auth';
import { adminSetupSchema } from '@/src/lib/validations';

function extractTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const headerToken = req.headers.get('x-setup-token');
  return headerToken ? headerToken.trim() : null;
}

export async function POST(req: NextRequest) {
  const expectedToken = process.env.ADMIN_SETUP_TOKEN;
  if (!expectedToken || expectedToken.trim().length < 16) {
    return NextResponse.json(
      { error: 'ADMIN_SETUP_TOKEN non configuré sur le serveur.' },
      { status: 503 }
    );
  }

  const providedToken = extractTokenFromRequest(req);
  if (!verifySetupToken(providedToken, expectedToken)) {
    return NextResponse.json(
      { error: 'Jeton de configuration invalide.' },
      { status: 401 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'DATABASE_URL non configuré.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const parsed = adminSetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? 'Données invalides.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const db = getDb();

  try {
    const existingAdmin = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.role, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { error: 'Un compte administrateur existe déjà. Configuration verrouillée.' },
        { status: 409 }
      );
    }

    const existingEmail = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: 'Cette adresse e-mail est déjà utilisée.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const now = new Date();

    await db.transaction(async (tx) => {
      const adminRecheck = await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.role, 'admin'))
        .limit(1);

      if (adminRecheck.length > 0) {
        throw new Error('ADMIN_ALREADY_EXISTS');
      }

      await tx.insert(user).values({
        id: userId,
        name,
        email,
        emailVerified: true,
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(account).values({
        id: accountId,
        accountId: userId,
        providerId: 'credential',
        userId,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });
    });

    return NextResponse.json(
      {
        ok: true,
        admin: {
          id: userId,
          name,
          email,
          role: 'admin',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'ADMIN_ALREADY_EXISTS') {
      return NextResponse.json(
        { error: 'Un compte administrateur existe déjà. Configuration verrouillée.' },
        { status: 409 }
      );
    }
    console.error('Admin setup failed:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte gérant.' },
      { status: 500 }
    );
  }
}

import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/src/db';
import { getAuth } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Base de données non configurée.' },
      { status: 503 }
    );
  }
  const { GET: handleGet } = toNextJsHandler(getAuth());
  return handleGet(req);
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Base de données non configurée.' },
      { status: 503 }
    );
  }
  const { POST: handlePost } = toNextJsHandler(getAuth());
  return handlePost(req);
}

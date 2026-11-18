import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from '@/src/db';
import * as schema from '@/src/db/schema';

function resolveBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    'http://localhost:3000'
  );
}

function resolveTrustedOrigins(): string[] {
  const candidates = [
    process.env.BETTER_AUTH_URL?.trim(),
    process.env.APP_URL?.trim(),
    'http://localhost:3000',
  ];
  return Array.from(new Set(candidates.filter((v): v is string => Boolean(v))));
}

function createAuthInstance() {
  const baseURL = resolveBaseUrl();
  const isHttps = baseURL.startsWith('https://');

  return betterAuth({
    baseURL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: resolveTrustedOrigins(),
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: true,
          defaultValue: 'user',
          input: false,
        },
      },
    },
    advanced: isHttps
      ? {
          useSecureCookies: true,
          defaultCookieAttributes: {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
          },
        }
      : undefined,
    plugins: [nextCookies()],
  });
}

export type AppAuth = ReturnType<typeof createAuthInstance>;

declare global {
  var __eliteSportAuth: AppAuth | undefined;
}

export function getAuth(): AppAuth {
  if (globalThis.__eliteSportAuth) {
    return globalThis.__eliteSportAuth;
  }
  const instance = createAuthInstance();
  globalThis.__eliteSportAuth = instance;
  return instance;
}

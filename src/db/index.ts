import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

declare global {
  var __eliteSportSqlClient: ReturnType<typeof postgres> | undefined;
  var __eliteSportDb: Database | undefined;
  var __eliteSportDbUrl: string | undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

function resolveSslOption(connectionString: string): 'require' | false | undefined {
  const lower = connectionString.toLowerCase();
  if (lower.includes('sslmode=disable') || lower.includes('ssl=false')) {
    return false;
  }
  if (lower.includes('sslmode=')) {
    return undefined;
  }
  const isLocal =
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('::1');
  return isLocal ? false : 'require';
}

export function getDb(): Database {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (globalThis.__eliteSportDb && globalThis.__eliteSportDbUrl === connectionString) {
    return globalThis.__eliteSportDb;
  }

  const ssl = resolveSslOption(connectionString);

  const client = postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
    ...(ssl !== undefined ? { ssl } : {}),
  });

  globalThis.__eliteSportSqlClient = client;
  globalThis.__eliteSportDbUrl = connectionString;

  const db = drizzle(client, { schema });
  globalThis.__eliteSportDb = db;
  return db;
}

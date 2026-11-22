import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const ROOT = process.cwd();
const DRIZZLE_FOLDER = path.join(ROOT, 'drizzle');

function resolveConnectionUrl() {
  const direct = process.env.DIRECT_URL?.trim();
  const pooled = process.env.DATABASE_URL?.trim();
  const url = direct || pooled;
  if (!url) {
    throw new Error(
      'Missing database URL: configure DIRECT_URL or DATABASE_URL in environment / GitHub Secrets.'
    );
  }
  return url;
}

function resolveSslOption(connectionString) {
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

function sha256Hex(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function collectOrderedSqlFiles() {
  const ordered = [];
  const seen = new Set();

  const addIfExists = (relativePath) => {
    const normalized = relativePath.replace(/\\/g, '/');
    const fullPath = path.join(ROOT, normalized);
    if (!seen.has(normalized) && fs.existsSync(fullPath)) {
      seen.add(normalized);
      ordered.push({ name: normalized, fullPath });
    }
  };

  addIfExists('sql/001_bookings.sql');
  addIfExists('supabase/better_auth_tables.sql');

  const sqlDir = path.join(ROOT, 'sql');
  if (fs.existsSync(sqlDir)) {
    const entries = fs
      .readdirSync(sqlDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
      .map((entry) => `sql/${entry.name}`)
      .sort((a, b) => a.localeCompare(b));

    for (const rel of entries) {
      addIfExists(rel);
    }
  }

  return ordered;
}

async function applyCustomSqlMigrations(client) {
  await client`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
  await client`
    CREATE TABLE IF NOT EXISTS "drizzle"."_sql_migrations" (
      "id" SERIAL PRIMARY KEY,
      "filename" text NOT NULL UNIQUE,
      "checksum" text NOT NULL,
      "applied_at" timestamptz NOT NULL DEFAULT now()
    )
  `;

  const appliedRows = await client`
    SELECT "filename", "checksum" FROM "drizzle"."_sql_migrations"
  `;
  const appliedMap = new Map(
    appliedRows.map((row) => [row.filename, row.checksum])
  );

  const sqlFiles = collectOrderedSqlFiles();
  let newlyApplied = 0;

  for (const file of sqlFiles) {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    const checksum = sha256Hex(content);
    const existingChecksum = appliedMap.get(file.name);

    if (existingChecksum === checksum) {
      console.log(`• SQL already applied: ${file.name}`);
      continue;
    }

    if (existingChecksum && existingChecksum !== checksum) {
      console.warn(
        `! SQL file modified since last run (${file.name}); skipping re-execution to keep production data safe.`
      );
      continue;
    }

    console.log(`→ Applying SQL migration: ${file.name}`);
    await client.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`
        INSERT INTO "drizzle"."_sql_migrations" ("filename", "checksum")
        VALUES (${file.name}, ${checksum})
        ON CONFLICT ("filename") DO UPDATE
          SET "checksum" = EXCLUDED."checksum",
              "applied_at" = now()
      `;
    });
    newlyApplied += 1;
  }

  return newlyApplied;
}

async function adoptBaselineIfTablesExist(client) {
  const journalPath = path.join(DRIZZLE_FOLDER, 'meta', '_journal.json');
  if (!fs.existsSync(journalPath)) {
    return;
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  const firstEntry = journal.entries?.[0];
  if (!firstEntry) {
    return;
  }

  await client`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
  await client`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      "id" SERIAL PRIMARY KEY,
      "hash" text NOT NULL,
      "created_at" bigint
    )
  `;

  const [{ count }] = await client`
    SELECT count(*)::int AS count FROM "drizzle"."__drizzle_migrations"
  `;

  if (count > 0) {
    return;
  }

  const [regs] = await client`
    SELECT
      to_regclass('public.bookings') IS NOT NULL AS has_bookings,
      to_regclass('public.payments') IS NOT NULL AS has_payments,
      to_regclass('public."user"') IS NOT NULL AS has_user
  `;

  if (regs?.has_bookings && regs?.has_payments && regs?.has_user) {
    const baselinePath = path.join(DRIZZLE_FOLDER, `${firstEntry.tag}.sql`);
    if (!fs.existsSync(baselinePath)) {
      return;
    }
    const baselineSql = fs.readFileSync(baselinePath, 'utf8');
    const hash = sha256Hex(baselineSql);

    await client`
      INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
      VALUES (${hash}, ${firstEntry.when})
    `;
    console.log(
      `• Adopted existing Supabase schema as Drizzle baseline (${firstEntry.tag})`
    );
  }
}

async function enforcePublicRls(client) {
  const tables = await client`
    SELECT "tablename", "rowsecurity"
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY "tablename"
  `;

  for (const row of tables) {
    if (!row.rowsecurity) {
      const safeName = String(row.tablename).replace(/"/g, '""');
      console.log(`→ Enabling RLS on public."${safeName}"`);
      await client.unsafe(
        `ALTER TABLE "public"."${safeName}" ENABLE ROW LEVEL SECURITY;`
      );
    }
  }

  return tables.length;
}

async function main() {
  const url = resolveConnectionUrl();
  const ssl = resolveSslOption(url);

  const client = postgres(url, {
    prepare: false,
    max: 1,
    connect_timeout: 20,
    ...(ssl !== undefined ? { ssl } : {}),
  });

  try {
    console.log('1/4 Running baseline & custom SQL migrations...');
    const sqlCount = await applyCustomSqlMigrations(client);

    console.log('2/4 Checking Drizzle baseline state...');
    await adoptBaselineIfTablesExist(client);

    console.log('3/4 Running Drizzle ORM migrations...');
    const journalPath = path.join(DRIZZLE_FOLDER, 'meta', '_journal.json');
    if (fs.existsSync(journalPath)) {
      const db = drizzle(client);
      await migrate(db, { migrationsFolder: DRIZZLE_FOLDER });
    } else {
      console.log('• No Drizzle journal found; skipping.');
    }

    console.log('4/4 Verifying Row Level Security on all public tables...');
    const publicTablesCount = await enforcePublicRls(client);

    console.log(
      `✓ Database migrations complete (${sqlCount} new SQL file(s), ${publicTablesCount} public table(s) RLS-protected).`
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('✗ Migration failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

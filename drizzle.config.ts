import { defineConfig } from 'drizzle-kit';

const connectionUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  'postgresql://postgres:postgres@localhost:5432/postgres';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionUrl,
  },
  strict: true,
  verbose: true,
});

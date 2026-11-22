import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'bun:test';

const ROOT = process.cwd();

describe('Drizzle & SQL migration setup', () => {
  it('has a valid drizzle journal pointing to existing SQL migration files', () => {
    const journalPath = path.join(ROOT, 'drizzle', 'meta', '_journal.json');
    expect(fs.existsSync(journalPath)).toBe(true);

    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as {
      entries: Array<{ tag: string; when: number }>;
    };

    expect(Array.isArray(journal.entries)).toBe(true);
    expect(journal.entries.length).toBeGreaterThanOrEqual(1);

    for (const entry of journal.entries) {
      const sqlFile = path.join(ROOT, 'drizzle', `${entry.tag}.sql`);
      expect(fs.existsSync(sqlFile)).toBe(true);
      const sql = fs.readFileSync(sqlFile, 'utf8');
      expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    }
  });

  it('enables RLS on every baseline SQL table', () => {
    const bookingsSql = fs.readFileSync(
      path.join(ROOT, 'sql', '001_bookings.sql'),
      'utf8'
    );
    const paymentsSql = fs.readFileSync(
      path.join(ROOT, 'sql', '003_payments.sql'),
      'utf8'
    );
    const authSql = fs.readFileSync(
      path.join(ROOT, 'supabase', 'better_auth_tables.sql'),
      'utf8'
    );

    expect(bookingsSql).toContain('bookings_no_overlap');
    expect(bookingsSql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(paymentsSql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(authSql).toContain('ENABLE ROW LEVEL SECURITY');
  });
});

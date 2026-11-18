import { describe, expect, it } from 'bun:test';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { verifySetupToken } from '@/src/lib/admin-auth';
import { adminLoginSchema, adminSetupSchema } from '@/src/lib/validations';

describe('Admin setup & auth validation', () => {
  it('validates setup tokens in constant time', () => {
    expect(verifySetupToken('super-secret-token-1234', 'super-secret-token-1234')).toBe(
      true
    );
    expect(verifySetupToken('super-secret-token-1234', 'wrong-secret-token-1234')).toBe(
      false
    );
    expect(verifySetupToken('', 'super-secret-token-1234')).toBe(false);
    expect(verifySetupToken(null, 'super-secret-token-1234')).toBe(false);
  });

  it('validates admin setup input and enforces strong password length', () => {
    const valid = adminSetupSchema.safeParse({
      name: 'Gérant Godomey',
      email: 'GERANT@Example.com',
      password: 'MotDePasseTresRobuste2026!',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe('gerant@example.com');
    }

    const shortPw = adminSetupSchema.safeParse({
      name: 'Gérant',
      email: 'gerant@example.com',
      password: 'short',
    });
    expect(shortPw.success).toBe(false);
  });

  it('validates admin login schema', () => {
    expect(
      adminLoginSchema.safeParse({ email: 'admin@godomey.bj', password: 'secret' }).success
    ).toBe(true);
    expect(
      adminLoginSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success
    ).toBe(false);
  });

  it('hashes and verifies passwords compatibly with Better Auth', async () => {
    const hash = await hashPassword('EliteSport2026!');
    expect(await verifyPassword({ hash, password: 'EliteSport2026!' })).toBe(true);
    expect(await verifyPassword({ hash, password: 'WrongPassword' })).toBe(false);
  });
});

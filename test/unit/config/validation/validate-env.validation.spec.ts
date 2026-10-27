import { describe, expect, it } from 'bun:test';
import { validateEnv } from '../../../../src/config/validation/validate-env.validation.js';

const validEnv = {
  DATABASE_URL: 'postgresql://dayline:dayline@localhost:5432/dayline',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
};

describe('validateEnv', () => {
  it('accepts the minimal valid env and applies defaults', () => {
    const env = validateEnv(validEnv);

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.JWT_ACCESS_TTL).toBe('15m');
    expect(env.REFRESH_TOKEN_TTL_DAYS).toBe(30);
    expect(env.TRUST_PROXY).toBe(0);
  });

  it('converts numeric strings from process.env', () => {
    const env = validateEnv({
      ...validEnv,
      PORT: '8080',
      REFRESH_TOKEN_TTL_DAYS: '7',
      TRUST_PROXY: '1',
    });

    expect(env.PORT).toBe(8080);
    expect(env.REFRESH_TOKEN_TTL_DAYS).toBe(7);
    expect(env.TRUST_PROXY).toBe(1);
  });

  it('rejects a missing JWT_ACCESS_SECRET', () => {
    expect(() => validateEnv({ DATABASE_URL: validEnv.DATABASE_URL })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('rejects a JWT_ACCESS_SECRET shorter than 32 characters', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_ACCESS_SECRET: 'a'.repeat(31) }),
    ).toThrow(/at least 32 characters/);
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() =>
      validateEnv({ JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects a non-postgres DATABASE_URL', () => {
    expect(() =>
      validateEnv({ ...validEnv, DATABASE_URL: 'mysql://localhost/db' }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects a malformed JWT_ACCESS_TTL', () => {
    expect(() => validateEnv({ ...validEnv, JWT_ACCESS_TTL: '15' })).toThrow(
      /JWT_ACCESS_TTL/,
    );
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('rejects an out-of-range PORT', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '70000' })).toThrow(/PORT/);
  });

  it('lists every invalid variable in one error', () => {
    expect(() => validateEnv({})).toThrow(
      /DATABASE_URL[\s\S]*JWT_ACCESS_SECRET|JWT_ACCESS_SECRET[\s\S]*DATABASE_URL/,
    );
  });
});

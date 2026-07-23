import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateEnv } from './env.js';

const required = {
  DATABASE_URL: 'postgresql://example.test/product_store',
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_ACCESS_EXPIRES: '15m',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('validateEnv', () => {
  it('accepts the complete required configuration', () => {
    vi.stubEnv('DATABASE_URL', required.DATABASE_URL);
    vi.stubEnv('JWT_ACCESS_SECRET', required.JWT_ACCESS_SECRET);
    vi.stubEnv('JWT_ACCESS_EXPIRES', required.JWT_ACCESS_EXPIRES);

    expect(() => validateEnv()).not.toThrow();
  });

  it('fails at startup when token expiry is missing', () => {
    vi.stubEnv('DATABASE_URL', required.DATABASE_URL);
    vi.stubEnv('JWT_ACCESS_SECRET', required.JWT_ACCESS_SECRET);
    vi.stubEnv('JWT_ACCESS_EXPIRES', '');

    expect(() => validateEnv()).toThrow('JWT_ACCESS_EXPIRES');
  });
});

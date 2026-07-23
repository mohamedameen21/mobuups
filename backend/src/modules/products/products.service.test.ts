import { describe, it, expect } from 'vitest';
import { toNumber } from './products.service.js';

describe('toNumber', () => {
  it('returns a plain number as-is', () => {
    expect(toNumber(19.99)).toBe(19.99);
  });

  it('unwraps a Decimal-like value (real Prisma client) via toNumber()', () => {
    const decimalLike = { toNumber: () => 42.5 };
    expect(toNumber(decimalLike)).toBe(42.5);
  });
});

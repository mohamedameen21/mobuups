import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createFakePrisma } from './test/fakePrisma.js';

const fake = createFakePrisma();

vi.mock('./lib/prisma.js', () => ({ prisma: fake.prisma }));

const { app } = await import('./app.js');

describe('GET /', () => {
  it('returns a health-check payload', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', message: 'Product Store API (TypeScript)' });
  });
});

describe('error middleware fallback', () => {
  it('returns a generic 500 for an unexpected (non-AppError) error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fake.prisma.user.findUnique.mockRejectedValueOnce(new Error('boom - unexpected DB failure'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'whoever@example.com', password: 'password123' });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

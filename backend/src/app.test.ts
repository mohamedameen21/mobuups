import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { createFakePrisma } from './test/fakePrisma.js';

const fake = createFakePrisma();

vi.mock('./lib/prisma.js', () => ({ prisma: fake.prisma }));

const { app } = await import('./app.js');

function readTodayLog(): string {
  const today = new Date().toISOString().slice(0, 10);
  return fs.readFileSync(path.join(process.env.LOG_DIR!, `${today}.log`), 'utf-8');
}

describe('GET /', () => {
  it('returns a health-check payload', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', message: 'Product Store API (TypeScript)' });
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404 in the standard error envelope', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      meta: null,
      error: { code: 'NOT_FOUND' },
    });
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

    const logContents = readTodayLog();
    expect(logContents).toContain('INTERNAL_ERROR');
    expect(logContents).toContain('boom - unexpected DB failure');

    consoleSpy.mockRestore();
  });

  it('handles a rejection that is not an Error instance', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fake.prisma.user.findUnique.mockRejectedValueOnce('a plain string rejection, not an Error');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'whoever@example.com', password: 'password123' });

    expect(res.status).toBe(500);

    const logContents = readTodayLog();
    expect(logContents).toContain('Unknown error');

    consoleSpy.mockRestore();
  });
});

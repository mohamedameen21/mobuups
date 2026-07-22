import { describe, it, expect } from 'vitest';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { requireAuth } from './auth.middleware.js';
import { AppError } from '../lib/errors.js';
import { sendError } from '../lib/response.js';

function buildTestApp() {
  const app = express();

  app.get('/protected', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      sendError(res, err.statusCode, err.code, err.message);
      return;
    }
    sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong.');
  });

  return app;
}

const app = buildTestApp();

function signValidToken() {
  return jwt.sign({ sub: 'user-1', email: 'ameen@example.com' }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '15m',
  });
}

describe('requireAuth middleware', () => {
  it('attaches req.user and calls next() for a valid Bearer token', async () => {
    const token = signValidToken();

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'user-1', email: 'ameen@example.com' });
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a header missing the "Bearer " prefix', async () => {
    const token = signValidToken();

    const res = await request(app).get('/protected').set('Authorization', token);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a garbage token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer garbage.garbage.garbage');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const token = jwt.sign({ sub: 'user-1', email: 'ameen@example.com' }, 'wrong-secret');

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an expired token', async () => {
    const token = jwt.sign(
      { sub: 'user-1', email: 'ameen@example.com' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: -10 }
    );

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createFakePrisma } from '../../test/fakePrisma.js';

const fake = createFakePrisma();

vi.mock('../../lib/prisma.js', () => ({ prisma: fake.prisma }));

const { app } = await import('../../app.js');

function extractCookie(res: request.Response): string {
  const setCookie = res.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie].filter(Boolean);
  const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
  if (!refreshCookie) throw new Error('No refreshToken cookie set on response');
  return refreshCookie.split(';')[0];
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    fake.reset();
  });

  it('creates a new user and returns an access token + refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'ameen@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ name: 'Ameen', email: 'ameen@example.com' });
    expect(res.body.data.accessToken).toEqual(expect.any(String));

    const setCookie = res.headers['set-cookie']?.[0] ?? '';
    expect(setCookie).toContain('refreshToken=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/api/auth');
    expect(setCookie).toContain('SameSite=Strict');
  });

  it('normalizes email to lowercase before storing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'AMeen@Example.COM', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ameen@example.com');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'dup@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Someone Else', email: 'dup@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects a duplicate email that only differs by case', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'caseinsensitive@example.com', password: 'password123' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Someone Else',
      email: 'CaseInsensitive@Example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects an invalid email format with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'shortpw@example.com', password: 'abc123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a request missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'missing@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a malformed JSON body with 400 (not 500)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{ this is not valid json');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    fake.reset();
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'ameen@example.com', password: 'password123' });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ameen@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('ameen@example.com');
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('logs in successfully with a different-case email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'AMEEN@EXAMPLE.COM', password: 'password123' });

    expect(res.status).toBe(200);
  });

  it('rejects an incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ameen@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects a non-existent email with the same error as a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'never-registered@example.com', password: 'whatever123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Incorrect email or password.');
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    fake.reset();
  });

  it('rejects when no refresh cookie is provided', async () => {
    const res = await request(app).post('/api/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('NO_REFRESH_TOKEN');
  });

  it('rejects a garbage/invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=not-a-real-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('issues a new access token and rotates the refresh cookie', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'rotate@example.com', password: 'password123' });
    const firstCookie = extractCookie(registerRes);

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', firstCookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toEqual(expect.any(String));

    const secondCookie = extractCookie(refreshRes);
    expect(secondCookie).not.toBe(firstCookie);
  });

  it('rejects reuse of an already-rotated (old) refresh token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'reuse@example.com', password: 'password123' });
    const firstCookie = extractCookie(registerRes);

    await request(app).post('/api/auth/refresh').set('Cookie', firstCookie);

    const reuseRes = await request(app).post('/api/auth/refresh').set('Cookie', firstCookie);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('rejects an expired refresh token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'expired@example.com', password: 'password123' });
    const firstCookie = extractCookie(registerRes);

    const [row] = fake.getRefreshTokenRows();
    fake.setTokenExpiry(row.id, new Date(Date.now() - 1000));

    const res = await request(app).post('/api/auth/refresh').set('Cookie', firstCookie);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    fake.reset();
  });

  it('clears the cookie and revokes the token so a later refresh fails', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ameen', email: 'logout@example.com', password: 'password123' });
    const cookie = extractCookie(registerRes);

    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('succeeds even with no cookie at all (idempotent)', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

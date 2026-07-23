import path from 'node:path';
import fs from 'node:fs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createFakePrisma } from '../../test/fakePrisma.js';

const fake = createFakePrisma();
vi.mock('../../lib/prisma.js', () => ({ prisma: fake.prisma }));

const { app } = await import('../../app.js');

async function getAccessToken(): Promise<string> {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Uploader User',
    email: 'uploader@example.com',
    password: 'password123',
  });
  return res.body.data.accessToken as string;
}

beforeEach(() => {
  fake.reset();
});

describe('POST /api/upload', () => {
  it('uploads an image file when authenticated', async () => {
    const token = await getAccessToken();
    const testBuffer = Buffer.from('fake-image-data');

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', testBuffer, { filename: 'test-photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toMatch(/^\/uploads\/\d+-[a-f0-9]+\.jpg$/);

    // Clean up created file from uploads directory
    const filePath = path.join(process.cwd(), res.body.data.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  it('rejects upload when not authenticated with 401', async () => {
    const testBuffer = Buffer.from('fake-image-data');

    const res = await request(app)
      .post('/api/upload')
      .attach('image', testBuffer, { filename: 'test-photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(401);
  });

  it('rejects invalid non-image file types with 400', async () => {
    const token = await getAccessToken();
    const testBuffer = Buffer.from('console.log("malicious.js");');

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', testBuffer, { filename: 'script.js', contentType: 'text/javascript' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('rejects missing image attachment field with 400', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createFakePrisma } from '../../test/fakePrisma.js';

const fake = createFakePrisma();

vi.mock('../../lib/prisma.js', () => ({ prisma: fake.prisma }));

const { app } = await import('../../app.js');

async function getAccessToken(): Promise<string> {
  const email = `seller-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const res = await request(app).post('/api/auth/register').send({
    name: 'Seller User',
    email,
    password: 'password123',
  });
  return res.body.data.accessToken as string;
}

const validProduct = {
  name: 'Wireless Mouse',
  description: 'Ergonomic wireless mouse',
  price: 29.99,
  stock: 50,
  category: 'electronics',
};

beforeEach(() => {
  fake.reset();
});

describe('POST /api/products', () => {
  it('creates a product when authenticated', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validProduct);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name: 'Wireless Mouse',
      price: 29.99,
      stock: 50,
      category: 'electronics',
    });
    expect(typeof res.body.data.price).toBe('number');
    expect(res.body.data.id).toEqual(expect.any(String));
  });

  it('rejects with 401 when no Authorization header is present', async () => {
    const res = await request(app).post('/api/products').send(validProduct);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects with 401 for an invalid token', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer garbage-token')
      .send(validProduct);

    expect(res.status).toBe(401);
  });

  it('rejects a name shorter than 2 characters', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validProduct, name: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a negative price', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validProduct, price: -5 });

    expect(res.status).toBe(400);
  });

  it('rejects a negative stock', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validProduct, stock: -1 });

    expect(res.status).toBe(400);
  });

  it('rejects a missing category', async () => {
    const token = await getAccessToken();
    const withoutCategory: Partial<typeof validProduct> = { ...validProduct };
    delete withoutCategory.category;

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(withoutCategory);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/products', () => {
  async function seed(): Promise<string> {
    const token = await getAccessToken();
    const products = [
      { ...validProduct, name: 'Wireless Mouse', category: 'electronics', price: 29.99 },
      { ...validProduct, name: 'Mechanical Keyboard', category: 'electronics', price: 89.99 },
      { ...validProduct, name: 'Yoga Mat', category: 'fitness', price: 19.99 },
    ];
    for (const product of products) {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(product);
    }
    return token;
  }

  it('rejects with 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('lists products for an authenticated user', async () => {
    const token = await seed();

    const res = await request(app).get('/api/products').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(3);
  });

  it('returns pagination metadata with sensible defaults', async () => {
    const token = await seed();

    const res = await request(app).get('/api/products').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.meta).toEqual({ page: 1, limit: 10, total: 3, totalPages: 1 });
  });

  it('paginates with custom page and limit', async () => {
    const token = await seed();

    const res = await request(app)
      .get('/api/products?page=2&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('filters by category', async () => {
    const token = await seed();

    const res = await request(app)
      .get('/api/products?category=fitness')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0].name).toBe('Yoga Mat');
  });

  it('searches by name, case-insensitively', async () => {
    const token = await seed();

    const res = await request(app)
      .get('/api/products?search=KEYBOARD')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0].name).toBe('Mechanical Keyboard');
  });

  it('sorts by price ascending', async () => {
    const token = await seed();

    const res = await request(app)
      .get('/api/products?sortBy=price&order=asc')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.products.map((p: { name: string }) => p.name)).toEqual([
      'Yoga Mat',
      'Wireless Mouse',
      'Mechanical Keyboard',
    ]);
  });

  it('returns an empty page with correct totals when nothing matches', async () => {
    const token = await seed();

    const res = await request(app)
      .get('/api/products?category=nonexistent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.products).toEqual([]);
    expect(res.body.data.meta).toEqual({ page: 1, limit: 10, total: 0, totalPages: 1 });
  });

  it('rejects an out-of-range limit', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .get('/api/products?limit=1000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('rejects a non-positive page', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .get('/api/products?page=0')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/:id', () => {
  it('rejects with 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/api/products/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns a single product by id for an authenticated user', async () => {
    const token = await getAccessToken();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validProduct);

    const res = await request(app)
      .get(`/api/products/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Wireless Mouse');
  });

  it('returns 404 for a well-formed id that does not exist', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .get('/api/products/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('returns 400 for a malformed id', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .get('/api/products/not-a-uuid')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/products/:id', () => {
  it('updates a product when authenticated', async () => {
    const token = await getAccessToken();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validProduct);

    const res = await request(app)
      .patch(`/api/products/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 24.99, stock: 40 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ price: 24.99, stock: 40, name: 'Wireless Mouse' });
  });

  it('rejects with 401 when no Authorization header is present', async () => {
    const token = await getAccessToken();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validProduct);

    const res = await request(app)
      .patch(`/api/products/${created.body.data.id}`)
      .send({ price: 24.99 });

    expect(res.status).toBe(401);
  });

  it('returns 404 when the product does not exist', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .patch('/api/products/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 24.99 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('rejects an invalid field value', async () => {
    const token = await getAccessToken();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validProduct);

    const res = await request(app)
      .patch(`/api/products/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: -1 });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/products/:id', () => {
  it('deletes a product when authenticated, and it is then gone', async () => {
    const token = await getAccessToken();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validProduct);

    const deleteRes = await request(app)
      .delete(`/api/products/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/products/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });

  it('rejects with 401 when no Authorization header is present', async () => {
    const token = await getAccessToken();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validProduct);

    const res = await request(app).delete(`/api/products/${created.body.data.id}`);

    expect(res.status).toBe(401);
  });

  it('returns 404 when the product does not exist', async () => {
    const token = await getAccessToken();

    const res = await request(app)
      .delete('/api/products/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });
});

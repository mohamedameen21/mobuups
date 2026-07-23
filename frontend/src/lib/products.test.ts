import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from './api';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from './products';

const mock = new MockAdapter(api);

beforeEach(() => {
  mock.reset();
});

const product = {
  id: 'p1',
  name: 'Wireless Mouse',
  description: 'A mouse',
  price: 29.99,
  stock: 5,
  category: 'electronics',
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('listProducts', () => {
  it('sends the params and returns data + meta', async () => {
    mock.onGet('/products').reply((config) => {
      expect(config.params).toEqual({ search: 'mouse', page: 1, limit: 12 });
      return [
        200,
        { data: { products: [product], meta: { page: 1, limit: 12, total: 1, totalPages: 1 } } },
      ];
    });

    const result = await listProducts({ search: 'mouse', page: 1, limit: 12 });

    expect(result.data).toEqual([product]);
    expect(result.meta).toEqual({ page: 1, limit: 12, total: 1, totalPages: 1 });
  });
});

describe('getProduct', () => {
  it('fetches a single product by id', async () => {
    mock.onGet('/products/p1').reply(200, { data: product });

    const result = await getProduct('p1');

    expect(result).toEqual(product);
  });
});

describe('createProduct', () => {
  it('posts the input and returns the created product', async () => {
    mock.onPost('/products').reply((config) => {
      expect(JSON.parse(config.data)).toMatchObject({ name: 'Wireless Mouse' });
      return [201, { data: product }];
    });

    const result = await createProduct({
      name: 'Wireless Mouse',
      price: 29.99,
      stock: 5,
      category: 'electronics',
    });

    expect(result).toEqual(product);
  });
});

describe('updateProduct', () => {
  it('patches the given fields and returns the updated product', async () => {
    mock.onPatch('/products/p1').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ price: 19.99 });
      return [200, { data: { ...product, price: 19.99 } }];
    });

    const result = await updateProduct('p1', { price: 19.99 });

    expect(result.price).toBe(19.99);
  });
});

describe('deleteProduct', () => {
  it('sends a DELETE request for the given id', async () => {
    mock.onDelete('/products/p1').reply(200, { data: null });

    await expect(deleteProduct('p1')).resolves.toBeUndefined();
  });
});

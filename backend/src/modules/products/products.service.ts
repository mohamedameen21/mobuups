import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
} from './products.schema.js';

interface ProductRecord {
  id: string;
  name: string;
  description: string | null;
  price: number | { toNumber(): number };
  stock: number;
  category: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Prisma returns Decimal fields as a Decimal.js instance in the real client;
// the in-memory test double just stores a plain number. Handle both.
// Exported only so the test suite can exercise the Decimal-like branch
// directly, since the fake Prisma client never produces one.
export function toNumber(value: number | { toNumber(): number }): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function toPublicProduct(product: ProductRecord) {
  return { ...product, price: toNumber(product.price) };
}

export async function createProduct(input: CreateProductInput) {
  const product = await prisma.product.create({ data: input });
  return toPublicProduct(product);
}

export async function listProducts(query: ListProductsQuery) {
  const { search, category, page, limit, sortBy, order } = query;

  const where = {
    ...(category ? { category } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
  };

  // findMany (the page) and count (the total) both read against the same
  // `where`, so they're batched into one transaction: run as two separate
  // round trips, a row inserted/removed in between could make `meta.total`
  // drift from the `data` page actually returned.
  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: data.map(toPublicProduct),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  return toPublicProduct(product);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  // Interactive transaction: the existence check and the write happen against
  // the same transaction, so a concurrent delete can't sneak in between "it
  // exists" and "update it" (which would otherwise resurrect a deleted row).
  const product = await prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
    return tx.product.update({ where: { id }, data: input });
  });
  return toPublicProduct(product);
}

export async function deleteProduct(id: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
    await tx.product.delete({ where: { id } });
  });
}

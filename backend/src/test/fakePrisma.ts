import { randomUUID } from 'node:crypto';
import { vi } from 'vitest';

interface FakeUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeRefreshToken {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

interface FakeProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ProductWhere = {
  category?: string;
  name?: { contains: string; mode?: 'insensitive' };
};

function matchesWhere(product: FakeProduct, where: ProductWhere = {}): boolean {
  if (where.category && product.category !== where.category) return false;
  if (where.name?.contains) {
    const insensitive = where.name.mode === 'insensitive';
    const haystack = insensitive ? product.name.toLowerCase() : product.name;
    const needle = insensitive ? where.name.contains.toLowerCase() : where.name.contains;
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export function createFakePrisma() {
  const users = new Map<string, FakeUser>();
  const refreshTokens = new Map<string, FakeRefreshToken>();
  const products = new Map<string, FakeProduct>();
  // Real IDs, not "id-1"-style counters: products.id goes through z.uuid()
  // validation in the route params, so the fake has to look like a real UUID.
  const nextId = () => randomUUID();

  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return [...users.values()].find((u) => u.email === where.email) ?? null;
        }
        if (where.id) {
          return users.get(where.id) ?? null;
        }
        return null;
      }),
      create: vi.fn(
        async ({ data }: { data: { email: string; passwordHash: string; name: string } }) => {
          const user: FakeUser = {
            id: nextId(),
            email: data.email,
            passwordHash: data.passwordHash,
            name: data.name,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.set(user.id, user);
          return user;
        }
      ),
    },
    refreshToken: {
      create: vi.fn(
        async ({ data }: { data: { tokenHash: string; userId: string; expiresAt: Date } }) => {
          const row: FakeRefreshToken = {
            id: nextId(),
            tokenHash: data.tokenHash,
            userId: data.userId,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
          };
          refreshTokens.set(row.id, row);
          return row;
        }
      ),
      findUnique: vi.fn(
        async ({
          where,
          include,
        }: {
          where: { tokenHash: string };
          include?: { user?: boolean };
        }) => {
          const row = [...refreshTokens.values()].find((t) => t.tokenHash === where.tokenHash);
          if (!row) return null;
          if (include?.user) {
            return { ...row, user: users.get(row.userId) ?? null };
          }
          return row;
        }
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        refreshTokens.delete(where.id);
      }),
      deleteMany: vi.fn(async ({ where }: { where: { tokenHash: string } }) => {
        for (const [id, row] of refreshTokens) {
          if (row.tokenHash === where.tokenHash) refreshTokens.delete(id);
        }
      }),
    },
    product: {
      create: vi.fn(
        async ({
          data,
        }: {
          data: Omit<FakeProduct, 'id' | 'createdAt' | 'updatedAt' | 'description' | 'imageUrl'> &
            Partial<Pick<FakeProduct, 'description' | 'imageUrl'>>;
        }) => {
          const product: FakeProduct = {
            id: nextId(),
            description: data.description ?? null,
            imageUrl: data.imageUrl ?? null,
            name: data.name,
            price: data.price,
            stock: data.stock,
            category: data.category,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          products.set(product.id, product);
          return product;
        }
      ),
      findMany: vi.fn(
        async ({
          where,
          orderBy,
          skip = 0,
          take,
        }: {
          where?: ProductWhere;
          orderBy?: Partial<Record<keyof FakeProduct, 'asc' | 'desc'>>;
          skip?: number;
          take?: number;
        } = {}) => {
          let rows = [...products.values()].filter((p) => matchesWhere(p, where));

          const entry =
            orderBy && (Object.entries(orderBy)[0] as [keyof FakeProduct, 'asc' | 'desc']);
          if (entry) {
            const [field, direction] = entry;
            rows = [...rows].sort((a, b) => {
              const av = a[field] as string | number | Date;
              const bv = b[field] as string | number | Date;
              if (av < bv) return direction === 'asc' ? -1 : 1;
              if (av > bv) return direction === 'asc' ? 1 : -1;
              return 0;
            });
          }

          return take === undefined ? rows.slice(skip) : rows.slice(skip, skip + take);
        }
      ),
      count: vi.fn(async ({ where }: { where?: ProductWhere } = {}) => {
        return [...products.values()].filter((p) => matchesWhere(p, where)).length;
      }),
      findUnique: vi.fn(
        async ({ where }: { where: { id: string } }) => products.get(where.id) ?? null
      ),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<FakeProduct> }) => {
          const existing = products.get(where.id);
          if (!existing) throw new Error('Fake Prisma: record not found for update');
          const updated: FakeProduct = { ...existing, ...data, updatedAt: new Date() };
          products.set(where.id, updated);
          return updated;
        }
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const existing = products.get(where.id);
        if (!existing) throw new Error('Fake Prisma: record not found for delete');
        products.delete(where.id);
        return existing;
      }),
    },
    $transaction: vi.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      if (typeof arg === 'function') {
        return (arg as (tx: typeof prisma) => Promise<unknown>)(prisma);
      }
      throw new Error('Fake Prisma: unsupported $transaction argument');
    }),
  };

  return {
    prisma,
    reset() {
      users.clear();
      refreshTokens.clear();
      products.clear();
      vi.clearAllMocks();
    },
    setTokenExpiry(tokenId: string, expiresAt: Date) {
      const row = refreshTokens.get(tokenId);
      if (row) row.expiresAt = expiresAt;
    },
    getRefreshTokenRows() {
      return [...refreshTokens.values()];
    },
    getProductRows() {
      return [...products.values()];
    },
  };
}

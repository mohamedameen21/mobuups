import { z } from 'zod';

const productFields = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  price: z.number().positive().max(1_000_000),
  stock: z.number().int().nonnegative(),
  category: z.string().trim().min(1).max(100),
  imageUrl: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        if (val.startsWith('/')) return true;
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Must be a valid URL or relative path starting with /' }
    )
    .optional(),
});

export const createProductSchema = productFields;
export const updateProductSchema = productFields.partial();

export const productIdParamSchema = z.object({
  id: z.uuid(),
});

const sortableFields = ['name', 'price', 'stock', 'createdAt'] as const;

export const listProductsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(sortableFields).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

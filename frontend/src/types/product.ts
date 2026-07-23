// Mirrors backend/src/modules/products/products.schema.ts

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
}

export type UpdateProductInput = Partial<ProductInput>;

export interface ListProductsParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

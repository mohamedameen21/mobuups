import { api } from './api';
import type {
  ListProductsParams,
  PaginationMeta,
  Product,
  ProductInput,
  UpdateProductInput,
} from '../types/product';

interface ProductListPayload {
  products: Product[];
  meta: PaginationMeta;
}

export interface ProductListResponse {
  data: Product[];
  meta: PaginationMeta;
}

export async function listProducts(params: ListProductsParams): Promise<ProductListResponse> {
  const res = await api.get<{ data: ProductListPayload }>('/products', { params });
  return { data: res.data.data.products, meta: res.data.data.meta };
}

export async function getProduct(id: string): Promise<Product> {
  const res = await api.get<{ data: Product }>(`/products/${id}`);
  return res.data.data;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const res = await api.post<{ data: Product }>('/products', input);
  return res.data.data;
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const res = await api.patch<{ data: Product }>(`/products/${id}`, input);
  return res.data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

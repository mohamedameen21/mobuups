import type { Request, Response } from 'express';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  listProductsQuerySchema,
} from './products.schema.js';
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from './products.service.js';
import { sendSuccess } from '../../lib/response.js';

export async function create(req: Request, res: Response) {
  const input = createProductSchema.parse(req.body);
  const product = await createProduct(input);
  sendSuccess(res, 201, product);
}

export async function list(req: Request, res: Response) {
  const query = listProductsQuerySchema.parse(req.query);
  const { data, meta } = await listProducts(query);
  sendSuccess(res, 200, { products: data, meta });
}

export async function getOne(req: Request, res: Response) {
  const { id } = productIdParamSchema.parse(req.params);
  const product = await getProductById(id);
  sendSuccess(res, 200, product);
}

export async function update(req: Request, res: Response) {
  const { id } = productIdParamSchema.parse(req.params);
  const input = updateProductSchema.parse(req.body);
  const product = await updateProduct(id, input);
  sendSuccess(res, 200, product);
}

export async function remove(req: Request, res: Response) {
  const { id } = productIdParamSchema.parse(req.params);
  await deleteProduct(id);
  sendSuccess(res, 200, null);
}

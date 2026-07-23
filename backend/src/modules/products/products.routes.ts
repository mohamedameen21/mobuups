import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { create, list, getOne, update, remove } from './products.controller.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

export const productsRouter = Router();

// Reads are public (storefront-style browsing); writes require a valid access token.
productsRouter.get('/', asyncHandler(list));
productsRouter.get('/:id', asyncHandler(getOne));
productsRouter.post('/', requireAuth, asyncHandler(create));
productsRouter.patch('/:id', requireAuth, asyncHandler(update));
productsRouter.delete('/:id', requireAuth, asyncHandler(remove));


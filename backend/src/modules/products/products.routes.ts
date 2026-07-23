import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { create, list, getOne, update, remove } from './products.controller.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

export const productsRouter = Router();

// Every product action requires a valid access token: the assignment asks that
// only authorized users can view/add/edit/delete products, so reads are gated too.
productsRouter.get('/', requireAuth, asyncHandler(list));
productsRouter.get('/:id', requireAuth, asyncHandler(getOne));
productsRouter.post('/', requireAuth, asyncHandler(create));
productsRouter.patch('/:id', requireAuth, asyncHandler(update));
productsRouter.delete('/:id', requireAuth, asyncHandler(remove));

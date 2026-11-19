import type { RequestHandler } from 'express';

import type { CreateProductUseCase } from '../../../application/usecases/products/create-product.usecase';
import { createProductSchema } from '../../schemas/products/create-product.schema';

export function createProductHandler(
  useCase: CreateProductUseCase,
): RequestHandler {
  return async (request, response) => {
    const result = await useCase.execute(
      createProductSchema.parse(request.body),
    );
    response.status(201).json(result);
  };
}

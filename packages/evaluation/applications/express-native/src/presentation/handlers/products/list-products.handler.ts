import type { RequestHandler } from 'express';

import type { ListProductsUseCase } from '../../../application/usecases/products/list-products.usecase';

export function listProductsHandler(
  useCase: ListProductsUseCase,
): RequestHandler {
  return async (request, response) => {
    const result = await useCase.execute();
    response.status(200).json(result);
  };
}

import type { RouteHandlerMethod } from 'fastify';

import type { ListProductsUseCase } from '../../../application/usecases/products/list-products.usecase';

export function listProductsHandler(
  useCase: ListProductsUseCase,
): RouteHandlerMethod {
  return async (request, reply) => {
    const result = await useCase.execute();
    return reply.code(200).send(result);
  };
}

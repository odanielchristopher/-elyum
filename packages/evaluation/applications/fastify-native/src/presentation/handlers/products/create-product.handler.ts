import type { RouteHandlerMethod } from 'fastify';

import type { CreateProductUseCase } from '../../../application/usecases/products/create-product.usecase';
import { createProductSchema } from '../../schemas/products/create-product.schema';

export function createProductHandler(
  useCase: CreateProductUseCase,
): RouteHandlerMethod {
  return async (request, reply) => {
    const result = await useCase.execute(
      createProductSchema.parse(request.body),
    );
    return reply.code(201).send(result);
  };
}

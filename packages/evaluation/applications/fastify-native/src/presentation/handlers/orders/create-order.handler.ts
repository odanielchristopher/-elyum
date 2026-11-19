import type { RouteHandlerMethod } from 'fastify';

import type { CreateOrderUseCase } from '../../../application/usecases/orders/create-order.usecase';
import { createOrderSchema } from '../../schemas/orders/create-order.schema';

export function createOrderHandler(
  useCase: CreateOrderUseCase,
): RouteHandlerMethod {
  return async (request, reply) => {
    const result = await useCase.execute(createOrderSchema.parse(request.body));
    return reply.code(201).send(result);
  };
}

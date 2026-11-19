import type { RouteHandlerMethod } from 'fastify';

import type { ListOrdersUseCase } from '../../../application/usecases/orders/list-orders.usecase';

export function listOrdersHandler(
  useCase: ListOrdersUseCase,
): RouteHandlerMethod {
  return async (request, reply) => {
    const result = await useCase.execute();
    return reply.code(200).send(result);
  };
}

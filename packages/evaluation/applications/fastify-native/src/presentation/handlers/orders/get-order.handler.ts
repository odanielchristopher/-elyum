import type { RouteHandlerMethod } from 'fastify';

import type { GetOrderUseCase } from '../../../application/usecases/orders/get-order.usecase';
import { orderIdSchema } from '../../schemas/orders/order-id.schema';

export function getOrderHandler(useCase: GetOrderUseCase): RouteHandlerMethod {
  return async (request, reply) => {
    const result = await useCase.execute(
      orderIdSchema.parse((request.params as { id: string }).id),
    );
    return reply.code(200).send(result);
  };
}

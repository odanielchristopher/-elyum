import type { RouteHandlerMethod } from 'fastify';

import type { UpdateOrderStatusUseCase } from '../../../application/usecases/orders/update-order-status.usecase';
import { orderIdSchema } from '../../schemas/orders/order-id.schema';
import { updateOrderStatusSchema } from '../../schemas/orders/update-order-status.schema';

export function updateOrderStatusHandler(
  useCase: UpdateOrderStatusUseCase,
): RouteHandlerMethod {
  return async (request, reply) => {
    const result = await useCase.execute({
      orderId: orderIdSchema.parse((request.params as { id: string }).id),
      status: updateOrderStatusSchema.parse(request.body).status,
    });
    return reply.code(200).send(result);
  };
}

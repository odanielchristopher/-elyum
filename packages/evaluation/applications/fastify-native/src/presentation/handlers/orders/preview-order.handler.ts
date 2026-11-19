import type { RouteHandlerMethod } from 'fastify';

import type { PreviewOrderUseCase } from '../../../application/usecases/orders/preview-order.usecase';
import { createOrderSchema } from '../../schemas/orders/create-order.schema';

export function previewOrderHandler(
  useCase: PreviewOrderUseCase,
): RouteHandlerMethod {
  return async (request, reply) => {
    const result = await useCase.execute(createOrderSchema.parse(request.body));
    return reply.code(200).send(result);
  };
}

import type { RequestHandler } from 'express';

import type { UpdateOrderStatusUseCase } from '../../../application/usecases/orders/update-order-status.usecase';
import { orderIdSchema } from '../../schemas/orders/order-id.schema';
import { updateOrderStatusSchema } from '../../schemas/orders/update-order-status.schema';

export function updateOrderStatusHandler(
  useCase: UpdateOrderStatusUseCase,
): RequestHandler {
  return async (request, response) => {
    const result = await useCase.execute({
      orderId: orderIdSchema.parse(request.params.id),
      status: updateOrderStatusSchema.parse(request.body).status,
    });
    response.status(200).json(result);
  };
}

import type { RequestHandler } from 'express';

import type { GetOrderUseCase } from '../../../application/usecases/orders/get-order.usecase';
import { orderIdSchema } from '../../schemas/orders/order-id.schema';

export function getOrderHandler(useCase: GetOrderUseCase): RequestHandler {
  return async (request, response) => {
    const result = await useCase.execute(
      orderIdSchema.parse(request.params.id),
    );
    response.status(200).json(result);
  };
}

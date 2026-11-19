import type { RequestHandler } from 'express';

import type { CreateOrderUseCase } from '../../../application/usecases/orders/create-order.usecase';
import { createOrderSchema } from '../../schemas/orders/create-order.schema';

export function createOrderHandler(
  useCase: CreateOrderUseCase,
): RequestHandler {
  return async (request, response) => {
    const result = await useCase.execute(createOrderSchema.parse(request.body));
    response.status(201).json(result);
  };
}

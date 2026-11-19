import type { RequestHandler } from 'express';

import type { PreviewOrderUseCase } from '../../../application/usecases/orders/preview-order.usecase';
import { createOrderSchema } from '../../schemas/orders/create-order.schema';

export function previewOrderHandler(
  useCase: PreviewOrderUseCase,
): RequestHandler {
  return async (request, response) => {
    const result = await useCase.execute(createOrderSchema.parse(request.body));
    response.status(200).json(result);
  };
}

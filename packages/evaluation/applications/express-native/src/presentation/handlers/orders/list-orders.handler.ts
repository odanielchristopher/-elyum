import type { RequestHandler } from 'express';

import type { ListOrdersUseCase } from '../../../application/usecases/orders/list-orders.usecase';

export function listOrdersHandler(useCase: ListOrdersUseCase): RequestHandler {
  return async (request, response) => {
    const result = await useCase.execute();
    response.status(200).json(result);
  };
}

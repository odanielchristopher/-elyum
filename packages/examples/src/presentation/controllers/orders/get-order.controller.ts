import { Get, Param } from '@elyum/http';
import { zodValidator } from '@elyum/validation-zod';

import { GetOrderUseCase } from '../../../application/usecases/orders/get-order.usecase';
import { orderIdSchema } from '../../schemas/orders/order-id.schema';

@Get('/orders/:id')
export class GetOrderController {
  constructor(private readonly getOrderUseCase: GetOrderUseCase) {}

  execute(@Param('id', zodValidator(orderIdSchema)) orderId: string) {
    return this.getOrderUseCase.execute(orderId);
  }
}

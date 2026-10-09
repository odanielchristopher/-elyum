import { Body, Param, Patch } from '@elyum/http';
import { zodValidator } from '@elyum/validation-zod';

import { UpdateOrderStatusUseCase } from '../../../application/usecases/orders/update-order-status.usecase';
import { orderIdSchema } from '../../schemas/orders/order-id.schema';
import {
  type UpdateOrderStatusDto,
  updateOrderStatusSchema,
} from '../../schemas/orders/update-order-status.schema';

@Patch('/orders/:id/status')
export class UpdateOrderStatusController {
  constructor(
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  execute(
    @Param('id', zodValidator(orderIdSchema)) orderId: string,
    @Body(zodValidator(updateOrderStatusSchema))
    input: UpdateOrderStatusDto,
  ) {
    return this.updateOrderStatusUseCase.execute({
      orderId,
      status: input.status,
    });
  }
}

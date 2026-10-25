import { Body, Post } from '@elyum/http';
import { zodValidator } from '@elyum/validation-zod';

import { CreateOrderUseCase } from '../../../application/usecases/orders/create-order.usecase';
import {
  type CreateOrderDto,
  createOrderSchema,
} from '../../schemas/orders/create-order.schema';

@Post('/orders')
export class CreateOrderController {
  constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  execute(
    @Body(zodValidator(createOrderSchema)) createOrderDto: CreateOrderDto,
  ) {
    return this.createOrderUseCase.execute(createOrderDto);
  }
}

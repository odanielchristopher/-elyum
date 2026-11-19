import { Body, Post, httpResult } from '@elyum/http';
import { zodValidator } from '@elyum/validation-zod';

import { PreviewOrderUseCase } from '../../../application/usecases/orders/preview-order.usecase';
import {
  createOrderSchema,
  type CreateOrderDto,
} from '../../schemas/orders/create-order.schema';

@Post('/orders/preview')
export class PreviewOrderController {
  constructor(private readonly previewOrder: PreviewOrderUseCase) {}
  async execute(@Body(zodValidator(createOrderSchema)) input: CreateOrderDto) {
    return httpResult({
      statusCode: 200,
      body: await this.previewOrder.execute(input),
    });
  }
}

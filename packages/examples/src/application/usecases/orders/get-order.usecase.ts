import { Inject, Injectable } from '@elyum/core';

import type { Order } from '../../../domain/entities/order.entity';
import { OrderNotFoundError } from '../../errors/order-not-found.error';
import type { OrderRepository } from '../../ports/order.repository';
import { ORDER_REPOSITORY_TOKEN } from '../../tokens';

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    return order;
  }
}

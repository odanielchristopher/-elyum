import { Inject, Injectable } from '@elyum/core';

import type { Order } from '../../../domain/entities/order.entity';
import type { OrderRepository } from '../../contracts/order.repository';
import { ORDER_REPOSITORY_TOKEN } from '../../tokens';

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
  ) {}

  execute(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }
}

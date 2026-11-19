import type { Order } from '../../../domain/entities/order.entity';
import type { OrderRepository } from '../../contracts/order.repository';
import { OrderNotFoundError } from '../../errors/order-not-found.error';

export class GetOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    return order;
  }
}

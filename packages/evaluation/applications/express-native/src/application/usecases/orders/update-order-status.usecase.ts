import type { Order, OrderStatus } from '../../../domain/entities/order.entity';
import type { OrderRepository } from '../../contracts/order.repository';
import { OrderNotFoundError } from '../../errors/order-not-found.error';

export type UpdateOrderStatusInput = {
  orderId: string;
  status: Exclude<OrderStatus, 'pending'>;
};

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: UpdateOrderStatusInput): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    const updatedOrder = order.transitionTo(input.status);
    await this.orderRepository.save(updatedOrder);

    return updatedOrder;
  }
}

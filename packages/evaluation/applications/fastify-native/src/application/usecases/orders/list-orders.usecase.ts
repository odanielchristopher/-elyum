import type { Order } from '../../../domain/entities/order.entity';
import type { OrderRepository } from '../../contracts/order.repository';

export class ListOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  execute(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }
}

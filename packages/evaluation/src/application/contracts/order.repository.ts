import type { Order } from '../../domain/entities/order.entity';

export abstract class OrderRepository {
  abstract add(order: Order): Promise<void>;
  abstract findAll(): Promise<Order[]>;
  abstract findById(id: string): Promise<Order | undefined>;
  abstract save(order: Order): Promise<void>;
}

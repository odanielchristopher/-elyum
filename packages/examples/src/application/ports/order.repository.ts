import type { Order } from '../../domain/entities/order.entity';

export interface OrderRepository {
  add(order: Order): Promise<void>;
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | undefined>;
  save(order: Order): Promise<void>;
}

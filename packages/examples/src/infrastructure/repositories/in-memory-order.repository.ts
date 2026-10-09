import type { OrderRepository } from '../../application/ports/order.repository';
import type { Order } from '../../domain/entities/order.entity';

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async add(order: Order): Promise<void> {
    if (this.orders.has(order.id)) {
      throw new Error(`Order '${order.id}' already exists.`);
    }

    this.orders.set(order.id, order);
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders.values()];
  }

  async findById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async save(order: Order): Promise<void> {
    if (!this.orders.has(order.id)) {
      throw new Error(`Order '${order.id}' does not exist.`);
    }

    this.orders.set(order.id, order);
  }
}

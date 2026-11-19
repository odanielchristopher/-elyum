import { Order } from '../../../domain/entities/order.entity';
import type { Clock } from '../../contracts/clock';
import type { IdGenerator } from '../../contracts/id-generator';
import type { OrderRepository } from '../../contracts/order.repository';
import type { ProductRepository } from '../../contracts/product.repository';
import { ProductNotFoundError } from '../../errors/product-not-found.error';

export type CreateOrderInput = {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
};

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const items = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.productRepository.findById(item.productId);

        if (!product) {
          throw new ProductNotFoundError(item.productId);
        }

        return {
          productId: product.id,
          quantity: item.quantity,
          unitPriceInCents: product.priceInCents,
        };
      }),
    );

    const order = new Order({
      id: this.idGenerator.generate(),
      customerId: input.customerId,
      items,
      createdAt: this.clock.now(),
    });

    await this.orderRepository.add(order);

    return order;
  }
}

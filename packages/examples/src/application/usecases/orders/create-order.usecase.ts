import { Inject, Injectable } from '@elyum/core';

import { Order } from '../../../domain/entities/order.entity';
import { ProductNotFoundError } from '../../errors/product-not-found.error';
import type { Clock } from '../../ports/clock';
import type { IdGenerator } from '../../ports/id-generator';
import type { OrderRepository } from '../../ports/order.repository';
import type { ProductRepository } from '../../ports/product.repository';
import {
  CLOCK_TOKEN,
  ID_GENERATOR_TOKEN,
  ORDER_REPOSITORY_TOKEN,
  PRODUCT_REPOSITORY_TOKEN,
} from '../../tokens';

export type CreateOrderInput = {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
};

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
    @Inject(ID_GENERATOR_TOKEN)
    private readonly idGenerator: IdGenerator,
    @Inject(CLOCK_TOKEN)
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

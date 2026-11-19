import { Inject, Injectable } from '@elyum/core';

import type { ProductRepository } from '../../contracts/product.repository';
import { ProductNotFoundError } from '../../errors/product-not-found.error';
import { PRODUCT_REPOSITORY_TOKEN } from '../../tokens';

import type { CreateOrderInput } from './create-order.usecase';

@Injectable()
export class PreviewOrderUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly products: ProductRepository,
  ) {}

  async execute(input: CreateOrderInput) {
    const items = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.products.findById(item.productId);
        if (!product) throw new ProductNotFoundError(item.productId);
        return {
          productId: product.id,
          quantity: item.quantity,
          unitPriceInCents: product.priceInCents,
        };
      }),
    );
    return {
      customerId: input.customerId,
      items,
      totalInCents: items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceInCents,
        0,
      ),
    };
  }
}

import { Inject, Injectable } from '@elyum/core';

import { Product } from '../../../domain/entities/product.entity';
import type { Clock } from '../../contracts/clock';
import type { IdGenerator } from '../../contracts/id-generator';
import type { ProductRepository } from '../../contracts/product.repository';
import { ProductAlreadyExistsError } from '../../errors/product-already-exists.error';
import {
  CLOCK_TOKEN,
  ID_GENERATOR_TOKEN,
  PRODUCT_REPOSITORY_TOKEN,
} from '../../tokens';

export type CreateProductInput = {
  name: string;
  description: string;
  priceInCents: number;
};

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
    @Inject(ID_GENERATOR_TOKEN)
    private readonly idGenerator: IdGenerator,
    @Inject(CLOCK_TOKEN)
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const existingProduct = await this.productRepository.findByName(input.name);

    if (existingProduct) {
      throw new ProductAlreadyExistsError(input.name);
    }

    const product = new Product({
      id: this.idGenerator.generate(),
      name: input.name,
      description: input.description,
      priceInCents: input.priceInCents,
      createdAt: this.clock.now(),
    });

    await this.productRepository.add(product);

    return product;
  }
}

import { Inject, Injectable } from '@elyum/core';

import type { Product } from '../../../domain/entities/product.entity';
import type { ProductRepository } from '../../ports/product.repository';
import { PRODUCT_REPOSITORY_TOKEN } from '../../tokens';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
  ) {}

  execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}

import type { Product } from '../../../domain/entities/product.entity';
import type { ProductRepository } from '../../contracts/product.repository';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}

import type { Product } from '../../domain/entities/product.entity';

export abstract class ProductRepository {
  abstract add(product: Product): Promise<void>;
  abstract findAll(): Promise<Product[]>;
  abstract findById(id: string): Promise<Product | undefined>;
  abstract findByName(name: string): Promise<Product | undefined>;
}

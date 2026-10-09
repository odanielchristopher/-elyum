import type { Product } from '../../domain/entities/product.entity';

export interface ProductRepository {
  add(product: Product): Promise<void>;
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | undefined>;
  findByName(name: string): Promise<Product | undefined>;
}

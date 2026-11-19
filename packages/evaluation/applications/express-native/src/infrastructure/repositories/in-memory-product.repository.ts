import type { ProductRepository } from '../../application/contracts/product.repository';
import { ProductAlreadyExistsError } from '../../application/errors/product-already-exists.error';
import type { Product } from '../../domain/entities/product.entity';

export class InMemoryProductRepository implements ProductRepository {
  private readonly products = new Map<string, Product>();

  constructor(initialProducts: readonly Product[] = []) {
    for (const product of initialProducts)
      this.products.set(product.id, product);
  }

  async add(product: Product): Promise<void> {
    const existingProduct = this.findByNameSync(product.name);

    if (existingProduct) {
      throw new ProductAlreadyExistsError(product.name);
    }

    if (this.products.has(product.id)) {
      throw new Error(`Product '${product.id}' already exists.`);
    }

    this.products.set(product.id, product);
  }

  async findAll(): Promise<Product[]> {
    return [...this.products.values()];
  }

  async findById(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async findByName(name: string): Promise<Product | undefined> {
    return this.findByNameSync(name);
  }

  private findByNameSync(name: string): Product | undefined {
    const normalizedName = name.trim().toLocaleLowerCase();

    return [...this.products.values()].find(
      (product) => product.name.toLocaleLowerCase() === normalizedName,
    );
  }
}

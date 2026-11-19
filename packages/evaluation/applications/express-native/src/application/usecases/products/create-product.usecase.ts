import { Product } from '../../../domain/entities/product.entity';
import type { Clock } from '../../contracts/clock';
import type { IdGenerator } from '../../contracts/id-generator';
import type { ProductRepository } from '../../contracts/product.repository';
import { ProductAlreadyExistsError } from '../../errors/product-already-exists.error';

export type CreateProductInput = {
  name: string;
  description: string;
  priceInCents: number;
};

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly idGenerator: IdGenerator,
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

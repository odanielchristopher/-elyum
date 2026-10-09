import { describe, expect, it } from 'vitest';

import { ProductAlreadyExistsError } from '../../src/application/errors/product-already-exists.error';
import type { Clock } from '../../src/application/ports/clock';
import type { IdGenerator } from '../../src/application/ports/id-generator';
import { CreateProductUseCase } from '../../src/application/usecases/products/create-product.usecase';
import { ListProductsUseCase } from '../../src/application/usecases/products/list-products.usecase';
import { InMemoryProductRepository } from '../../src/infrastructure/repositories/in-memory-product.repository';

const NOW = new Date('2026-01-01T00:00:00.000Z');

class FixedIdGenerator implements IdGenerator {
  generate(): string {
    return 'product-1';
  }
}

class FixedClock implements Clock {
  now(): Date {
    return NOW;
  }
}

describe('product use cases', () => {
  it('should create and list products', async () => {
    const repository = new InMemoryProductRepository();
    const createProduct = new CreateProductUseCase(
      repository,
      new FixedIdGenerator(),
      new FixedClock(),
    );
    const listProducts = new ListProductsUseCase(repository);

    const product = await createProduct.execute({
      name: 'Keyboard',
      description: 'Mechanical keyboard',
      priceInCents: 25_000,
    });

    expect(product).toMatchObject({
      id: 'product-1',
      name: 'Keyboard',
      priceInCents: 25_000,
      createdAt: NOW,
    });
    await expect(listProducts.execute()).resolves.toEqual([product]);
  });

  it('should reject duplicate product names regardless of casing', async () => {
    const repository = new InMemoryProductRepository();
    const createProduct = new CreateProductUseCase(
      repository,
      new FixedIdGenerator(),
      new FixedClock(),
    );
    await createProduct.execute({
      name: 'Keyboard',
      description: 'Mechanical keyboard',
      priceInCents: 25_000,
    });

    await expect(
      createProduct.execute({
        name: 'keyboard',
        description: 'Another keyboard',
        priceInCents: 30_000,
      }),
    ).rejects.toBeInstanceOf(ProductAlreadyExistsError);
  });

  it('should preserve product-name uniqueness during concurrent creation', async () => {
    const repository = new InMemoryProductRepository();
    const createProduct = new CreateProductUseCase(
      repository,
      new FixedIdGenerator(),
      new FixedClock(),
    );

    const results = await Promise.allSettled([
      createProduct.execute({
        name: 'Keyboard',
        description: 'First keyboard',
        priceInCents: 25_000,
      }),
      createProduct.execute({
        name: 'keyboard',
        description: 'Second keyboard',
        priceInCents: 30_000,
      }),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toEqual([
      expect.objectContaining({
        reason: expect.any(ProductAlreadyExistsError),
      }),
    ]);
  });
});

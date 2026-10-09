import { afterEach, describe, expect, it } from 'vitest';

import { CreateOrderUseCase } from '../../src/application/usecases/orders/create-order.usecase';
import { CreateProductUseCase } from '../../src/application/usecases/products/create-product.usecase';
import { ListProductsUseCase } from '../../src/application/usecases/products/list-products.usecase';
import { buildApplication } from '../../src/fastify';
import { CreateOrderController } from '../../src/presentation/controllers/orders/create-order.controller';
import { CreateProductController } from '../../src/presentation/controllers/products/create-product.controller';
import { ListProductsController } from '../../src/presentation/controllers/products/list-products.controller';

function defineConstructorMetadataForVitest(): void {
  // Vite does not emit design:paramtypes. Production tsc builds do.
  Reflect.defineMetadata(
    'design:paramtypes',
    [Object, Object, Object, Object],
    CreateOrderUseCase,
  );
  Reflect.defineMetadata(
    'design:paramtypes',
    [Object, Object, Object],
    CreateProductUseCase,
  );
  Reflect.defineMetadata('design:paramtypes', [Object], ListProductsUseCase);
  Reflect.defineMetadata(
    'design:paramtypes',
    [CreateOrderUseCase],
    CreateOrderController,
  );
  Reflect.defineMetadata(
    'design:paramtypes',
    [CreateProductUseCase],
    CreateProductController,
  );
  Reflect.defineMetadata(
    'design:paramtypes',
    [ListProductsUseCase],
    ListProductsController,
  );
}

describe('Fastify order API', () => {
  const applications: ReturnType<typeof buildApplication>[] = [];

  afterEach(async () => {
    await Promise.all(
      applications.splice(0).map((application) => application.close()),
    );
  });

  it('should create a product and use its catalog price in a new order', async () => {
    defineConstructorMetadataForVitest();
    const application = buildApplication();
    applications.push(application);

    const productResponse = await application.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Keyboard',
        description: 'Mechanical keyboard',
        priceInCents: 25_000,
      },
    });
    const product = productResponse.json<{ id: string }>();

    const orderResponse = await application.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        customerId: '93464e3f-01cf-47f2-8608-62c82a1ff25c',
        items: [{ productId: product.id, quantity: 2 }],
      },
    });

    expect(productResponse.statusCode).toBe(201);
    expect(orderResponse.statusCode).toBe(201);
    expect(orderResponse.json()).toMatchObject({
      customerId: '93464e3f-01cf-47f2-8608-62c82a1ff25c',
      status: 'pending',
      totalInCents: 50_000,
      items: [
        {
          productId: product.id,
          quantity: 2,
          unitPriceInCents: 25_000,
        },
      ],
    });
  });
});

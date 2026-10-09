import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApplication } from '../../src/alyum-fastify';
import { EXAMPLE_AUTHORIZATION } from '../../src/alyum-fastify/hooks/authenticate.hook';
import { CreateOrderUseCase } from '../../src/application/usecases/orders/create-order.usecase';
import { GetOrderUseCase } from '../../src/application/usecases/orders/get-order.usecase';
import { ListOrdersUseCase } from '../../src/application/usecases/orders/list-orders.usecase';
import { UpdateOrderStatusUseCase } from '../../src/application/usecases/orders/update-order-status.usecase';
import { CreateProductUseCase } from '../../src/application/usecases/products/create-product.usecase';
import { ListProductsUseCase } from '../../src/application/usecases/products/list-products.usecase';
import { CreateOrderController } from '../../src/presentation/controllers/orders/create-order.controller';
import { GetOrderController } from '../../src/presentation/controllers/orders/get-order.controller';
import { ListOrdersController } from '../../src/presentation/controllers/orders/list-orders.controller';
import { UpdateOrderStatusController } from '../../src/presentation/controllers/orders/update-order-status.controller';
import { CreateProductController } from '../../src/presentation/controllers/products/create-product.controller';
import { ListProductsController } from '../../src/presentation/controllers/products/list-products.controller';

function defineConstructorMetadataForVitest(): void {
  // Vite does not emit design:paramtypes. Production tsc builds do.
  Reflect.defineMetadata(
    'design:paramtypes',
    [Object, Object, Object, Object],
    CreateOrderUseCase,
  );
  Reflect.defineMetadata('design:paramtypes', [Object], GetOrderUseCase);
  Reflect.defineMetadata('design:paramtypes', [Object], ListOrdersUseCase);
  Reflect.defineMetadata(
    'design:paramtypes',
    [Object],
    UpdateOrderStatusUseCase,
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
  Reflect.defineMetadata(
    'design:paramtypes',
    [GetOrderUseCase],
    GetOrderController,
  );
  Reflect.defineMetadata(
    'design:paramtypes',
    [ListOrdersUseCase],
    ListOrdersController,
  );
  Reflect.defineMetadata(
    'design:paramtypes',
    [UpdateOrderStatusUseCase],
    UpdateOrderStatusController,
  );
}

type TestApplication = ReturnType<typeof buildApplication>;

async function createProduct(application: TestApplication) {
  const response = await application.inject({
    method: 'POST',
    url: '/products',
    payload: {
      name: 'Keyboard',
      description: 'Mechanical keyboard',
      priceInCents: 25_000,
    },
  });

  expect(response.statusCode).toBe(201);
  return response.json<{ id: string }>();
}

async function createOrder(application: TestApplication, productId: string) {
  const response = await application.inject({
    method: 'POST',
    url: '/orders',
    headers: { authorization: EXAMPLE_AUTHORIZATION },
    payload: {
      customerId: '93464e3f-01cf-47f2-8608-62c82a1ff25c',
      items: [{ productId, quantity: 2 }],
    },
  });

  expect(response.statusCode).toBe(201);
  return response.json<{ id: string; status: string; totalInCents: number }>();
}

describe('Fastify order API', () => {
  const applications: ReturnType<typeof buildApplication>[] = [];

  beforeEach(() => {
    defineConstructorMetadataForVitest();
  });

  afterEach(async () => {
    await Promise.all(
      applications.splice(0).map((application) => application.close()),
    );
  });

  it('should create a product and use its catalog price in a new order', async () => {
    const application = buildApplication();
    applications.push(application);

    const product = await createProduct(application);
    const order = await createOrder(application, product.id);

    expect(order).toMatchObject({
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

  it('should register read and status routes against the same in-memory state', async () => {
    const application = buildApplication();
    applications.push(application);
    const product = await createProduct(application);
    const order = await createOrder(application, product.id);

    const getResponse = await application.inject({
      method: 'GET',
      url: `/orders/${order.id}`,
      headers: { authorization: EXAMPLE_AUTHORIZATION },
    });
    const listResponse = await application.inject({
      method: 'GET',
      url: '/orders',
      headers: { authorization: EXAMPLE_AUTHORIZATION },
    });
    const updateResponse = await application.inject({
      method: 'PATCH',
      url: `/orders/${order.id}/status`,
      headers: { authorization: EXAMPLE_AUTHORIZATION },
      payload: { status: 'confirmed' },
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({ id: order.id });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([
      expect.objectContaining({ id: order.id }),
    ]);
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      id: order.id,
      status: 'confirmed',
    });
  });

  it('should map validation and application errors to HTTP responses', async () => {
    const application = buildApplication();
    applications.push(application);

    const invalidProductResponse = await application.inject({
      method: 'POST',
      url: '/products',
      payload: { name: '', description: '', priceInCents: 0 },
    });
    const missingOrderResponse = await application.inject({
      method: 'GET',
      url: '/orders/93464e3f-01cf-47f2-8608-62c82a1ff25c',
      headers: { authorization: EXAMPLE_AUTHORIZATION },
    });

    expect(invalidProductResponse.statusCode).toBe(400);
    expect(invalidProductResponse.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(missingOrderResponse.statusCode).toBe(404);
    expect(missingOrderResponse.json()).toMatchObject({
      code: 'ORDER_NOT_FOUND',
    });
  });

  it('should map duplicate products and invalid transitions to conflicts', async () => {
    const application = buildApplication();
    applications.push(application);
    const product = await createProduct(application);
    const order = await createOrder(application, product.id);

    const duplicateProductResponse = await application.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'keyboard',
        description: 'Duplicate keyboard',
        priceInCents: 30_000,
      },
    });
    await application.inject({
      method: 'PATCH',
      url: `/orders/${order.id}/status`,
      headers: { authorization: EXAMPLE_AUTHORIZATION },
      payload: { status: 'confirmed' },
    });
    const invalidTransitionResponse = await application.inject({
      method: 'PATCH',
      url: `/orders/${order.id}/status`,
      headers: { authorization: EXAMPLE_AUTHORIZATION },
      payload: { status: 'cancelled' },
    });

    expect(duplicateProductResponse.statusCode).toBe(409);
    expect(duplicateProductResponse.json()).toMatchObject({
      code: 'PRODUCT_ALREADY_EXISTS',
    });
    expect(invalidTransitionResponse.statusCode).toBe(409);
    expect(invalidTransitionResponse.json()).toMatchObject({
      code: 'INVALID_ORDER_STATUS_TRANSITION',
    });
  });

  it('should preserve native Fastify hooks on controller routes', async () => {
    const application = buildApplication();
    applications.push(application);

    const response = await application.inject({
      method: 'GET',
      url: '/orders',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Provide the example bearer token to access order routes.',
    });
  });
});

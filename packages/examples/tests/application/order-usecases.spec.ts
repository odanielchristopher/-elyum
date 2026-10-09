import { describe, expect, it } from 'vitest';

import { OrderNotFoundError } from '../../src/application/errors/order-not-found.error';
import { ProductNotFoundError } from '../../src/application/errors/product-not-found.error';
import type { Clock } from '../../src/application/ports/clock';
import type { IdGenerator } from '../../src/application/ports/id-generator';
import { CreateOrderUseCase } from '../../src/application/usecases/orders/create-order.usecase';
import { GetOrderUseCase } from '../../src/application/usecases/orders/get-order.usecase';
import { ListOrdersUseCase } from '../../src/application/usecases/orders/list-orders.usecase';
import { UpdateOrderStatusUseCase } from '../../src/application/usecases/orders/update-order-status.usecase';
import { Product } from '../../src/domain/entities/product.entity';
import { InMemoryOrderRepository } from '../../src/infrastructure/repositories/in-memory-order.repository';
import { InMemoryProductRepository } from '../../src/infrastructure/repositories/in-memory-product.repository';

const NOW = new Date('2026-01-01T00:00:00.000Z');

class FixedIdGenerator implements IdGenerator {
  generate(): string {
    return 'order-1';
  }
}

class FixedClock implements Clock {
  now(): Date {
    return NOW;
  }
}

async function createFixture() {
  const orderRepository = new InMemoryOrderRepository();
  const productRepository = new InMemoryProductRepository();
  const product = new Product({
    id: 'product-1',
    name: 'Keyboard',
    description: 'Mechanical keyboard',
    priceInCents: 25_000,
    createdAt: NOW,
  });
  await productRepository.add(product);

  return {
    orderRepository,
    productRepository,
    createOrder: new CreateOrderUseCase(
      orderRepository,
      productRepository,
      new FixedIdGenerator(),
      new FixedClock(),
    ),
  };
}

describe('order use cases', () => {
  it('should create an order using prices owned by the product catalog', async () => {
    const fixture = await createFixture();

    const order = await fixture.createOrder.execute({
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    expect(order).toMatchObject({
      id: 'order-1',
      customerId: 'customer-1',
      status: 'pending',
      totalInCents: 50_000,
      createdAt: NOW,
    });
    await expect(fixture.orderRepository.findById('order-1')).resolves.toBe(
      order,
    );
  });

  it('should reject an order containing an unknown product', async () => {
    const fixture = await createFixture();

    await expect(
      fixture.createOrder.execute({
        customerId: 'customer-1',
        items: [{ productId: 'missing-product', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('should read and list persisted orders', async () => {
    const fixture = await createFixture();
    const createdOrder = await fixture.createOrder.execute({
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 1 }],
    });
    const getOrder = new GetOrderUseCase(fixture.orderRepository);
    const listOrders = new ListOrdersUseCase(fixture.orderRepository);

    await expect(getOrder.execute(createdOrder.id)).resolves.toBe(createdOrder);
    await expect(listOrders.execute()).resolves.toEqual([createdOrder]);
  });

  it('should report an unknown order with an application error', async () => {
    const fixture = await createFixture();
    const getOrder = new GetOrderUseCase(fixture.orderRepository);

    await expect(getOrder.execute('missing-order')).rejects.toMatchObject({
      name: 'OrderNotFoundError',
      code: 'ORDER_NOT_FOUND',
    } satisfies Partial<OrderNotFoundError>);
  });

  it('should persist a valid order status transition', async () => {
    const fixture = await createFixture();
    await fixture.createOrder.execute({
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 1 }],
    });
    const updateStatus = new UpdateOrderStatusUseCase(fixture.orderRepository);

    const updatedOrder = await updateStatus.execute({
      orderId: 'order-1',
      status: 'confirmed',
    });

    expect(updatedOrder.status).toBe('confirmed');
    await expect(fixture.orderRepository.findById('order-1')).resolves.toBe(
      updatedOrder,
    );
  });
});

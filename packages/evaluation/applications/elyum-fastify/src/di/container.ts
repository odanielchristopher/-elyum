import { ElyumFactory } from '@elyum/core';

import type { Clock } from '../application/contracts/clock';
import type { IdGenerator } from '../application/contracts/id-generator';
import {
  CLOCK_TOKEN,
  ID_GENERATOR_TOKEN,
  ORDER_REPOSITORY_TOKEN,
  PRODUCT_REPOSITORY_TOKEN,
} from '../application/tokens';
import { Product } from '../domain/entities/product.entity';
import { NodeIdGenerator } from '../infrastructure/random/node-id-generator';
import { InMemoryOrderRepository } from '../infrastructure/repositories/in-memory-order.repository';
import { InMemoryProductRepository } from '../infrastructure/repositories/in-memory-product.repository';
import { SystemClock } from '../infrastructure/time/system-clock';

export function createContainer(
  options: { clock?: Clock; idGenerator?: IdGenerator } = {},
) {
  const container = ElyumFactory.createRoot();

  container.register({
    token: ORDER_REPOSITORY_TOKEN,
    useClass: InMemoryOrderRepository,
  });
  container.register({
    token: PRODUCT_REPOSITORY_TOKEN,
    useValue: new InMemoryProductRepository([
      new Product({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Mechanical Keyboard',
        description: 'Mechanical keyboard',
        priceInCents: 25000,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      new Product({
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Wireless Mouse',
        description: 'Wireless mouse',
        priceInCents: 10000,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      new Product({
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Monitor',
        description: '24-inch monitor',
        priceInCents: 90000,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ]),
  });
  container.register({
    token: ID_GENERATOR_TOKEN,
    useValue: options.idGenerator ?? new NodeIdGenerator(),
  });
  container.register({
    token: CLOCK_TOKEN,
    useValue: options.clock ?? new SystemClock(),
  });

  return container;
}

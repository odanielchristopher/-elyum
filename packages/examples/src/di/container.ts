import { ElyumFactory } from '@elyum/core';

import {
  CLOCK_TOKEN,
  ID_GENERATOR_TOKEN,
  ORDER_REPOSITORY_TOKEN,
  PRODUCT_REPOSITORY_TOKEN,
} from '../application/tokens';
import { NodeIdGenerator } from '../infrastructure/random/node-id-generator';
import { InMemoryOrderRepository } from '../infrastructure/repositories/in-memory-order.repository';
import { InMemoryProductRepository } from '../infrastructure/repositories/in-memory-product.repository';
import { SystemClock } from '../infrastructure/time/system-clock';

export function createContainer() {
  const container = ElyumFactory.createRoot();

  container.register({
    token: ORDER_REPOSITORY_TOKEN,
    useClass: InMemoryOrderRepository,
  });
  container.register({
    token: PRODUCT_REPOSITORY_TOKEN,
    useClass: InMemoryProductRepository,
  });
  container.register({ token: ID_GENERATOR_TOKEN, useClass: NodeIdGenerator });
  container.register({ token: CLOCK_TOKEN, useClass: SystemClock });

  return container;
}

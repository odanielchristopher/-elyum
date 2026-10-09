import type { InjectionToken } from '@elyum/core';

import type { Clock } from './ports/clock';
import type { IdGenerator } from './ports/id-generator';
import type { OrderRepository } from './ports/order.repository';
import type { ProductRepository } from './ports/product.repository';

export const CLOCK_TOKEN: InjectionToken<Clock> = Symbol('Clock');
export const ID_GENERATOR_TOKEN: InjectionToken<IdGenerator> =
  Symbol('IdGenerator');
export const ORDER_REPOSITORY_TOKEN: InjectionToken<OrderRepository> =
  Symbol('OrderRepository');
export const PRODUCT_REPOSITORY_TOKEN: InjectionToken<ProductRepository> =
  Symbol('ProductRepository');

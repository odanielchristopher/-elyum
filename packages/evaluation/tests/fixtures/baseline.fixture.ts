import type { Variant } from '../helpers/application.helper';

export const VARIANTS: Variant[] = [
  'elyum-fastify',
  'fastify-native',
  'elyum-express',
  'express-native',
];
export const CUSTOMER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const MISSING_ID = '99999999-9999-4999-8999-999999999999';
export const GENERATED_ID = '44444444-4444-4444-8444-444444444444';
export const NOW = '2026-02-01T12:00:00.000Z';
export const SEED = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Mechanical Keyboard',
    description: 'Mechanical keyboard',
    priceInCents: 25000,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Wireless Mouse',
    description: 'Wireless mouse',
    priceInCents: 10000,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Monitor',
    description: '24-inch monitor',
    priceInCents: 90000,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
export const PRODUCT_INPUT = {
  name: 'Desk Lamp',
  description: 'Adjustable desk lamp',
  priceInCents: 15000,
};
export const ORDER_INPUT = {
  customerId: CUSTOMER_ID,
  items: [{ productId: SEED[0]!.id, quantity: 2 }],
};
export const B2_INPUT = {
  customerId: CUSTOMER_ID,
  items: SEED.map((product, index) => ({
    productId: product.id,
    quantity: [2, 3, 1][index]!,
  })),
};
export const B2_BODY = {
  customerId: CUSTOMER_ID,
  items: [
    { productId: SEED[0]!.id, quantity: 2, unitPriceInCents: 25000 },
    { productId: SEED[1]!.id, quantity: 3, unitPriceInCents: 10000 },
    { productId: SEED[2]!.id, quantity: 1, unitPriceInCents: 90000 },
  ],
  totalInCents: 170000,
};
export const B3_INPUT = {
  customerId: 'invalid-customer-id',
  items: [{ productId: 'invalid-product-id', quantity: 0 }],
};
export const B3_BODY = {
  code: 'VALIDATION_ERROR',
  message: 'Validation failed with 3 errors',
  errors: [
    {
      field: 'customerId',
      code: 'invalid_format',
      message: 'Invalid customer ID.',
    },
    {
      field: 'items.0.productId',
      code: 'invalid_format',
      message: 'Invalid product ID.',
    },
    {
      field: 'items.0.quantity',
      code: 'too_small',
      message: 'Quantity must be a positive integer.',
    },
  ],
};
export const FIXED_DEPENDENCIES = {
  clock: { now: () => new Date(NOW) },
  idGenerator: { generate: () => GENERATED_ID },
};

import { describe, expect, it } from 'vitest';

import {
  request,
  withApplication,
  type Variant,
} from '../helpers/application.helper';

const variants: Variant[] = [
  'elyum-fastify',
  'fastify-native',
  'elyum-express',
  'express-native',
];

describe.each(variants)('%s baseline smoke', (variant) => {
  it('should expose health and the deterministic catalog over real HTTP', async () => {
    await withApplication(variant, async (baseUrl) => {
      const health = await request(baseUrl, '/health');
      expect(health.status).toBe(200);
      expect(health.headers.get('x-request-source')).toBe('evaluation');
      expect(await health.json()).toEqual({ status: 'ok', version: '0.1.0' });
      const catalog = await request(baseUrl, '/products');
      expect(catalog.status).toBe(200);
      expect(await catalog.json()).toHaveLength(3);
    });
  });

  it('should create orders with injected IDs and time and read persisted state', async () => {
    await withApplication(
      variant,
      async (baseUrl) => {
        const response = await request(baseUrl, '/orders', 'POST', {
          customerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          items: [
            { productId: '11111111-1111-4111-8111-111111111111', quantity: 2 },
          ],
        });
        expect(response.status).toBe(201);
        const order = await response.json();
        expect(order).toMatchObject({
          id: '44444444-4444-4444-8444-444444444444',
          createdAt: '2026-02-01T12:00:00.000Z',
          status: 'pending',
          totalInCents: 50000,
        });
        const read = await request(baseUrl, `/orders/${order.id}`);
        expect(await read.json()).toEqual(order);
      },
      {
        clock: { now: () => new Date('2026-02-01T12:00:00.000Z') },
        idGenerator: { generate: () => '44444444-4444-4444-8444-444444444444' },
      },
    );
  });

  it('should validate input and map known application failures', async () => {
    await withApplication(variant, async (baseUrl) => {
      const invalid = await request(baseUrl, '/orders/preview', 'POST', {
        customerId: 'invalid-customer-id',
        items: [{ productId: 'invalid-product-id', quantity: 0 }],
      });
      expect(invalid.status).toBe(400);
      const body = await invalid.json();
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.errors).toHaveLength(3);
      const missing = await request(
        baseUrl,
        '/orders/44444444-4444-4444-8444-444444444444',
      );
      expect(missing.status).toBe(404);
      expect(await missing.json()).toMatchObject({ code: 'ORDER_NOT_FOUND' });
    });
  });
});

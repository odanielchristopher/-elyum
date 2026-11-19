import { describe, expect, it } from 'vitest';

import {
  B2_BODY,
  B2_INPUT,
  CUSTOMER_ID,
  FIXED_DEPENDENCIES,
  GENERATED_ID,
  MISSING_ID,
  NOW,
  ORDER_INPUT,
  PRODUCT_INPUT,
  SEED,
  VARIANTS,
} from '../fixtures/baseline.fixture';
import {
  loadApplication,
  request,
  withApplication,
} from '../helpers/application.helper';
import {
  applicationError,
  byId,
  jsonResponse,
  validationError,
} from '../helpers/response.helper';

const productCases: Array<[string, unknown, string, string]> = [
  [
    'missing name',
    { description: '', priceInCents: 1 },
    'name',
    'invalid_type',
  ],
  ['null name', { ...PRODUCT_INPUT, name: null }, 'name', 'invalid_type'],
  ['numeric name', { ...PRODUCT_INPUT, name: 1 }, 'name', 'invalid_type'],
  ['empty name', { ...PRODUCT_INPUT, name: '' }, 'name', 'too_small'],
  ['blank name', { ...PRODUCT_INPUT, name: '   ' }, 'name', 'too_small'],
  ['long name', { ...PRODUCT_INPUT, name: 'a'.repeat(101) }, 'name', 'too_big'],
  [
    'missing description',
    { name: 'Lamp', priceInCents: 1 },
    'description',
    'invalid_type',
  ],
  [
    'null description',
    { ...PRODUCT_INPUT, description: null },
    'description',
    'invalid_type',
  ],
  [
    'numeric description',
    { ...PRODUCT_INPUT, description: 1 },
    'description',
    'invalid_type',
  ],
  [
    'long description',
    { ...PRODUCT_INPUT, description: 'a'.repeat(256) },
    'description',
    'too_big',
  ],
  [
    'missing price',
    { name: 'Lamp', description: '' },
    'priceInCents',
    'invalid_type',
  ],
  [
    'null price',
    { ...PRODUCT_INPUT, priceInCents: null },
    'priceInCents',
    'invalid_type',
  ],
  [
    'string price',
    { ...PRODUCT_INPUT, priceInCents: '15000' },
    'priceInCents',
    'invalid_type',
  ],
  [
    'zero price',
    { ...PRODUCT_INPUT, priceInCents: 0 },
    'priceInCents',
    'too_small',
  ],
  [
    'negative price',
    { ...PRODUCT_INPUT, priceInCents: -1 },
    'priceInCents',
    'too_small',
  ],
  [
    'fractional price',
    { ...PRODUCT_INPUT, priceInCents: 1.5 },
    'priceInCents',
    'invalid_type',
  ],
];
const orderCases: Array<[string, unknown, string, string]> = [
  [
    'missing customer',
    { items: ORDER_INPUT.items },
    'customerId',
    'invalid_type',
  ],
  [
    'null customer',
    { ...ORDER_INPUT, customerId: null },
    'customerId',
    'invalid_type',
  ],
  [
    'numeric customer',
    { ...ORDER_INPUT, customerId: 1 },
    'customerId',
    'invalid_type',
  ],
  [
    'invalid customer',
    { ...ORDER_INPUT, customerId: 'invalid' },
    'customerId',
    'invalid_format',
  ],
  ['missing items', { customerId: CUSTOMER_ID }, 'items', 'invalid_type'],
  ['non-array items', { ...ORDER_INPUT, items: {} }, 'items', 'invalid_type'],
  ['empty items', { ...ORDER_INPUT, items: [] }, 'items', 'too_small'],
  [
    'missing product',
    { ...ORDER_INPUT, items: [{ quantity: 1 }] },
    'items.0.productId',
    'invalid_type',
  ],
  [
    'invalid product',
    { ...ORDER_INPUT, items: [{ productId: 'invalid', quantity: 1 }] },
    'items.0.productId',
    'invalid_format',
  ],
  [
    'missing quantity',
    { ...ORDER_INPUT, items: [{ productId: SEED[0]!.id }] },
    'items.0.quantity',
    'invalid_type',
  ],
  [
    'string quantity',
    { ...ORDER_INPUT, items: [{ ...ORDER_INPUT.items[0], quantity: '1' }] },
    'items.0.quantity',
    'invalid_type',
  ],
  [
    'zero quantity',
    { ...ORDER_INPUT, items: [{ ...ORDER_INPUT.items[0], quantity: 0 }] },
    'items.0.quantity',
    'too_small',
  ],
  [
    'negative quantity',
    { ...ORDER_INPUT, items: [{ ...ORDER_INPUT.items[0], quantity: -1 }] },
    'items.0.quantity',
    'too_small',
  ],
  [
    'fractional quantity',
    { ...ORDER_INPUT, items: [{ ...ORDER_INPUT.items[0], quantity: 1.5 }] },
    'items.0.quantity',
    'invalid_type',
  ],
];

describe.each(VARIANTS)('%s baseline contract v2', (variant) => {
  it('should serve constant health without consulting the clock or ID generator', async () => {
    await withApplication(
      variant,
      async (url) => {
        expect(await jsonResponse(await request(url, '/health'), 200)).toEqual({
          status: 'ok',
          version: '0.1.0',
        });
      },
      {
        clock: {
          now() {
            throw new Error('Unexpected clock access');
          },
        },
        idGenerator: {
          generate() {
            throw new Error('Unexpected ID access');
          },
        },
      },
    );
  });

  it('should start with exactly the specified catalog and no orders', async () => {
    await withApplication(variant, async (url) => {
      expect(
        byId(await jsonResponse(await request(url, '/products'), 200)),
      ).toEqual(byId(SEED));
      expect(await jsonResponse(await request(url, '/orders'), 200)).toEqual(
        [],
      );
    });
  });

  it('should normalize product fields, discard unknown input and use injected dependencies', async () => {
    await withApplication(
      variant,
      async (url) => {
        const product = await jsonResponse(
          await request(url, '/products', 'POST', {
            ...PRODUCT_INPUT,
            name: '  Desk Lamp  ',
            description: '  Adjustable desk lamp  ',
            password: 'example-password-marker',
            nested: { secret: 'example-nested-marker' },
            id: MISSING_ID,
          }),
          201,
        );
        expect(product).toEqual({
          id: GENERATED_ID,
          ...PRODUCT_INPUT,
          createdAt: NOW,
        });
        expect(
          byId(await jsonResponse(await request(url, '/products'), 200)),
        ).toEqual(byId([...SEED, product]));
      },
      FIXED_DEPENDENCIES,
    );
  });

  it.each([
    [1, 0],
    [100, 255],
  ])(
    'should accept product name length %s and description length %s',
    async (nameLength, descriptionLength) => {
      await withApplication(variant, async (url) => {
        const product = await jsonResponse(
          await request(url, '/products', 'POST', {
            name: 'a'.repeat(nameLength),
            description: 'd'.repeat(descriptionLength),
            priceInCents: 1,
          }),
          201,
        );
        expect(product.name).toHaveLength(nameLength);
        expect(product.description).toHaveLength(descriptionLength);
      });
    },
  );

  it.each(productCases)(
    'should reject product input: %s',
    async (_label, payload, field, code) => {
      await withApplication(variant, async (url) => {
        await validationError(
          await request(url, '/products', 'POST', payload),
          [{ field, code }],
        );
      });
    },
  );

  it('should preserve product validation error order', async () => {
    await withApplication(variant, async (url) => {
      await validationError(
        await request(url, '/products', 'POST', {
          name: '',
          priceInCents: 0,
          description: 'd'.repeat(256),
        }),
        [
          { field: 'name', code: 'too_small' },
          { field: 'priceInCents', code: 'too_small' },
          { field: 'description', code: 'too_big' },
        ],
      );
    });
  });

  it('should reject duplicate seeded and created names without regard to case', async () => {
    await withApplication(variant, async (url) => {
      await applicationError(
        await request(url, '/products', 'POST', {
          ...PRODUCT_INPUT,
          name: '  mechanical KEYBOARD ',
        }),
        409,
        'PRODUCT_ALREADY_EXISTS',
      );
      await jsonResponse(
        await request(url, '/products', 'POST', PRODUCT_INPUT),
        201,
      );
      await applicationError(
        await request(url, '/products', 'POST', {
          ...PRODUCT_INPUT,
          name: 'desk LAMP',
        }),
        409,
        'PRODUCT_ALREADY_EXISTS',
      );
      expect(
        await jsonResponse(await request(url, '/products'), 200),
      ).toHaveLength(4);
    });
  });

  describe.each(['/orders', '/orders/preview'])('%s validation', (route) => {
    it.each(orderCases)(
      'should reject order input: %s',
      async (_label, payload, field, code) => {
        await withApplication(variant, async (url) => {
          await validationError(await request(url, route, 'POST', payload), [
            { field, code },
          ]);
          expect(
            await jsonResponse(await request(url, '/orders'), 200),
          ).toEqual([]);
        });
      },
    );

    it.each([null, [], 'invalid', 1])(
      'should reject a non-object JSON body: %s',
      async (payload) => {
        await withApplication(variant, async (url) => {
          // Well-formed JSON reaches Zod in every treatment.
          await validationError(await request(url, route, 'POST', payload), [
            { field: 'root', code: 'invalid_type' },
          ]);
        });
      },
    );

    it('should reject a missing product without persisting or consuming dependencies', async () => {
      let ids = 0;
      let clocks = 0;
      await withApplication(
        variant,
        async (url) => {
          await applicationError(
            await request(url, route, 'POST', {
              ...ORDER_INPUT,
              items: [{ productId: MISSING_ID, quantity: 1 }],
            }),
            404,
            'PRODUCT_NOT_FOUND',
          );
          expect(
            await jsonResponse(await request(url, '/orders'), 200),
          ).toEqual([]);
          expect(ids).toBe(0);
          expect(clocks).toBe(0);
        },
        {
          clock: {
            now() {
              clocks++;
              return new Date(NOW);
            },
          },
          idGenerator: {
            generate() {
              ids++;
              return GENERATED_ID;
            },
          },
        },
      );
    });
  });

  it('should price an order from the catalog and preserve duplicate lines and their order', async () => {
    await withApplication(
      variant,
      async (url) => {
        const items = [
          { productId: SEED[1]!.id, quantity: 2, unitPriceInCents: 1 },
          { productId: SEED[0]!.id, quantity: 1 },
          { productId: SEED[1]!.id, quantity: 3 },
        ];
        const order = await jsonResponse(
          await request(url, '/orders', 'POST', {
            customerId: CUSTOMER_ID,
            items,
            totalInCents: 1,
            status: 'confirmed',
            createdAt: 'invalid',
            token: 'example-token-marker',
          }),
          201,
        );
        expect(order).toEqual({
          id: GENERATED_ID,
          customerId: CUSTOMER_ID,
          items: [
            { productId: SEED[1]!.id, quantity: 2, unitPriceInCents: 10000 },
            { productId: SEED[0]!.id, quantity: 1, unitPriceInCents: 25000 },
            { productId: SEED[1]!.id, quantity: 3, unitPriceInCents: 10000 },
          ],
          status: 'pending',
          createdAt: NOW,
          totalInCents: 75000,
        });
        expect(
          await jsonResponse(
            await request(url, `/orders/${GENERATED_ID}`),
            200,
          ),
        ).toEqual(order);
        expect(await jsonResponse(await request(url, '/orders'), 200)).toEqual([
          order,
        ]);
      },
      FIXED_DEPENDENCIES,
    );
  });

  it('should list several orders by identity without requiring list order', async () => {
    let sequence = 4;
    await withApplication(
      variant,
      async (url) => {
        const orders = [];
        for (let i = 0; i < 2; i++)
          orders.push(
            await jsonResponse(
              await request(url, '/orders', 'POST', ORDER_INPUT),
              201,
            ),
          );
        expect(
          byId(await jsonResponse(await request(url, '/orders'), 200)),
        ).toEqual(byId(orders));
      },
      {
        clock: FIXED_DEPENDENCIES.clock,
        idGenerator: {
          generate: () => `${sequence++}4444444-4444-4444-8444-444444444444`,
        },
      },
    );
  });

  it('should preview the official payload repeatedly without state, ID or clock changes', async () => {
    let ids = 0;
    let clocks = 0;
    await withApplication(
      variant,
      async (url) => {
        for (let i = 0; i < 2; i++)
          expect(
            await jsonResponse(
              await request(url, '/orders/preview', 'POST', B2_INPUT),
              200,
            ),
          ).toEqual(B2_BODY);
        expect(await jsonResponse(await request(url, '/orders'), 200)).toEqual(
          [],
        );
        expect(ids).toBe(0);
        expect(clocks).toBe(0);
        expect(
          await jsonResponse(
            await request(url, '/orders', 'POST', ORDER_INPUT),
            201,
          ),
        ).toMatchObject({ id: GENERATED_ID });
        expect(ids).toBe(1);
        expect(clocks).toBe(1);
      },
      {
        clock: {
          now() {
            clocks++;
            return new Date(NOW);
          },
        },
        idGenerator: {
          generate() {
            ids++;
            return GENERATED_ID;
          },
        },
      },
    );
  });

  it('should preserve duplicate lines and discard unknown fields in a preview', async () => {
    await withApplication(variant, async (url) => {
      const input = {
        ...ORDER_INPUT,
        items: [ORDER_INPUT.items[0], ORDER_INPUT.items[0]],
        authorization: 'example-authorization-marker',
      };
      const body = await jsonResponse(
        await request(url, '/orders/preview', 'POST', input),
        200,
      );
      expect(body).toEqual({
        customerId: CUSTOMER_ID,
        items: [
          { productId: SEED[0]!.id, quantity: 2, unitPriceInCents: 25000 },
          { productId: SEED[0]!.id, quantity: 2, unitPriceInCents: 25000 },
        ],
        totalInCents: 100000,
      });
    });
  });

  it.each(['GET', 'PATCH'])(
    'should validate %s route parameters before lookup or body validation',
    async (method) => {
      await withApplication(variant, async (url) => {
        await validationError(
          await request(
            url,
            method === 'GET' ? '/orders/invalid' : '/orders/invalid/status',
            method,
            method === 'PATCH' ? { status: 'pending' } : undefined,
          ),
          [{ field: 'root', code: 'invalid_format' }],
        );
      });
    },
  );

  it.each(['GET', 'PATCH'])(
    'should map %s of a missing order to 404',
    async (method) => {
      await withApplication(variant, async (url) => {
        await applicationError(
          await request(
            url,
            method === 'GET'
              ? `/orders/${MISSING_ID}`
              : `/orders/${MISSING_ID}/status`,
            method,
            method === 'PATCH' ? { status: 'confirmed' } : undefined,
          ),
          404,
          'ORDER_NOT_FOUND',
        );
      });
    },
  );

  it.each(['pending', 'unknown', null, 1, undefined])(
    'should reject status %s',
    async (status) => {
      await withApplication(variant, async (url) => {
        await validationError(
          await request(url, `/orders/${MISSING_ID}/status`, 'PATCH', {
            status,
          }),
          [{ field: 'status', code: 'invalid_value' }],
        );
      });
    },
  );

  it.each(['confirmed', 'cancelled'] as const)(
    'should persist a %s transition and reject every later transition',
    async (status) => {
      await withApplication(
        variant,
        async (url) => {
          const order = await jsonResponse(
            await request(url, '/orders', 'POST', ORDER_INPUT),
            201,
          );
          const updated = await jsonResponse(
            await request(url, `/orders/${order.id}/status`, 'PATCH', {
              status,
              ignored: true,
            }),
            200,
          );
          expect(updated).toEqual({ ...order, status });
          expect(
            await jsonResponse(await request(url, `/orders/${order.id}`), 200),
          ).toEqual(updated);
          expect(
            await jsonResponse(await request(url, '/orders'), 200),
          ).toEqual([updated]);
          for (const target of ['confirmed', 'cancelled'])
            await applicationError(
              await request(url, `/orders/${order.id}/status`, 'PATCH', {
                status: target,
              }),
              409,
              'INVALID_ORDER_STATUS_TRANSITION',
            );
          expect(
            await jsonResponse(await request(url, `/orders/${order.id}`), 200),
          ).toEqual(updated);
        },
        FIXED_DEPENDENCIES,
      );
    },
  );

  it('should use real UUIDs and the system clock when dependencies are omitted', async () => {
    const before = Date.now();
    await withApplication(variant, async (url) => {
      const product = await jsonResponse(
        await request(url, '/products', 'POST', PRODUCT_INPUT),
        201,
      );
      expect(product.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(Date.parse(product.createdAt)).toBeGreaterThanOrEqual(before);
      expect(Date.parse(product.createdAt)).toBeLessThanOrEqual(Date.now());
    });
  });

  it('should reset the catalog and orders for a new instance', async () => {
    await withApplication(variant, async (url) => {
      await jsonResponse(
        await request(url, '/products', 'POST', PRODUCT_INPUT),
        201,
      );
      await jsonResponse(
        await request(url, '/orders', 'POST', ORDER_INPUT),
        201,
      );
    });
    await withApplication(variant, async (url) => {
      expect(
        byId(await jsonResponse(await request(url, '/products'), 200)),
      ).toEqual(byId(SEED));
      expect(await jsonResponse(await request(url, '/orders'), 200)).toEqual(
        [],
      );
    });
  });

  it('should map a domain invariant failure from an injected dependency', async () => {
    await withApplication(
      variant,
      async (url) => {
        await applicationError(
          await request(url, '/products', 'POST', PRODUCT_INPUT),
          400,
          'DOMAIN_VALIDATION_ERROR',
        );
      },
      { idGenerator: { generate: () => '' } },
    );
  });

  it('should handle an unexpected application failure through the native error pipeline', async () => {
    await withApplication(
      variant,
      async (url) => {
        const response = await request(url, '/orders', 'POST', ORDER_INPUT);
        expect(response.status).toBe(500);
        expect(response.headers.get('x-request-source')).toBe('evaluation');
      },
      {
        clock: {
          now() {
            throw new Error('Clock unavailable');
          },
        },
      },
    );
  });

  it('should retain the source header on native missing-route and malformed-JSON errors', async () => {
    await withApplication(variant, async (url) => {
      const missing = await request(url, '/route-that-does-not-exist');
      expect(missing.status).toBe(404);
      expect(missing.headers.get('x-request-source')).toBe('evaluation');
      const malformed = await fetch(`${url}/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
        signal: AbortSignal.timeout(5000),
      });
      expect(malformed.status).toBe(400);
      expect(malformed.headers.get('x-request-source')).toBe('evaluation');
      // Host-native bodies are explicitly outside the common contract.
    });
  });

  it('should release its listening socket when closed', async () => {
    const app = await loadApplication(variant)({
      host: '127.0.0.1',
      port: 0,
      logger: false,
    });
    try {
      expect((await request(app.baseUrl, '/health')).status).toBe(200);
    } finally {
      await app.close();
    }
    await expect(request(app.baseUrl, '/health')).rejects.toThrow();
  });
});

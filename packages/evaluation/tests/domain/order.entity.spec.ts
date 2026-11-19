import { describe, expect, it } from 'vitest';

import { Order } from '../../applications/elyum-fastify/src/domain/entities/order.entity';
import { DomainValidationError } from '../../applications/elyum-fastify/src/domain/errors/domain-validation.error';
import { InvalidOrderStatusTransitionError } from '../../applications/elyum-fastify/src/domain/errors/invalid-order-status-transition.error';

const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');

describe('Order', () => {
  it('should calculate its total from immutable item snapshots', () => {
    const inputItems = [
      { productId: 'product-1', quantity: 2, unitPriceInCents: 1_500 },
      { productId: 'product-2', quantity: 1, unitPriceInCents: 2_000 },
    ];

    const order = new Order({
      id: 'order-1',
      customerId: 'customer-1',
      items: inputItems,
      createdAt: CREATED_AT,
    });
    inputItems[0]!.quantity = 99;

    expect(order.totalInCents).toBe(5_000);
    expect(order.items[0]?.quantity).toBe(2);
    expect(order.status).toBe('pending');
  });

  it.each([
    { items: [], expectedMessage: 'at least one item' },
    {
      items: [{ productId: 'product-1', quantity: 0, unitPriceInCents: 100 }],
      expectedMessage: 'quantity must be a positive integer',
    },
    {
      items: [{ productId: 'product-1', quantity: 1, unitPriceInCents: 1.5 }],
      expectedMessage: 'price must be a positive integer',
    },
  ])('should reject invalid order items', ({ items, expectedMessage }) => {
    expect(
      () =>
        new Order({
          id: 'order-1',
          customerId: 'customer-1',
          items,
          createdAt: CREATED_AT,
        }),
    ).toThrowError(
      expect.objectContaining({
        message: expect.stringContaining(expectedMessage),
      }),
    );
  });

  it('should transition a pending order to a terminal status', () => {
    const order = new Order({
      id: 'order-1',
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 1, unitPriceInCents: 1_000 }],
      createdAt: CREATED_AT,
    });

    const confirmedOrder = order.transitionTo('confirmed');

    expect(order.status).toBe('pending');
    expect(confirmedOrder.status).toBe('confirmed');
    expect(confirmedOrder.id).toBe(order.id);
  });

  it('should reject transitions from a terminal status', () => {
    const order = new Order({
      id: 'order-1',
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 1, unitPriceInCents: 1_000 }],
      status: 'confirmed',
      createdAt: CREATED_AT,
    });

    expect(() => order.transitionTo('cancelled')).toThrowError(
      InvalidOrderStatusTransitionError,
    );
  });

  it('should expose domain validation errors with a stable code', () => {
    expect(
      () =>
        new Order({
          id: '',
          customerId: 'customer-1',
          items: [
            {
              productId: 'product-1',
              quantity: 1,
              unitPriceInCents: 1_000,
            },
          ],
          createdAt: CREATED_AT,
        }),
    ).toThrowError(
      expect.objectContaining<Partial<DomainValidationError>>({
        code: 'DOMAIN_VALIDATION_ERROR',
      }),
    );
  });
});

import { DomainValidationError } from '../errors/domain-validation.error';
import { InvalidOrderStatusTransitionError } from '../errors/invalid-order-status-transition.error';

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

export type OrderItem = {
  productId: string;
  quantity: number;
  unitPriceInCents: number;
};

export type OrderInput = {
  id: string;
  customerId: string;
  items: readonly OrderItem[];
  status?: OrderStatus;
  createdAt: Date;
};

export class Order {
  readonly id: string;
  readonly customerId: string;
  readonly items: ReadonlyArray<Readonly<OrderItem>>;
  readonly status: OrderStatus;
  readonly createdAt: Date;
  readonly totalInCents: number;

  constructor(input: OrderInput) {
    if (!input.id) {
      throw new DomainValidationError('Order ID is required.');
    }

    if (!input.customerId) {
      throw new DomainValidationError('Order customer ID is required.');
    }

    if (input.items.length === 0) {
      throw new DomainValidationError(
        'An order must contain at least one item.',
      );
    }

    const items = input.items.map((item) => {
      if (!item.productId) {
        throw new DomainValidationError('Order item product ID is required.');
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new DomainValidationError(
          'Order item quantity must be a positive integer.',
        );
      }

      if (
        !Number.isInteger(item.unitPriceInCents) ||
        item.unitPriceInCents <= 0
      ) {
        throw new DomainValidationError(
          'Order item price must be a positive integer expressed in cents.',
        );
      }

      return Object.freeze({ ...item });
    });

    this.id = input.id;
    this.customerId = input.customerId;
    this.items = Object.freeze(items);
    this.status = input.status ?? 'pending';
    this.createdAt = new Date(input.createdAt);
    this.totalInCents = items.reduce(
      (total, item) => total + item.quantity * item.unitPriceInCents,
      0,
    );
  }

  transitionTo(status: Exclude<OrderStatus, 'pending'>): Order {
    if (this.status !== 'pending') {
      throw new InvalidOrderStatusTransitionError(this.status, status);
    }

    return new Order({
      id: this.id,
      customerId: this.customerId,
      items: this.items,
      status,
      createdAt: this.createdAt,
    });
  }
}

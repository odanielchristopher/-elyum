import type { OrderStatus } from '../entities/order.entity';

export class InvalidOrderStatusTransitionError extends Error {
  readonly code = 'INVALID_ORDER_STATUS_TRANSITION';

  constructor(currentStatus: OrderStatus, requestedStatus: OrderStatus) {
    super(
      `Order status cannot change from '${currentStatus}' to '${requestedStatus}'.`,
    );
    this.name = 'InvalidOrderStatusTransitionError';
  }
}

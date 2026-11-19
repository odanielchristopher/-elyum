export class OrderNotFoundError extends Error {
  readonly code = 'ORDER_NOT_FOUND';

  constructor(orderId: string) {
    super(`Order '${orderId}' was not found.`);
    this.name = 'OrderNotFoundError';
  }
}

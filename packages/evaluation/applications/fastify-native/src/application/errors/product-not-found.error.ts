export class ProductNotFoundError extends Error {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(productId: string) {
    super(`Product '${productId}' was not found.`);
    this.name = 'ProductNotFoundError';
  }
}

export class ProductAlreadyExistsError extends Error {
  readonly code = 'PRODUCT_ALREADY_EXISTS';

  constructor(name: string) {
    super(`Product '${name}' already exists.`);
    this.name = 'ProductAlreadyExistsError';
  }
}

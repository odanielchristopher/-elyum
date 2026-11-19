import { DomainValidationError } from '../errors/domain-validation.error';

export type ProductInput = {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  createdAt: Date;
};

export class Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceInCents: number;
  readonly createdAt: Date;

  constructor(input: ProductInput) {
    const name = input.name.trim();
    const description = input.description.trim();

    if (!input.id) {
      throw new DomainValidationError('Product ID is required.');
    }

    if (!name) {
      throw new DomainValidationError('Product name is required.');
    }

    if (!Number.isInteger(input.priceInCents) || input.priceInCents <= 0) {
      throw new DomainValidationError(
        'Product price must be a positive integer expressed in cents.',
      );
    }

    this.id = input.id;
    this.name = name;
    this.description = description;
    this.priceInCents = input.priceInCents;
    this.createdAt = new Date(input.createdAt);
  }
}

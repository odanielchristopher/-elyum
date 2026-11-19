import type { ElyumExpressErrorHandler } from '@elyum/express';
import { ValidationError } from '@elyum/validation';

import { OrderNotFoundError } from '../application/errors/order-not-found.error';
import { ProductAlreadyExistsError } from '../application/errors/product-already-exists.error';
import { ProductNotFoundError } from '../application/errors/product-not-found.error';
import { DomainValidationError } from '../domain/errors/domain-validation.error';
import { InvalidOrderStatusTransitionError } from '../domain/errors/invalid-order-status-transition.error';

export const handleApplicationError: ElyumExpressErrorHandler = (
  error,
  { response },
) => {
  if (error instanceof ValidationError) {
    response.status(400).json({
      code: 'VALIDATION_ERROR',
      message: error.message,
      errors: error.errors.map(({ field, code, message }) => ({
        field,
        code,
        message,
      })),
    });
    return;
  }

  if (error instanceof DomainValidationError) {
    response.status(400).json({ code: error.code, message: error.message });
    return;
  }

  if (
    error instanceof OrderNotFoundError ||
    error instanceof ProductNotFoundError
  ) {
    response.status(404).json({ code: error.code, message: error.message });
    return;
  }

  if (
    error instanceof ProductAlreadyExistsError ||
    error instanceof InvalidOrderStatusTransitionError
  ) {
    response.status(409).json({ code: error.code, message: error.message });
    return;
  }
};

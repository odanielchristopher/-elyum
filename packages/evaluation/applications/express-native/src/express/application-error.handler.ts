import type { ErrorRequestHandler } from 'express';
import { z } from 'zod';

import { OrderNotFoundError } from '../application/errors/order-not-found.error';
import { ProductAlreadyExistsError } from '../application/errors/product-already-exists.error';
import { ProductNotFoundError } from '../application/errors/product-not-found.error';
import { DomainValidationError } from '../domain/errors/domain-validation.error';
import { InvalidOrderStatusTransitionError } from '../domain/errors/invalid-order-status-transition.error';

export const handleApplicationError: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  if (error instanceof z.ZodError) {
    const errors = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      code: issue.code,
      message: issue.message,
    }));
    return response.status(400).json({
      code: 'VALIDATION_ERROR',
      message:
        errors.length === 1
          ? `Validation failed: ${errors[0]?.message}`
          : `Validation failed with ${errors.length} errors`,
      errors,
    });
  }

  if (error instanceof DomainValidationError) {
    void response
      .status(400)
      .json({ code: error.code, message: error.message });
    return;
  }

  if (
    error instanceof OrderNotFoundError ||
    error instanceof ProductNotFoundError
  ) {
    void response
      .status(404)
      .json({ code: error.code, message: error.message });
    return;
  }

  if (
    error instanceof ProductAlreadyExistsError ||
    error instanceof InvalidOrderStatusTransitionError
  ) {
    void response
      .status(409)
      .json({ code: error.code, message: error.message });
    return;
  }

  next(error);
};

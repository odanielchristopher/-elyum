import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { OrderNotFoundError } from '../application/errors/order-not-found.error';
import { ProductAlreadyExistsError } from '../application/errors/product-already-exists.error';
import { ProductNotFoundError } from '../application/errors/product-not-found.error';
import { DomainValidationError } from '../domain/errors/domain-validation.error';
import { InvalidOrderStatusTransitionError } from '../domain/errors/invalid-order-status-transition.error';

export function handleApplicationError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof z.ZodError) {
    const errors = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      code: issue.code,
      message: issue.message,
    }));
    return reply.code(400).send({
      code: 'VALIDATION_ERROR',
      message:
        errors.length === 1
          ? `Validation failed: ${errors[0]?.message}`
          : `Validation failed with ${errors.length} errors`,
      errors,
    });
  }

  if (error instanceof DomainValidationError) {
    void reply.code(400).send({ code: error.code, message: error.message });
    return;
  }

  if (
    error instanceof OrderNotFoundError ||
    error instanceof ProductNotFoundError
  ) {
    void reply.code(404).send({ code: error.code, message: error.message });
    return;
  }

  if (
    error instanceof ProductAlreadyExistsError ||
    error instanceof InvalidOrderStatusTransitionError
  ) {
    void reply.code(409).send({ code: error.code, message: error.message });
    return;
  }

  request.log.error({ err: error }, 'Unhandled controller execution error');
  throw error;
}

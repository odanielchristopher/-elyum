import type { ElyumFastifyErrorHandler } from '@elyum/fastify';
import { ValidationError } from '@elyum/validation';

import { OrderNotFoundError } from '../../application/errors/order-not-found.error';
import { ProductAlreadyExistsError } from '../../application/errors/product-already-exists.error';
import { ProductNotFoundError } from '../../application/errors/product-not-found.error';
import { DomainValidationError } from '../../domain/errors/domain-validation.error';
import { InvalidOrderStatusTransitionError } from '../../domain/errors/invalid-order-status-transition.error';

export const handleApplicationError: ElyumFastifyErrorHandler = (
  error,
  { reply, request },
) => {
  if (error instanceof ValidationError) {
    void reply.code(400).send({
      code: 'VALIDATION_ERROR',
      message: error.message,
      errors: error.errors,
    });
    return;
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
};

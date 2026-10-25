import { createParamDecorator } from '@elyum/http';
import type { NextFunction, Request } from 'express';

import { ExpressAdapterConfigurationError } from '../errors/express-adapter-configuration.error';

// Captured by each resolved parameter before a downstream controller can replace it.
// Weak keys avoid retaining completed requests or deleting an overlapping execution.
const continuations = new WeakMap<Request, NextFunction>();

export function bindContinuation(request: Request, next: NextFunction): void {
  continuations.set(request, next);
}

/** Injects tracked native Express continuation. Call within the awaited handler. */
export function Next(): ParameterDecorator {
  return createParamDecorator<undefined, NextFunction, Request>({
    source: 'request',
    factory: (request) => {
      const next = continuations.get(request);
      if (!next) {
        throw new ExpressAdapterConfigurationError(
          '@Next() was executed outside an Elyum Express controller.',
          'Register this controller with elyum(appOrRouter).controller(...handlers).',
        );
      }
      return next;
    },
  })();
}

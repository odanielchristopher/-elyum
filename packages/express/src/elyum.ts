import { json } from 'express';

import { ExpressControllerAdapter } from './adapter/express-controller.adapter';
import { ExpressAdapterConfigurationError } from './errors/express-adapter-configuration.error';
import type {
  ElyumExpress,
  ElyumExpressOptions,
  ElyumExpressTarget,
} from './types/express-adapter.type';

const installations = new WeakMap<
  ElyumExpressTarget,
  ExpressControllerAdapter
>();

/** Enrich the existing native Express app/Router, preserving identity and lifecycle. */
export function elyum<T extends ElyumExpressTarget>(
  target: T,
  options?: ElyumExpressOptions,
): ElyumExpress<T> {
  if (installations.has(target)) {
    if (options !== undefined) {
      throw new ExpressAdapterConfigurationError(
        'the target is already installed and new options were provided.',
        'Configure it once; call elyum(target) without options to reuse it.',
      );
    }
    return target as ElyumExpress<T>;
  }
  if ('controller' in target || 'elyum' in target) {
    throw new ExpressAdapterConfigurationError(
      'the target already has a controller or elyum property.',
      'Use a target without conflicting extensions; existing properties are never overwritten.',
    );
  }
  if (!Object.isExtensible(target)) {
    throw new ExpressAdapterConfigurationError(
      'the target is not extensible.',
      'Install Elyum before freezing the native target.',
    );
  }
  const adapter = new ExpressControllerAdapter(target, options ?? {});
  const parser = options?.json === undefined ? undefined : json(options.json);
  if (parser) {
    target.use(parser);
  }
  Object.defineProperties(target, {
    elyum: { value: adapter.runtime, enumerable: false },
    controller: {
      value: (
        ...handlers: Parameters<
          ExpressControllerAdapter['registerController']
        >[0]
      ) => {
        adapter.registerController(handlers);
        return target;
      },
      enumerable: false,
    },
  });
  installations.set(target, adapter);
  return target as ElyumExpress<T>;
}

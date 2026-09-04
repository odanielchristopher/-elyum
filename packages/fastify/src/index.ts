import './fastify.augmentation';

export { FastifyAdapterConfigurationError } from './errors';
export { elyum } from './plugin/elyum.plugin';
export type {
  ElyumFastifyErrorContext,
  ElyumFastifyErrorHandler,
  ElyumFastifyOptions,
  ElyumFastifyRouteOptions,
  ElyumFastifyRuntime,
  FastifyControllerRegistrar,
} from './types';

export { elyum as default } from './plugin/elyum.plugin';

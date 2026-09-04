import 'fastify';

import { ElyumFastifyRuntime, FastifyControllerRegistrar } from './types';

declare module 'fastify' {
  interface FastifyInstance {
    controller: FastifyControllerRegistrar;
    elyum: ElyumFastifyRuntime;
  }
}

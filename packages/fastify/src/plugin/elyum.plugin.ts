import { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { FastifyControllerAdapter } from '../adapter/fastify-controller.adapter';
import { ElyumFastifyOptions } from '../types';

const plugin = fastifyPlugin<ElyumFastifyOptions>(
  async (fastify, options) => {
    const adapter = new FastifyControllerAdapter(fastify, options);

    fastify.decorate('elyum', adapter.runtime);
    fastify.decorate('controller', adapter.registerController.bind(adapter));
  },
  {
    name: '@elyum/fastify',
    fastify: '5.x',
  },
);

export function elyum(): FastifyPluginCallback<ElyumFastifyOptions> {
  return plugin;
}

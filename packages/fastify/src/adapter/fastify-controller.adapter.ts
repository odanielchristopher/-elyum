import { Constructor, DependencyRegister, ElyumFactory } from '@elyum/core';
import {
  CompiledController,
  ControllerCompiler,
  executeController,
} from '@elyum/http';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { FastifyAdapterConfigurationError } from '../errors';
import {
  ElyumFastifyOptions,
  ElyumFastifyRouteOptions,
  ElyumFastifyRuntime,
} from '../types';

export class FastifyControllerAdapter {
  readonly runtime: ElyumFastifyRuntime;

  private readonly compiler: ControllerCompiler;
  private readonly dependencyRegister: DependencyRegister | undefined;
  private readonly onError: ElyumFastifyOptions['onError'];

  constructor(
    private readonly fastify: FastifyInstance,
    options: ElyumFastifyOptions,
  ) {
    if (options.container && options.resolveController) {
      throw new FastifyAdapterConfigurationError(
        'both container and resolveController were provided.',
        'Choose container for Elyum DI or resolveController for an application-owned factory, but not both.',
      );
    }

    if (
      options.resolveController &&
      options.autoRegisterDependencies !== undefined
    ) {
      throw new FastifyAdapterConfigurationError(
        'autoRegisterDependencies was provided with resolveController.',
        'Remove autoRegisterDependencies and let the application-owned resolver manage its dependency graph.',
      );
    }

    this.compiler = new ControllerCompiler(
      options.controllerMethod === undefined
        ? {}
        : { controllerMethod: options.controllerMethod },
    );
    this.onError = options.onError;
    this.runtime = this.createRuntime(options);
    this.dependencyRegister =
      options.autoRegisterDependencies && this.runtime.container
        ? new DependencyRegister(this.runtime.container)
        : undefined;
  }

  registerController(
    controllerClass: Constructor<object>,
    options: ElyumFastifyRouteOptions = {},
  ): FastifyInstance {
    const compiled = this.compiler.compile(controllerClass);
    this.dependencyRegister?.registerDependencies(controllerClass, {
      allowedScopes: ['singleton', 'transient'],
    });
    this.registerControllerProvider(controllerClass);

    this.fastify.route({
      ...options,
      method: compiled.method,
      url: compiled.path,
      handler: (request, reply) => this.handleRequest(compiled, request, reply),
    });

    return this.fastify;
  }

  private createRuntime(options: ElyumFastifyOptions): ElyumFastifyRuntime {
    if (options.resolveController) {
      return Object.freeze({
        container: undefined,
        resolveController: options.resolveController,
      });
    }

    const container = options.container ?? ElyumFactory.createRoot();

    return Object.freeze({
      container,
      resolveController: <TController extends object>(
        controllerClass: Constructor<TController>,
      ) => container.resolve(controllerClass),
    });
  }

  private registerControllerProvider(
    controllerClass: Constructor<object>,
  ): void {
    const container = this.runtime.container;

    if (container && !container.getProvider(controllerClass)) {
      container.register({
        token: controllerClass,
        useClass: controllerClass,
        scope: 'transient',
      });
    }
  }

  private async handleRequest(
    controller: CompiledController,
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<unknown> {
    try {
      const result = await executeController(controller, {
        request: {
          body: request.body,
          query: request.query,
          params: request.params,
          headers: request.headers,
          method: request.method,
          url: request.url,
          path: request.url.split('?')[0] ?? request.url,
          ip: request.ip,
          protocol: request.protocol,
          hostname: request.hostname,
          raw: request,
        },
        response: reply,
        resolveController: this.runtime.resolveController,
        isResponseSent: (candidate) => candidate.sent,
      });

      if (result.kind === 'manual') return undefined;

      reply.code(result.statusCode);
      if (result.headers) {
        for (const [name, value] of Object.entries(result.headers)) {
          reply.header(name, Array.isArray(value) ? [...value] : value);
        }
      }

      void reply.send(result.body);
      return undefined;
    } catch (error) {
      if (!this.onError) throw error;

      await this.onError(error, { controller, request, reply });
      if (reply.sent) return undefined;

      throw error;
    }
  }
}

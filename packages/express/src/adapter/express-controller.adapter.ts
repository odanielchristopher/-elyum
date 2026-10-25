import {
  type Constructor,
  DependencyRegister,
  ElyumFactory,
} from '@elyum/core';
import {
  type CompiledController,
  CONTROLLER_ROUTES_METADATA_KEY,
  ControllerCompiler,
  executeController,
  HttpException,
} from '@elyum/http';
import { ValidationError } from '@elyum/validation';
import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';

import { errorControllers } from '../context/express-error.context';
import { bindContinuation } from '../decorators/next.decorator';
import { ExpressAdapterConfigurationError } from '../errors/express-adapter-configuration.error';
import type {
  ExpressControllerHandler,
  ElyumExpressOptions,
  ElyumExpressRuntime,
  ElyumExpressTarget,
} from '../types/express-adapter.type';

export class ExpressControllerAdapter {
  readonly runtime: ElyumExpressRuntime;
  private readonly compiler: ControllerCompiler;
  private readonly dependencyRegister: DependencyRegister | undefined;
  private readonly onError: ElyumExpressOptions['onError'];

  constructor(
    private readonly target: ElyumExpressTarget,
    options: ElyumExpressOptions,
  ) {
    if (options.container && options.resolveController) {
      throw new ExpressAdapterConfigurationError(
        'both container and resolveController were provided.',
        'Choose container or resolveController, but not both.',
      );
    }
    if (
      options.resolveController &&
      options.autoRegisterDependencies !== undefined
    ) {
      throw new ExpressAdapterConfigurationError(
        'autoRegisterDependencies was provided with resolveController.',
        'Let the external resolver own its dependency graph.',
      );
    }
    this.onError = options.onError;
    this.compiler = new ControllerCompiler(
      options.controllerMethod === undefined
        ? {}
        : { controllerMethod: options.controllerMethod },
    );
    const container = options.resolveController
      ? undefined
      : (options.container ?? ElyumFactory.createRoot());
    const resolveController =
      options.resolveController ??
      (<T extends object>(controller: Constructor<T>) =>
        container!.resolve(controller));
    this.runtime = Object.freeze({
      container,
      resolveController,
      errorHandler: () => this.errorHandler(),
    });
    this.dependencyRegister =
      options.autoRegisterDependencies && container
        ? new DependencyRegister(container)
        : undefined;
  }

  registerController(handlers: ExpressControllerHandler[]): void {
    const controllers = handlers.filter(isController);
    if (controllers.length !== 1) {
      throw new ExpressAdapterConfigurationError(
        `controller() received ${controllers.length} metadata-bearing controllers.`,
        'Provide exactly one decorated controller among native middleware.',
      );
    }
    if (handlers.some((handler) => typeof handler !== 'function')) {
      throw new ExpressAdapterConfigurationError(
        'controller() received a non-function handler.',
        'Use a flat sequence of native middleware and one decorated controller.',
      );
    }
    const controllerClass = controllers[0]!;
    const compiled = this.compiler.compile(controllerClass);
    this.dependencyRegister?.registerDependencies(controllerClass, {
      allowedScopes: ['singleton', 'transient'],
    });
    const container = this.runtime.container;
    if (container && !container.getProvider(controllerClass)) {
      container.register({
        token: controllerClass,
        useClass: controllerClass,
        scope: 'transient',
      });
    }
    const handler: RequestHandler = (request, response, next) =>
      this.handleRequest(compiled, request, response, next);
    const nativeHandlers = handlers.map((candidate) =>
      candidate === controllerClass ? handler : candidate,
    ) as (RequestHandler | ErrorRequestHandler)[];
    const route = this.target.route(compiled.path);
    switch (compiled.method) {
      case 'GET':
        route.get(...nativeHandlers);
        break;
      case 'POST':
        route.post(...nativeHandlers);
        break;
      case 'PUT':
        route.put(...nativeHandlers);
        break;
      case 'PATCH':
        route.patch(...nativeHandlers);
        break;
      case 'DELETE':
        route.delete(...nativeHandlers);
        break;
      case 'HEAD':
        route.head(...nativeHandlers);
        break;
      case 'OPTIONS':
        route.options(...nativeHandlers);
        break;
    }
  }

  private async handleRequest(
    controller: CompiledController,
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    let delegated = false;
    const continuation: NextFunction = (error?: unknown) => {
      delegated = true;
      if (error && error !== 'route' && error !== 'router') {
        errorControllers.set(request, { error, controller });
      }
      next(error);
    };
    bindContinuation(request, continuation);
    try {
      const result = await executeController(controller, {
        request: {
          body: request.body,
          query: request.query,
          params: request.params,
          headers: request.headers,
          method: request.method,
          url: request.originalUrl,
          path: request.path,
          ...(request.ip === undefined ? {} : { ip: request.ip }),
          protocol: request.protocol,
          hostname: request.hostname,
          raw: request,
        },
        response,
        resolveController: this.runtime.resolveController,
        isResponseSent,
        isExecutionDelegated: () => delegated,
      });
      if (result.kind === 'manual') {
        return;
      }
      response.status(result.statusCode);
      if (result.headers) {
        for (const [name, value] of Object.entries(result.headers)) {
          response.setHeader(name, Array.isArray(value) ? [...value] : value);
        }
      }
      if (result.body === undefined) {
        response.end();
      } else if (
        typeof result.body === 'object' &&
        result.body !== null &&
        !Buffer.isBuffer(result.body)
      ) {
        response.json(result.body);
      } else {
        response.send(result.body);
      }
    } catch (error) {
      errorControllers.set(request, { error, controller });
      next(error);
    }
  }

  private errorHandler(): ErrorRequestHandler {
    return async (error: unknown, request, response, next) => {
      if (isResponseSent(response)) {
        next(error);
        return;
      }
      if (this.onError) {
        const origin = errorControllers.get(request);
        try {
          await this.onError(error, {
            request,
            response,
            ...(origin && Object.is(origin.error, error)
              ? { controller: origin.controller }
              : {}),
          });
        } catch (callbackError) {
          next(callbackError);
          return;
        }
        if (!isResponseSent(response)) {
          next(error);
        }
        return;
      }
      if (error instanceof ValidationError) {
        response.status(400).json({
          code: 'VALIDATION_ERROR',
          message: error.message,
          errors: error.errors,
        });
      } else if (error instanceof HttpException) {
        response.status(error.statusCode).json(error.toJSON());
      } else {
        response.status(500).json({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    };
  }
}

function isController(
  handler: ExpressControllerHandler,
): handler is Constructor<object> {
  return (
    typeof handler === 'function' &&
    Reflect.hasOwnMetadata(CONTROLLER_ROUTES_METADATA_KEY, handler)
  );
}

function isResponseSent(response: Response): boolean {
  return response.headersSent || response.writableEnded;
}

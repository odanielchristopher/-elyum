import { Constructor } from '@elyum/core';

import {
  CONTROLLER_ROUTES_METADATA_KEY,
  ROUTE_PARAMS_METADATA_KEY,
} from '../constants/metadata-keys.constants';
import { ControllerCompilationError } from '../errors';
import {
  CompiledController,
  CompileControllerOptions,
  ControllerRouteMetadata,
  isHttpMethod,
  ParamMetadata,
  ParamType,
} from '../types';

const CONVENTIONAL_HANDLER_NAMES = ['execute', 'handler'] as const;
const PARAM_TYPES: readonly ParamType[] = [
  'body',
  'query',
  'param',
  'headers',
  'request',
  'response',
  'custom',
];

export function compileController<TController extends object>(
  controllerClass: Constructor<TController>,
  options: CompileControllerOptions = {},
): CompiledController<TController> {
  const controllerName = controllerClass.name || '[Anonymous Controller]';
  const route = readRoute(controllerClass, controllerName);
  const handlerName = resolveHandlerName(
    controllerClass,
    controllerName,
    route,
    options,
  );
  const params = readParams(controllerClass, controllerName, handlerName);

  return Object.freeze({
    controllerClass,
    defaultStatusCode: route.method === 'POST' ? 201 : 200,
    handlerName,
    method: route.method,
    params,
    path: route.path,
  });
}

function readRoute<TController extends object>(
  controllerClass: Constructor<TController>,
  controllerName: string,
): ControllerRouteMetadata {
  const routes: ControllerRouteMetadata[] =
    Reflect.getOwnMetadata(CONTROLLER_ROUTES_METADATA_KEY, controllerClass) ??
    [];

  if (routes.length === 0) {
    throw new ControllerCompilationError(
      controllerName,
      'route_not_found',
      'no route decorator was found.',
      'Add @Route(), @Get(), @Post(), or another HTTP method decorator to the class.',
    );
  }

  if (routes.length > 1) {
    throw new ControllerCompilationError(
      controllerName,
      'multiple_routes',
      `${routes.length} route decorators were found, but one controller must represent exactly one route.`,
      'Keep only one route decorator on the class.',
    );
  }

  const route = routes[0];

  if (
    !route ||
    typeof route.method !== 'string' ||
    route.method !== route.method.toUpperCase() ||
    !isHttpMethod(route.method) ||
    typeof route.path !== 'string' ||
    route.path.length === 0
  ) {
    throw new ControllerCompilationError(
      controllerName,
      'invalid_route',
      'the route method or path is invalid.',
      'Use a supported uppercase HTTP method and a non-empty path.',
    );
  }

  if (route.handler !== undefined && !isValidMethodName(route.handler)) {
    throw new ControllerCompilationError(
      controllerName,
      'invalid_handler',
      'the route handler override is empty or invalid.',
      'Provide a non-empty handler method name or remove the handler option.',
    );
  }

  return route;
}

function resolveHandlerName<TController extends object>(
  controllerClass: Constructor<TController>,
  controllerName: string,
  route: ControllerRouteMetadata,
  options: CompileControllerOptions,
): string {
  if (
    options.controllerMethod !== undefined &&
    !isValidMethodName(options.controllerMethod)
  ) {
    throw new ControllerCompilationError(
      controllerName,
      'invalid_handler',
      'the configured controllerMethod is empty or invalid.',
      'Configure controllerMethod with a non-empty method name.',
    );
  }

  const configuredHandler = route.handler ?? options.controllerMethod;

  if (configuredHandler) {
    assertHandlerExists(controllerClass, controllerName, configuredHandler);
    return configuredHandler;
  }

  const conventionalHandlers = CONVENTIONAL_HANDLER_NAMES.filter(
    (methodName) =>
      typeof (controllerClass.prototype as Record<string, unknown>)[
        methodName
      ] === 'function',
  );

  if (conventionalHandlers.length === 0) {
    throw new ControllerCompilationError(
      controllerName,
      'handler_not_found',
      "neither an 'execute' nor a 'handler' method was found.",
      'Add one conventional method or configure controllerMethod explicitly.',
    );
  }

  if (conventionalHandlers.length > 1) {
    throw new ControllerCompilationError(
      controllerName,
      'ambiguous_handler',
      "both 'execute' and 'handler' methods were found.",
      'Remove one method or configure the intended controllerMethod explicitly.',
    );
  }

  return conventionalHandlers[0] as string;
}

function assertHandlerExists<TController extends object>(
  controllerClass: Constructor<TController>,
  controllerName: string,
  handlerName: string,
): void {
  if (
    typeof (controllerClass.prototype as Record<string, unknown>)[
      handlerName
    ] !== 'function'
  ) {
    throw new ControllerCompilationError(
      controllerName,
      'handler_not_found',
      `the configured handler '${handlerName}' was not found.`,
      `Add a '${handlerName}' method or configure a method that exists on the controller.`,
    );
  }
}

function readParams<TController extends object>(
  controllerClass: Constructor<TController>,
  controllerName: string,
  handlerName: string,
): readonly Readonly<ParamMetadata<unknown>>[] {
  const params: ParamMetadata<unknown>[] =
    Reflect.getMetadata(
      ROUTE_PARAMS_METADATA_KEY,
      controllerClass.prototype,
      handlerName,
    ) ?? [];
  const indexes = new Set<number>();

  for (const param of params) {
    if (
      !param ||
      !Number.isInteger(param.index) ||
      param.index < 0 ||
      !PARAM_TYPES.includes(param.type) ||
      (param.factory !== undefined && typeof param.factory !== 'function')
    ) {
      throw new ControllerCompilationError(
        controllerName,
        'invalid_param_metadata',
        `parameter metadata on '${handlerName}' is invalid.`,
        'Recreate the parameter decorator with a valid index, source, and factory.',
      );
    }

    if (indexes.has(param.index)) {
      throw new ControllerCompilationError(
        controllerName,
        'duplicate_param_index',
        `parameter index ${param.index} is declared more than once on '${handlerName}'.`,
        'Keep exactly one parameter decorator for each handler parameter.',
      );
    }

    indexes.add(param.index);
  }

  return Object.freeze(
    [...params]
      .sort((left, right) => left.index - right.index)
      .map((param) => Object.freeze({ ...param })),
  );
}

function isValidMethodName(value: string): boolean {
  return value.trim().length > 0;
}

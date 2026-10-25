import { HttpExecutionContext } from '../context';
import { isHttpResult } from '../contracts';
import { ControllerExecutionError } from '../errors';
import {
  CompiledController,
  ControllerExecutionResult,
  ExecuteControllerOptions,
  ParamMetadata,
} from '../types';

export async function executeController<
  TController extends object,
  TBody = unknown,
  TQuery = Record<string, unknown>,
  TParams = Record<string, string>,
  THeaders = Record<string, string>,
  TRequest = unknown,
  TResponse = unknown,
>(
  controller: CompiledController<TController>,
  options: ExecuteControllerOptions<
    TController,
    TBody,
    TQuery,
    TParams,
    THeaders,
    TRequest,
    TResponse
  >,
): Promise<ControllerExecutionResult> {
  return HttpExecutionContext.run(
    {
      request: options.request,
      response: options.response,
      route: controller,
    },
    async () => {
      const instance = await options.resolveController(
        controller.controllerClass,
      );

      if (
        (typeof instance !== 'object' && typeof instance !== 'function') ||
        instance === null
      ) {
        throw ControllerExecutionError.fromController(
          controller,
          'invalid_controller_instance',
          'the configured resolver returned a non-object value.',
          'Return an instance of the requested controller class from resolveController.',
        );
      }

      const handler = (instance as Record<string, unknown>)[
        controller.handlerName
      ];

      if (typeof handler !== 'function') {
        throw ControllerExecutionError.fromController(
          controller,
          'handler_not_found',
          `the resolved instance does not provide the compiled handler '${controller.handlerName}'.`,
          `Return a compatible controller instance with a '${controller.handlerName}' method.`,
        );
      }

      const args = await resolveArguments(controller, options);
      const value: unknown = await handler.apply(instance, args);
      if (options.isExecutionDelegated?.()) {
        if (value !== undefined) {
          throw ControllerExecutionError.fromController(
            controller,
            'response_conflict',
            'the handler delegated execution and also returned a response value.',
            'Either delegate execution and return void, or return a value without delegating.',
          );
        }

        return Object.freeze({ kind: 'manual' });
      }
      const responseSent = options.isResponseSent(options.response);

      if (responseSent) {
        if (value !== undefined) {
          throw ControllerExecutionError.fromController(
            controller,
            'response_conflict',
            'the native response was sent and the handler also returned a value.',
            'Either send the native response and return void, or return a value without sending the response.',
          );
        }

        return Object.freeze({ kind: 'manual' });
      }

      if (isHttpResult(value)) {
        return Object.freeze({
          kind: 'automatic',
          statusCode: value.statusCode,
          headers: value.headers,
          body: value.body,
        });
      }

      return Object.freeze({
        kind: 'automatic',
        statusCode: controller.defaultStatusCode,
        body: value,
      });
    },
  );
}

async function resolveArguments<
  TController extends object,
  TBody,
  TQuery,
  TParams,
  THeaders,
  TRequest,
  TResponse,
>(
  controller: CompiledController<TController>,
  options: ExecuteControllerOptions<
    TController,
    TBody,
    TQuery,
    TParams,
    THeaders,
    TRequest,
    TResponse
  >,
): Promise<unknown[]> {
  const highestIndex = controller.params.at(-1)?.index ?? -1;
  const args = Array.from({ length: highestIndex + 1 });

  for (const param of controller.params) {
    const input = selectParamInput(param, options);
    const factoryValue = param.factory
      ? await param.factory(input, HttpExecutionContext, param.index)
      : selectKey(input, param.key);

    args[param.index] = param.validator
      ? await param.validator.parse(factoryValue)
      : factoryValue;
  }

  return args;
}

function selectParamInput<
  TBody,
  TQuery,
  TParams,
  THeaders,
  TRequest,
  TResponse,
>(
  param: Readonly<ParamMetadata<unknown>>,
  options: Pick<
    ExecuteControllerOptions<
      object,
      TBody,
      TQuery,
      TParams,
      THeaders,
      TRequest,
      TResponse
    >,
    'request' | 'response'
  >,
): unknown {
  switch (param.type) {
    case 'body':
      return options.request.body;
    case 'query':
      return options.request.query;
    case 'param':
      return options.request.params;
    case 'headers':
      return options.request.headers;
    case 'request':
      return options.request.raw;
    case 'response':
      return options.response;
    case 'custom':
      return undefined;
  }
}

function selectKey(input: unknown, key: unknown): unknown {
  if (key === undefined) return input;
  if (typeof key !== 'string' || typeof input !== 'object' || input === null) {
    return undefined;
  }

  return (input as Record<string, unknown>)[key];
}

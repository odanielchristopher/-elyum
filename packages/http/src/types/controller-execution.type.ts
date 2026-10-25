import { Constructor } from '@elyum/core';

import { HttpHeaders, HttpRequest } from '../contracts';

export type ControllerResolver<TController extends object = object> = (
  controllerClass: Constructor<TController>,
) => TController | Promise<TController>;

export interface ExecuteControllerOptions<
  TController extends object = object,
  TBody = unknown,
  TQuery = Record<string, unknown>,
  TParams = Record<string, string>,
  THeaders = Record<string, string>,
  TRequest = unknown,
  TResponse = unknown,
> {
  readonly request: HttpRequest<TBody, TQuery, TParams, THeaders, TRequest>;
  readonly response: TResponse;
  readonly resolveController: ControllerResolver<TController>;
  readonly isResponseSent: (response: TResponse) => boolean;
  /** Reports explicit delegation to a native pipeline, without sending a response. */
  readonly isExecutionDelegated?: () => boolean;
}

export interface AutomaticControllerExecutionResult<TBody = unknown> {
  readonly kind: 'automatic';
  readonly statusCode: number;
  readonly headers?: HttpHeaders;
  readonly body: TBody | undefined;
}

export interface ManualControllerExecutionResult {
  readonly kind: 'manual';
}

export type ControllerExecutionResult<TBody = unknown> =
  | AutomaticControllerExecutionResult<TBody>
  | ManualControllerExecutionResult;

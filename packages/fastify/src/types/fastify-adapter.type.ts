import { Constructor, ContainerDI } from '@elyum/core';
import { CompiledController, ControllerResolver } from '@elyum/http';
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  RouteGenericInterface,
  RouteShorthandOptions,
} from 'fastify';

export interface ElyumFastifyErrorContext {
  readonly controller: CompiledController;
  readonly request: FastifyRequest;
  readonly reply: FastifyReply;
}

export type ElyumFastifyErrorHandler = (
  error: unknown,
  context: ElyumFastifyErrorContext,
) => void | Promise<void>;

interface ElyumFastifyCommonOptions {
  readonly controllerMethod?: string;
  readonly onError?: ElyumFastifyErrorHandler;
}

export type ElyumFastifyOptions = ElyumFastifyCommonOptions &
  (
    | {
        readonly container?: ContainerDI;
        readonly resolveController?: never;
      }
    | {
        readonly container?: never;
        readonly resolveController: ControllerResolver;
      }
  );

export interface ElyumFastifyRuntime {
  readonly container: ContainerDI | undefined;
  readonly resolveController: ControllerResolver;
}

export type ElyumFastifyRouteOptions<
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
> = RouteShorthandOptions<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  RouteGeneric
>;

export interface FastifyControllerRegistrar {
  <RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    controllerClass: Constructor<object>,
    options?: ElyumFastifyRouteOptions<RouteGeneric>,
  ): FastifyInstance;
}

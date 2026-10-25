import type { Constructor, ContainerDI } from '@elyum/core';
import type { CompiledController, ControllerResolver } from '@elyum/http';
import type {
  Application,
  ErrorRequestHandler,
  Request,
  RequestHandler,
  Response,
  Router,
  json,
} from 'express';

export interface ElyumExpressErrorContext {
  readonly controller?: CompiledController;
  readonly request: Request;
  readonly response: Response;
}

export type ElyumExpressErrorHandler = (
  error: unknown,
  context: ElyumExpressErrorContext,
) => void | Promise<void>;

interface ElyumExpressCommonOptions {
  readonly controllerMethod?: string;
  readonly json?: Parameters<typeof json>[0];
  readonly onError?: ElyumExpressErrorHandler;
}

export type ElyumExpressOptions = ElyumExpressCommonOptions &
  (
    | {
        readonly container?: ContainerDI;
        readonly autoRegisterDependencies?: boolean;
        readonly resolveController?: never;
      }
    | {
        readonly container?: never;
        readonly autoRegisterDependencies?: never;
        readonly resolveController: ControllerResolver;
      }
  );

export interface ElyumExpressRuntime {
  readonly container: ContainerDI | undefined;
  readonly resolveController: ControllerResolver;
  /** Install explicitly after the native routes/mounts whose errors it handles. */
  errorHandler(): ErrorRequestHandler;
}

export type ExpressControllerHandler =
  | Constructor<object>
  | RequestHandler
  | ErrorRequestHandler;

export interface ElyumExpressExtensions {
  readonly elyum: ElyumExpressRuntime;
  /** Register exactly one controller among native middleware, in declaration order. */
  controller(...handlers: (Constructor<object> | RequestHandler)[]): this;
  controller(...handlers: ExpressControllerHandler[]): this;
}

export type ElyumExpressTarget = Application | Router;
export type ElyumExpress<T extends ElyumExpressTarget> = T &
  ElyumExpressExtensions;

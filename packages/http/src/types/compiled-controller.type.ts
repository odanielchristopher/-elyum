import { Constructor } from '@elyum/core';

import { HttpMethod } from './http-method.type';
import { ParamMetadata } from './route-metadata.type';

export interface CompiledController<TController extends object = object> {
  readonly controllerClass: Constructor<TController>;
  readonly defaultStatusCode: number;
  readonly handlerName: string;
  readonly method: HttpMethod;
  readonly params: readonly Readonly<ParamMetadata<unknown>>[];
  readonly path: string;
}

export interface CompileControllerOptions {
  controllerMethod?: string;
}

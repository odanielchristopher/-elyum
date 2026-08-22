import { ExecutionContext } from '@elyum/core';

import { HttpRequest } from '../contracts';
import { CompiledController } from '../types';

/**
 * Store do execution context HTTP
 *
 * Contém dados específicos de uma requisição HTTP
 */
export interface HttpExecutionContextStore<
  TRequest = unknown,
  TResponse = unknown,
> {
  /** Normalized request data and the native request. */
  request: HttpRequest<unknown, unknown, unknown, unknown, TRequest>;

  /** Native framework response/reply. */
  response: TResponse;

  /** Controller compilado sendo executado */
  route: CompiledController;

  /** Custom request-local data. */
  [key: string]: any;
}

/**
 * Execution context específico para HTTP
 *
 * Estende ExecutionContext do core com métodos convenientes
 * para acessar request, response, etc
 *
 * @example
 * // Dentro de um handler
 * @Get()
 * getUser() {
 *   const userId = HttpExecutionContext.get('userId');
 *   return this.userService.findById(userId);
 * }
 */
export class HttpExecutionContext {
  /**
   * Executa handler dentro de HTTP context
   */
  static run<R>(
    store: HttpExecutionContextStore,
    fn: () => R | Promise<R>,
  ): R | Promise<R> {
    return ExecutionContext.run(store, fn);
  }

  /**
   * Obtém store completo
   */
  static getStore(): HttpExecutionContextStore {
    return ExecutionContext.getStore<HttpExecutionContextStore>();
  }

  /** Gets the native framework request. */
  static getRequest<TRequest = unknown>(): TRequest {
    return this.getStore().request.raw as TRequest;
  }

  /** Gets normalized request data used by parameter decorators. */
  static getRequestData<
    TBody = unknown,
    TQuery = Record<string, unknown>,
    TParams = Record<string, string>,
    THeaders = Record<string, string>,
    TRequest = unknown,
  >(): HttpRequest<TBody, TQuery, TParams, THeaders, TRequest> {
    return this.getStore().request as HttpRequest<
      TBody,
      TQuery,
      TParams,
      THeaders,
      TRequest
    >;
  }

  /**
   * Obtém response HTTP atual
   */
  static getResponse<TResponse = unknown>(): TResponse {
    return this.getStore().response as TResponse;
  }

  /**
   * Obtém definição da rota atual
   */
  static getRoute(): CompiledController {
    return this.getStore().route;
  }

  /**
   * Obtém valor customizado do context
   */
  static get<V>(key: string): V | undefined {
    return ExecutionContext.get<V>(key);
  }

  /**
   * Obtém valor customizado ou lança erro
   */
  static getOrThrow<V>(key: string): V {
    return ExecutionContext.getOrThrow<V>(key);
  }

  /**
   * Define valor customizado no context
   *
   * @example
   * // No guard
   * HttpExecutionContext.set('user', authenticatedUser);
   *
   * // No handler
   * const user = HttpExecutionContext.get('user');
   */
  static set<V>(key: string, value: V): void {
    ExecutionContext.set(key, value);
  }

  /**
   * Verifica se chave existe no context
   */
  static has(key: string): boolean {
    return ExecutionContext.has(key);
  }
}

import { ContainerDI, ExecutionContext } from '@elyum/core';

import { HttpRequest, HttpResponse, RouteDefinition } from '../contracts';

/**
 * Store do execution context HTTP
 *
 * Contém dados específicos de uma requisição HTTP
 */
export interface HttpExecutionContextStore {
  /** Scoped container para esta request */
  container: ContainerDI;

  /** Request HTTP */
  request: HttpRequest;

  /** Response HTTP */
  response: HttpResponse;

  /** Definição da rota sendo executada */
  route: RouteDefinition;

  /** Dados customizados (pode ser usado por guards, interceptors, etc) */
  [key: string]: any;
}

/**
 * Execution context específico para HTTP
 *
 * Estende ExecutionContext do core com métodos convenientes
 * para acessar request, response, etc
 *
 * @example
 * // Dentro de um guard
 * class AuthGuard {
 *   canActivate() {
 *     const request = HttpExecutionContext.getRequest();
 *     const token = request.headers.authorization;
 *     // ...
 *   }
 * }
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

  /**
   * Obtém scoped container da request atual
   */
  static getContainer(): ContainerDI {
    return this.getStore().container;
  }

  /**
   * Obtém request HTTP atual
   */
  static getRequest<
    TBody = unknown,
    TQuery = Record<string, unknown>,
    TParams = Record<string, string>,
  >(): HttpRequest<TBody, TQuery, TParams> {
    return this.getStore().request as HttpRequest<TBody, TQuery, TParams>;
  }

  /**
   * Obtém response HTTP atual
   */
  static getResponse(): HttpResponse {
    return this.getStore().response;
  }

  /**
   * Obtém definição da rota atual
   */
  static getRoute(): RouteDefinition {
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

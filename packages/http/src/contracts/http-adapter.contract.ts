import { ContainerDI } from '@elyum/core';

import { HttpRequest } from './http-request.contract';
import { HttpResponse } from './http-response.contract';
import { RouteDefinition } from './route-definition.contract';

/**
 * Base adapter usando Template Method Pattern
 *
 * Adapters específicos (Fastify, Express) devem estender esta classe
 * e implementar os métodos abstratos
 *
 * @example
 * class FastifyAdapter extends HttpAdapter {
 *   registerRoute(definition: RouteDefinition) {
 *     // Implementação específica do Fastify
 *   }
 * }
 */
export abstract class HttpAdapter {
  protected constructor(protected readonly rootContainer: ContainerDI) {}

  /**
   * Registra rota no framework (MUST IMPLEMENT)
   *
   * Cada adapter implementa de acordo com API do framework
   */
  abstract registerRoute(definition: RouteDefinition): void;

  /**
   * Inicia servidor HTTP (MUST IMPLEMENT)
   */
  abstract start(port: number, host?: string): Promise<void>;

  /**
   * Para servidor HTTP (MUST IMPLEMENT)
   */
  abstract stop(): Promise<void>;

  /**
   * Registra resource completo (implementação padrão)
   *
   * Extrai todas as rotas de um resource e registra
   */
  registerResource(resource: any): void {
    const routes = this.getRoutesFromResource(resource);

    for (const route of routes) {
      this.registerRoute(route);
    }
  }

  /**
   * Extrai rotas de um resource class
   *
   * Lê metadata dos decorators (@Get, @Post, etc)
   */
  protected abstract getRoutesFromResource(resource: any): RouteDefinition[];

  /**
   * Executa rota (lógica compartilhada)
   *
   * 1. Cria context
   * 2. Extrai parâmetros (@Body, @Query, etc)
   * 3. Valida parâmetros
   * 4. Executa guards
   * 5. Resolve dependências (DI)
   * 6. Executa handler
   * 7. Retorna resultado
   *
   * Esta lógica é REUTILIZÁVEL entre todos os adapters
   */
  protected async executeRoute(
    definition: RouteDefinition,
    req: HttpRequest,
    res: HttpResponse,
  ): Promise<any> {
    // Implementação será detalhada em route-executor.ts
    throw new Error('executeRoute must be implemented by RouteExecutor');
  }

  /**
   * Cria execution context para request
   *
   * Pode ser sobrescrito para customização
   */
  protected createContext(
    req: HttpRequest,
    res: HttpResponse,
    route: RouteDefinition,
  ): Record<string, any> {
    // Criar scoped container para esta request
    const scopedContainer = this.rootContainer.fork();

    return {
      container: scopedContainer,
      request: req,
      response: res,
      route,
    };
  }

  /**
   * Trata erros (pode ser sobrescrito)
   */
  protected handleError(
    error: Error,
    req: HttpRequest,
    res: HttpResponse,
  ): void {
    console.error('[Elyum HTTP] Error:', error);

    // Lógica padrão de erro
    const statusCode = this.getStatusCodeFromError(error);
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
      error: error.name || 'Error',
      message,
      statusCode,
    });
  }

  /**
   * Extrai status code de erro
   */
  protected getStatusCodeFromError(error: any): number {
    // HttpException tem statusCode
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode;
    }

    // ValidationError = 400
    if (error.name === 'ValidationError') {
      return 400;
    }

    // Default = 500
    return 500;
  }
}

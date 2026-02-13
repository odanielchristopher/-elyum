import { Constructor } from '@elyum/core';

import { HttpMethod, ParamMetadata, RouteHandler } from '../types';

/**
 * Definição completa de uma rota
 *
 * Contém todas as informações necessárias para:
 * - Registrar rota no framework
 * - Executar handler
 * - Extrair parâmetros
 * - Validar dados
 * - Executar guards
 */
export interface RouteDefinition {
  /** Classe do resource */
  resourceClass: Constructor;

  /** Nome do método handler */
  handlerName: string;

  /** Função handler */
  handler: RouteHandler;

  /** Método HTTP (GET, POST, etc) */
  method: HttpMethod;

  /** Path completo da rota (/users/:id) */
  path: string;

  /** Metadados dos parâmetros (@Body, @Query, etc) */
  params: ParamMetadata[];

  /** Guards a serem executados */
  guards?: Constructor[] | undefined;
}

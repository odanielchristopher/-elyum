import { ErrorCode } from '@elyum/core';

import { HttpException } from './http.exception';

/**
 * 403 Forbidden
 *
 * Autenticado mas sem permissão
 *
 * @example
 * if (user.role !== 'admin') {
 *   throw new ForbiddenException('Admin access required');
 * }
 *
 * @example
 * // Usado internamente quando guard retorna false
 * throw new ForbiddenException('Access denied by guard');
 */
export class ForbiddenException extends HttpException {
  override code = ErrorCode.FORBIDDEN;

  constructor(message: string = 'Forbidden') {
    super(message, 403, 'Forbidden');
  }
}

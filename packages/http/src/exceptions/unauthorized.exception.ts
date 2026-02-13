import { ErrorCode } from '@elyum/core';

import { HttpException } from './http.exception';

/**
 * 401 Unauthorized
 *
 * Autenticação necessária ou falhou
 *
 * @example
 * if (!token) {
 *   throw new UnauthorizedException('Token required');
 * }
 *
 * @example
 * const user = await validateToken(token);
 * if (!user) {
 *   throw new UnauthorizedException('Invalid token');
 * }
 */
export class UnauthorizedException extends HttpException {
  override code = ErrorCode.UNAUTHORIZED;

  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'Unauthorized');
  }
}

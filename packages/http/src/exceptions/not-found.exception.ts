import { ErrorCode } from '@elyum/core';

import { HttpException } from './http.exception';

/**
 * 404 Not Found
 *
 * Recurso não encontrado
 *
 * @example
 * const user = await this.userService.findById(id);
 * if (!user) {
 *   throw new NotFoundException(`User ${id} not found`);
 * }
 *
 * @example
 * throw new NotFoundException('Resource not found');
 */
export class NotFoundException extends HttpException {
  override code = ErrorCode.NOT_FOUND;

  constructor(message: string = 'Not Found') {
    super(message, 404, 'Not Found');
  }
}

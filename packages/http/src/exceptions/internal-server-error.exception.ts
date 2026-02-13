import { ErrorCode } from '@elyum/core';

import { HttpException } from './http.exception';

/**
 * 500 Internal Server Error
 *
 * Erro inesperado no servidor
 *
 * @example
 * try {
 *   await this.process();
 * } catch (error) {
 *   throw new InternalServerErrorException('Processing failed');
 * }
 */
export class InternalServerErrorException extends HttpException {
  override code = ErrorCode.INTERNAL_SERVER_ERROR;

  constructor(message: string = 'Internal Server Error') {
    super(message, 500, 'Internal Server Error');
  }
}

import { ErrorCode } from '@elyum/core';

import { HttpException } from './http.exception';

/**
 * 400 Bad Request
 *
 * Request malformado ou inválido
 *
 * @example
 * throw new BadRequestException('Invalid input');
 *
 * @example
 * if (!data.email) {
 *   throw new BadRequestException('Email is required');
 * }
 */
export class BadRequestException extends HttpException {
  override code = ErrorCode.BAD_REQUEST;

  constructor(message: string = 'Bad Request') {
    super(message, 400, 'Bad Request');
  }
}

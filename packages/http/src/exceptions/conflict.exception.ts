import { ErrorCode } from '@elyum/core';

import { HttpException } from './http.exception';

/**
 * 409 Conflict
 *
 * Conflito com estado atual do recurso
 *
 * @example
 * const existing = await this.userService.findByEmail(email);
 * if (existing) {
 *   throw new ConflictException('Email already registered');
 * }
 */
export class ConflictException extends HttpException {
  override code = ErrorCode.CONFLICT;

  constructor(message: string = 'Conflict') {
    super(message, 409, 'Conflict');
  }
}

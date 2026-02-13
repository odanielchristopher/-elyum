import { ElyumError, ErrorCode } from '@elyum/core';

/**
 * Exceção HTTP base
 *
 * Todas as exceções HTTP estendem esta classe
 */
export abstract class HttpException extends ElyumError {
  abstract code: ErrorCode;

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly error?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Serializa para JSON (útil para responses)
   */
  toJSON(): {
    code: ErrorCode;
    statusCode: number;
    error: string;
    message: string;
  } {
    return {
      statusCode: this.statusCode,
      code: this.code,
      error: this.error || this.name,
      message: this.message,
    };
  }
}

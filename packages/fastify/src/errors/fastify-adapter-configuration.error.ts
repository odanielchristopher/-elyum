import { ElyumError, ErrorCode } from '@elyum/core';

export class FastifyAdapterConfigurationError extends ElyumError {
  override readonly code = ErrorCode.ELYUM_FASTIFY_CONFIGURATION;

  constructor(problem: string, resolution: string) {
    super(
      `Elyum Fastify adapter cannot be configured: ${problem} ${resolution}`,
    );
  }
}

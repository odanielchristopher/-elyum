import { ElyumError, ErrorCode } from '@elyum/core';

export class ExpressAdapterConfigurationError extends ElyumError {
  override readonly code = ErrorCode.ELYUM_EXPRESS_CONFIGURATION;

  constructor(problem: string, resolution: string) {
    super(
      `Elyum Express adapter cannot be configured: ${problem} ${resolution}`,
    );
  }
}

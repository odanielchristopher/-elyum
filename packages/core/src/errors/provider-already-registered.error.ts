import { ErrorCode } from '@elyum/enums/error-code.enum';
import { describeToken } from '@elyum/helpers/describe-token.helper';
import { InjectionToken } from '@elyum/types/injection-token.type';

import { ElyumError } from './contracts/elyum.error';

export class ProviderAlreadyRegisteredError extends ElyumError {
  override readonly code: ErrorCode =
    ErrorCode.ELYUM_PROVIDER_ALREADY_REGISTERED;

  constructor(token: InjectionToken) {
    super(`Provider '${describeToken(token)}' already registered.`);
  }
}

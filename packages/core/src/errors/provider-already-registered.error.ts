import { ErrorCode } from '../enums';
import { describeToken } from '../helpers/describe-token.helper';
import { InjectionToken } from '../types';

import { ElyumError } from './contracts/elyum.error';

export class ProviderAlreadyRegisteredError extends ElyumError {
  override readonly code: ErrorCode =
    ErrorCode.ELYUM_PROVIDER_ALREADY_REGISTERED;

  constructor(token: InjectionToken) {
    super(`Provider '${describeToken(token)}' already registered.`);
  }
}

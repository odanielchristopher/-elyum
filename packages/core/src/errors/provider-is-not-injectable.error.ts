import { ErrorCode } from '../enums';
import { describeToken } from '../helpers/describe-token.helper';
import { Constructor } from '../types';

import { ElyumError } from './contracts/elyum.error';

export class ProviderIsNotInjectable extends ElyumError {
  override readonly code: ErrorCode = ErrorCode.ELYUM_PROVIDER_NOT_INJECTABLE;

  constructor(provider: Constructor) {
    super(`'${describeToken(provider.name)}' is not injectable.`);
  }
}

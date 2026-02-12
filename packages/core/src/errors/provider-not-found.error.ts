import { ErrorCode } from '../enums';
import { describeToken } from '../helpers/describe-token.helper';
import { InjectionToken } from '../types';

import { ElyumError } from './contracts/elyum.error';

export class ProviderNotFoundError extends ElyumError {
  override readonly code: ErrorCode = ErrorCode.ELYUM_PROVIDER_NOT_FOUND;

  constructor(token: InjectionToken, requester?: InjectionToken) {
    super(
      requester
        ? `Provider '${describeToken(token)}' not registered (required by '${describeToken(requester)}').`
        : `Provider '${describeToken(token)}' not registered.`,
    );
  }
}

import { describeToken } from '@elyum/helpers/describe-token.helper';
import { InjectionToken } from '@elyum/types/injection-token.type';

import { ElyumError } from './contracts/elyum.error';

export class ProviderNotFoundError extends ElyumError {
  constructor(token: InjectionToken, requester?: InjectionToken) {
    super(
      requester
        ? `Provider '${describeToken(token)}' not registered (required by '${describeToken(requester)}').`
        : `Provider '${describeToken(token)}' not registered.`,
      'ELYUM_PROVIDER_NOT_FOUND',
    );
  }
}

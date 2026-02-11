import { describeToken } from '@elyum/helpers/describe-token.helper';
import { InjectionToken } from '@elyum/types/injection-token.type';

import { ElyumError } from './contracts/elyum.error';

export class ProviderAlreadyRegisteredError extends ElyumError {
  constructor(token: InjectionToken) {
    super(
      `Provider '${describeToken(token)}' already registered.`,
      'ELYUM_PROVIDER_ALREADY_REGISTERED',
    );
  }
}

import { describeToken } from '@elyum/helpers/describe-token.helper';
import { Constructor } from '@elyum/types/constructor.type';

import { ElyumError } from './contracts/elyum.error';

export class ProviderIsNotInjectable extends ElyumError {
  constructor(provider: Constructor) {
    super(
      `'${describeToken(provider.name)}' is not injectable.`,
      'ELYUM_PROVIDER_NOT_INJECTABLE',
    );
  }
}

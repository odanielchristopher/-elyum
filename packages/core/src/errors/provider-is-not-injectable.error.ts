import { describeToken } from '@elyum/helpers/describe-token.helper';
import { Constructor } from '@elyum/types/constructor.type';

export class ProviderIsNotInjectable extends Error {
  constructor(provider: Constructor) {
    super(`'${describeToken(provider.name)}' is not injectable.`);
  }
}

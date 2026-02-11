import { describeToken } from '@elyum/helpers/describe-token.helper';
import { InjectionToken } from '@elyum/types/injection-token.type';

export class ProviderAlredyRegisteredError extends Error {
  constructor(token: InjectionToken) {
    super(`Provider '${describeToken(token)}' already registered.`);
  }
}

import { describeToken } from '@elyum/helpers/describe-token.helper';
import { InjectionToken } from '@elyum/types/injection-token.type';

export class ProviderNotFoundError extends Error {
  constructor(token: InjectionToken, requester?: InjectionToken) {
    super(
      requester
        ? `Provider '${describeToken(token)}' not registered (required by '${describeToken(requester)}').`
        : `Provider '${describeToken(token)}' not registered.`,
    );
  }
}

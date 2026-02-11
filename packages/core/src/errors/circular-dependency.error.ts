import { InjectionToken } from '@elyum/types/injection-token.type';

import { describeToken } from 'src/helpers/describe-token.helper';

export class CircularDependencyError extends Error {
  constructor(stack: InjectionToken[]) {
    super(
      `Circular dependency detected:\n` + stack.map(describeToken).join(' -> '),
    );
  }
}

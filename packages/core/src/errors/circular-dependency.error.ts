import { describeToken } from '@elyum/helpers/describe-token.helper';
import { InjectionToken } from '@elyum/types/injection-token.type';

import { ElyumError } from './contracts/elyum.error';

export class CircularDependencyError extends ElyumError {
  constructor(stack: InjectionToken[]) {
    super(
      `Circular dependency detected:\n` + stack.map(describeToken).join(' -> '),
      'ELYUM_CIRCULAR_DEPENDENCY',
    );
  }
}

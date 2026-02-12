import { ErrorCode } from '../enums';
import { describeToken } from '../helpers/describe-token.helper';
import { InjectionToken } from '../types';

import { ElyumError } from './contracts/elyum.error';

export class CircularDependencyError extends ElyumError {
  override readonly code: ErrorCode = ErrorCode.ELYUM_CIRCULAR_DEPENDENCY;

  constructor(stack: InjectionToken[]) {
    super(
      `Circular dependency detected:\n` + stack.map(describeToken).join(' -> '),
    );
  }
}

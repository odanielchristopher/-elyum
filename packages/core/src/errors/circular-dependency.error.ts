import { ErrorCode } from '@elyum/enums/error-code.enum';
import { describeToken } from '@elyum/helpers/describe-token.helper';
import { InjectionToken } from '@elyum/types/injection-token.type';

import { ElyumError } from './contracts/elyum.error';

export class CircularDependencyError extends ElyumError {
  override readonly code: ErrorCode = ErrorCode.ELYUM_CIRCULAR_DEPENDENCY;

  constructor(stack: InjectionToken[]) {
    super(
      `Circular dependency detected:\n` + stack.map(describeToken).join(' -> '),
    );
  }
}

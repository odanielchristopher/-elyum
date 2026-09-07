import { ErrorCode } from '../enums';
import { describeToken } from '../helpers/describe-token.helper';
import { InjectionToken } from '../types';

import { ElyumError } from './contracts/elyum.error';

export type DependencyRegistrationReason =
  | 'custom_token_requires_provider'
  | 'metadata_unavailable'
  | 'non_injectable_dependency'
  | 'unregistered_token'
  | 'unsupported_scope';

export class DependencyRegistrationError extends ElyumError {
  override readonly code = ErrorCode.ELYUM_DEPENDENCY_REGISTRATION;

  readonly dependencyPath: readonly InjectionToken[];

  constructor(
    readonly root: InjectionToken,
    readonly dependency: InjectionToken,
    readonly reason: DependencyRegistrationReason,
    dependencyPath: readonly InjectionToken[],
    problem: string,
    resolution: string,
  ) {
    const path = dependencyPath.map(describeToken).join(' -> ');

    super(
      `Dependencies for '${describeToken(root)}' cannot be auto-registered: ${problem} Dependency path: ${path}. ${resolution}`,
    );

    this.dependencyPath = Object.freeze([...dependencyPath]);
  }
}

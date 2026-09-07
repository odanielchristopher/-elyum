import { Scope } from './scope.type';

export interface RegisterDependenciesOptions {
  readonly allowedScopes?: readonly Scope[];
}

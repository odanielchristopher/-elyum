import { CircularDependencyError } from '@elyum/errors/circular-dependency.error';
import { ElyumError } from '@elyum/errors/contracts/elyum.error';
import { describeToken } from '@elyum/helpers/describe-token.helper';
import { InjectionToken } from '@elyum/types/injection-token.type';
import { describe, expect, it } from 'vitest';

describe('CircularDependencyError', () => {
  it('should build correct message', () => {
    const stack: InjectionToken[] = [
      'ValidController',
      'ValidUseCase',
      'ValidController',
    ];

    const error = new CircularDependencyError(stack);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ElyumError);
    expect(error).toBeInstanceOf(CircularDependencyError);
    expect(error.name).toBe('CircularDependencyError');
    expect(error.code).toBe('ELYUM_CIRCULAR_DEPENDENCY');
    expect(error.message).toBe(
      `Circular dependency detected:\n` + stack.map(describeToken).join(' -> '),
    );
  });
});

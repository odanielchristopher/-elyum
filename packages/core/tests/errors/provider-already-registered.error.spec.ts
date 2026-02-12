import {
  ElyumError,
  InjectionToken,
  ProviderAlreadyRegisteredError,
  describeToken,
} from '@elyum/core';
import { describe, expect, it } from 'vitest';

describe('ProviderAlreadyRegisteredError', () => {
  it('should build correct message', () => {
    const token: InjectionToken = Symbol('my-provider');

    const error = new ProviderAlreadyRegisteredError(token);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ElyumError);
    expect(error).toBeInstanceOf(ProviderAlreadyRegisteredError);
    expect(error.name).toBe('ProviderAlreadyRegisteredError');
    expect(error.code).toBe('ELYUM_PROVIDER_ALREADY_REGISTERED');
    expect(error.message).toBe(
      `Provider '${describeToken(token)}' already registered.`,
    );
  });
});

import { describe, expect, it } from 'vitest';

import { ElyumError, ProviderNotFoundError, describeToken } from '@elyum/core';

describe('ProviderNotFoundError', () => {
  it('should build message with requester', () => {
    const token = Symbol('provider-token');
    const requester = Symbol('requester-token');

    const error = new ProviderNotFoundError(token, requester);

    expect(error).toBeInstanceOf(ProviderNotFoundError);
    expect(error).toBeInstanceOf(ElyumError);
    expect(error.name).toBe('ProviderNotFoundError');
    expect(error.code).toBe('ELYUM_PROVIDER_NOT_FOUND');
    expect(error.message).toBe(
      `Provider '${describeToken(token)}' not registered (required by '${describeToken(requester)}').`,
    );
  });

  it('should build message without requester', () => {
    const token = Symbol('provider-token');

    const error = new ProviderNotFoundError(token);

    expect(error.message).toBe(
      `Provider '${describeToken(token)}' not registered.`,
    );
  });
});

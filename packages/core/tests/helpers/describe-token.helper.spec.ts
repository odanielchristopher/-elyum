import { describe, expect, it } from 'vitest';

import { describeToken, InjectionToken } from '@elyum/core';

describe('describeToken', () => {
  it('should return same token if token was string', () => {
    const result = describeToken('valid-token');

    expect(result).toBe('valid-token');
  });

  it('should return toString() when token is symbol without description', () => {
    const token = Symbol();

    const result = describeToken(token);

    expect(result).toBe(token.toString());
  });

  it('should return description when token was symbol with description', () => {
    const token = Symbol('valid-token');

    const result = describeToken(token);

    expect(result).toBe(`Symbol(${token.description})`);
  });

  it('should return token successfully when token is a named class', () => {
    const token = class UseCase {};

    const result = describeToken(token);

    expect(result).toBe(token.name);
  });

  it('should return token successfully when token is a anonymous class', () => {
    const result = describeToken(class {});

    expect(result).toBe('[Anonymous Class]');
  });

  it('should return unknown when cannot identificate token', () => {
    const result = describeToken(1 as unknown as InjectionToken);

    expect(result).toBe('[Unknown Token]');
  });
});

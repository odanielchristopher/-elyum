import { ElyumError, ProviderIsNotInjectable } from '@elyum/core';
import { describe, expect, it } from 'vitest';

describe('ProviderIsNotInjectable', () => {
  it('should build correct message for named class', () => {
    class MyService {}

    const error = new ProviderIsNotInjectable(MyService);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ElyumError);
    expect(error).toBeInstanceOf(ProviderIsNotInjectable);
    expect(error.name).toBe('ProviderIsNotInjectable');
    expect(error.code).toBe('ELYUM_PROVIDER_NOT_INJECTABLE');
    expect(error.message).toBe(`'MyService' is not injectable.`);
  });

  it('should build correct message for anonymous class', () => {
    const Anonymous = class {};

    const error = new ProviderIsNotInjectable(Anonymous);

    expect(error.message).toBe(`'Anonymous' is not injectable.`);
  });
});

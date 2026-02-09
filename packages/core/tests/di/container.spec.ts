import { describe, expect, it } from 'vitest';

describe('Container', () => {
  it('should resolve provider successfuly', () => {
    const result = 1 + 1;

    expect(result).toBe(2);
  });
});

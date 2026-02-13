import { describe, expect, it } from 'vitest';

import { ExecutionContext } from '@elyum/core';

describe('ExecutionContext', () => {
  describe('run() / getStore()', () => {
    it('should expose current store inside run scope', () => {
      const store = { requestId: 'req-1' };

      const result = ExecutionContext.run(store, () => {
        return ExecutionContext.getStore<typeof store>();
      });

      expect(result).toBe(store);
    });

    it('should throw when getStore is called outside execution scope', () => {
      expect(() => ExecutionContext.getStore()).toThrow(
        'ExecutionContext is not available in current scope.',
      );
    });
  });

  describe('get() / set() / has()', () => {
    it('should set and get values from current store', () => {
      const result = ExecutionContext.run({}, () => {
        ExecutionContext.set('userId', 'user-123');

        return {
          hasUserId: ExecutionContext.has('userId'),
          value: ExecutionContext.get<string>('userId'),
        };
      });

      expect(result.hasUserId).toBe(true);
      expect(result.value).toBe('user-123');
    });

    it('should return undefined if key does not exist', () => {
      const result = ExecutionContext.run({}, () => {
        return ExecutionContext.get('missing');
      });

      expect(result).toBeUndefined();
    });

    it('should return false from has outside execution scope', () => {
      expect(ExecutionContext.has('any')).toBe(false);
    });

    it('should throw when set is called outside execution scope', () => {
      expect(() => ExecutionContext.set('key', 'value')).toThrow(
        'ExecutionContext is not available in current scope.',
      );
    });
  });

  describe('getOrThrow()', () => {
    it('should return value when key exists', () => {
      const result = ExecutionContext.run({ token: 'abc' }, () => {
        return ExecutionContext.getOrThrow<string>('token');
      });

      expect(result).toBe('abc');
    });

    it('should throw when key does not exist', () => {
      expect(() => {
        ExecutionContext.run({}, () => {
          ExecutionContext.getOrThrow('missing');
        });
      }).toThrow("ExecutionContext key 'missing' is not defined.");
    });
  });

  describe('async propagation', () => {
    it('should preserve context across async boundaries', async () => {
      const result = await ExecutionContext.run(
        { requestId: 'req-async' },
        async () => {
          await Promise.resolve();
          await new Promise((resolve) => setTimeout(resolve, 0));

          return ExecutionContext.get<string>('requestId');
        },
      );

      expect(result).toBe('req-async');
    });

    it('should isolate nested contexts', () => {
      const result = ExecutionContext.run({ value: 'outer' }, () => {
        const outerBefore = ExecutionContext.get<string>('value');

        const inner = ExecutionContext.run({ value: 'inner' }, () => {
          return ExecutionContext.get<string>('value');
        });

        const outerAfter = ExecutionContext.get<string>('value');

        return { outerBefore, inner, outerAfter };
      });

      expect(result.outerBefore).toBe('outer');
      expect(result.inner).toBe('inner');
      expect(result.outerAfter).toBe('outer');
    });
  });
});

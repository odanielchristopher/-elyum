import { Get } from '@elyum/http';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import elyumDefault, {
  elyum,
  FastifyAdapterConfigurationError,
} from '@elyum/fastify';

describe('@elyum/fastify public API', () => {
  it('should expose default and named plugin factories', () => {
    expect(elyumDefault).toBe(elyum);
    expect(FastifyAdapterConfigurationError).toEqual(expect.any(Function));
  });

  it('should augment Fastify with a typed controller registrar', async () => {
    // Arrange
    interface TestRoute {
      Body: { name: string };
    }

    @Get('/typed')
    class TestController {
      execute() {
        return 'typed';
      }
    }
    const application = Fastify();
    await application.register(elyum());

    // Act
    application.controller<TestRoute>(TestController, {
      preHandler: async (request) => {
        void request.body.name;
      },
    });

    // Assert
    expect(application.controller).toEqual(expect.any(Function));
    await application.close();
  });
});

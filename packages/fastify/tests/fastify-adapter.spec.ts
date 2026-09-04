import { ElyumFactory } from '@elyum/core';
import {
  Body,
  ControllerExecutionError,
  Get,
  Headers,
  httpResult,
  Param,
  Post,
  Query,
  Request,
  Response,
  Route,
  type HttpMethod,
} from '@elyum/http';
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FastifyAdapterConfigurationError, elyum } from '@elyum/fastify';

const applications: FastifyInstance[] = [];

function createApplication(): FastifyInstance {
  const application = Fastify();
  applications.push(application);
  return application;
}

afterEach(async () => {
  await Promise.all(
    applications.splice(0).map((application) => application.close()),
  );
});

describe('@elyum/fastify', () => {
  describe('plugin and native registration', () => {
    it('should expose the runtime and register a controller with the internal container', async () => {
      // Arrange
      @Get('/health')
      class HealthController {
        execute() {
          return { healthy: true };
        }
      }
      const application = createApplication();

      // Act
      await application.register(elyum());
      const returnedApplication = application.controller(HealthController);
      const response = await application.inject({
        method: 'GET',
        url: '/health',
      });

      // Assert
      expect(returnedApplication).toBe(application);
      expect(application.elyum.container).toBeDefined();
      expect(application.elyum.resolveController).toEqual(expect.any(Function));
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ healthy: true });
    });

    it('should make controller registration available to descendant route plugins', async () => {
      // Arrange
      @Get('/nested')
      class NestedController {
        execute() {
          return 'nested';
        }
      }
      const application = createApplication();

      // Act
      await application.register(elyum());
      await application.register(async (scope) => {
        scope.controller(NestedController);
      });
      const response = await application.inject({
        method: 'GET',
        url: '/nested',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('nested');
    });

    it('should use the controller method configured during plugin registration', async () => {
      // Arrange
      @Get('/configured-method')
      class TestController {
        run() {
          return 'configured';
        }
      }
      const application = createApplication();

      // Act
      await application.register(elyum(), { controllerMethod: 'run' });
      application.controller(TestController);
      const response = await application.inject({
        method: 'GET',
        url: '/configured-method',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('configured');
    });

    it.each<HttpMethod>([
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'HEAD',
      'OPTIONS',
    ])(
      'should register the %s method from controller metadata',
      async (method) => {
        // Arrange
        class TestController {
          execute() {
            return method;
          }
        }
        Route({ method, path: `/methods/${method.toLowerCase()}` })(
          TestController,
        );
        const application = createApplication();
        await application.register(elyum());
        application.controller(TestController);

        // Act
        const response = await application.inject({
          method,
          url: `/methods/${method.toLowerCase()}`,
        });

        // Assert
        expect(response.statusCode).toBe(method === 'POST' ? 201 : 200);
        if (method !== 'HEAD') expect(response.body).toBe(method);
      },
    );

    it('should preserve native hooks, config, and schema options', async () => {
      // Arrange
      @Post('/native-options')
      class TestController {
        execute(
          @Body('name') name: string,
          @Request() request: FastifyRequest,
        ) {
          return {
            name,
            hook: request.headers['x-hook'],
            config: request.routeOptions.config,
          };
        }
      }
      const application = createApplication();
      await application.register(elyum());
      application.controller(TestController, {
        config: { source: 'native-fastify' },
        onRequest: async (request) => {
          request.headers['x-hook'] = 'executed';
        },
        schema: {
          body: {
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string' } },
          },
        },
      });

      // Act
      const valid = await application.inject({
        method: 'POST',
        url: '/native-options',
        payload: { name: 'Elyum' },
      });
      const invalid = await application.inject({
        method: 'POST',
        url: '/native-options',
        payload: {},
      });

      // Assert
      expect(valid.statusCode).toBe(201);
      expect(valid.json()).toMatchObject({
        name: 'Elyum',
        hook: 'executed',
        config: { source: 'native-fastify' },
      });
      expect(invalid.statusCode).toBe(400);
    });
  });

  describe('parameter and response mapping', () => {
    it('should map normalized values and native request/reply objects', async () => {
      // Arrange
      const validator = {
        parse: (params: Record<string, string>) =>
          `${params.userId}:${params.postId}`,
      };

      @Post('/users/:userId/posts/:postId')
      class TestController {
        execute(
          @Body('name') name: string,
          @Query('page') page: string,
          @Param(validator) routeKey: string,
          @Headers('x-client') client: string,
          @Request() request: FastifyRequest,
          @Response() reply: FastifyReply,
        ) {
          return {
            name,
            page,
            routeKey,
            client,
            nativeRequest: typeof request.id === 'string',
            nativeReply: typeof reply.send === 'function',
          };
        }
      }
      const application = createApplication();
      await application.register(elyum());
      application.controller(TestController);

      // Act
      const response = await application.inject({
        method: 'POST',
        url: '/users/user-1/posts/post-2?page=3',
        headers: { 'x-client': 'integration-test' },
        payload: { name: 'Elyum' },
      });

      // Assert
      expect(response.json()).toEqual({
        name: 'Elyum',
        page: '3',
        routeKey: 'user-1:post-2',
        client: 'integration-test',
        nativeRequest: true,
        nativeReply: true,
      });
    });

    it('should apply built-in validators exactly once', async () => {
      // Arrange
      const parse = vi.fn((body: { name: string }) => ({
        name: body.name.toUpperCase(),
      }));

      @Post('/validated')
      class TestController {
        execute(@Body({ parse }) body: { name: string }) {
          return body;
        }
      }
      const application = createApplication();
      await application.register(elyum());
      application.controller(TestController);

      // Act
      const response = await application.inject({
        method: 'POST',
        url: '/validated',
        payload: { name: 'elyum' },
      });

      // Assert
      expect(response.json()).toEqual({ name: 'ELYUM' });
      expect(parse).toHaveBeenCalledOnce();
    });

    it('should isolate native request data across concurrent executions', async () => {
      // Arrange
      let arrivals = 0;
      let release!: () => void;
      const bothRequestsStarted = new Promise<void>((resolve) => {
        release = resolve;
      });

      @Get('/concurrent')
      class TestController {
        async execute(@Request() request: FastifyRequest) {
          arrivals += 1;
          if (arrivals === 2) release();
          await bothRequestsStarted;
          return request.headers['x-request-id'];
        }
      }
      const application = createApplication();
      await application.register(elyum());
      application.controller(TestController);

      // Act
      const [first, second] = await Promise.all([
        application.inject({
          method: 'GET',
          url: '/concurrent',
          headers: { 'x-request-id': 'first' },
        }),
        application.inject({
          method: 'GET',
          url: '/concurrent',
          headers: { 'x-request-id': 'second' },
        }),
      ]);

      // Assert
      expect(first.body).toBe('first');
      expect(second.body).toBe('second');
    });

    it('should map marked status, headers, body, and empty results', async () => {
      // Arrange
      @Get('/result')
      class ResultController {
        execute() {
          return httpResult({
            statusCode: 202,
            headers: { 'x-job': 'job-1' },
            body: { accepted: true },
          });
        }
      }
      @Get('/empty')
      class EmptyController {
        execute() {}
      }
      const application = createApplication();
      await application.register(elyum());
      application.controller(ResultController);
      application.controller(EmptyController);

      // Act
      const result = await application.inject({
        method: 'GET',
        url: '/result',
      });
      const empty = await application.inject({ method: 'GET', url: '/empty' });

      // Assert
      expect(result.statusCode).toBe(202);
      expect(result.headers['x-job']).toBe('job-1');
      expect(result.json()).toEqual({ accepted: true });
      expect(empty.statusCode).toBe(200);
      expect(empty.body).toBe('');
    });

    it('should preserve a manually sent native response', async () => {
      // Arrange
      @Get('/manual')
      class TestController {
        execute(@Response() reply: FastifyReply) {
          void reply.code(204).send();
        }
      }
      const application = createApplication();
      await application.register(elyum());
      application.controller(TestController);

      // Act
      const response = await application.inject({
        method: 'GET',
        url: '/manual',
      });

      // Assert
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
    });
  });

  describe('controller resolution', () => {
    it('should auto-register controllers as transient in the internal container', async () => {
      // Arrange
      let instances = 0;

      @Get('/instances')
      class TestController {
        private readonly instance = ++instances;

        execute() {
          return this.instance;
        }
      }
      const application = createApplication();
      await application.register(elyum());
      application.controller(TestController);

      // Act
      const first = await application.inject({
        method: 'GET',
        url: '/instances',
      });
      const second = await application.inject({
        method: 'GET',
        url: '/instances',
      });

      // Assert
      expect(first.json()).toBe(1);
      expect(second.json()).toBe(2);
    });

    it('should respect a controller provider already registered in a supplied container', async () => {
      // Arrange
      let instances = 0;

      @Get('/singleton')
      class TestController {
        private readonly instance = ++instances;

        execute() {
          return this.instance;
        }
      }
      const container = ElyumFactory.createRoot();
      container.register({ token: TestController, useClass: TestController });
      const application = createApplication();
      await application.register(elyum(), { container });
      application.controller(TestController);

      // Act
      const first = await application.inject({
        method: 'GET',
        url: '/singleton',
      });
      const second = await application.inject({
        method: 'GET',
        url: '/singleton',
      });

      // Assert
      expect(application.elyum.container).toBe(container);
      expect(first.json()).toBe(1);
      expect(second.json()).toBe(1);
    });

    it('should support an asynchronous application-owned controller factory', async () => {
      // Arrange
      const dependency = { value: 'application-factory' };

      @Get('/factory')
      class TestController {
        constructor(private readonly value: string) {}

        execute() {
          return this.value;
        }
      }
      const application = createApplication();
      await application.register(elyum(), {
        resolveController: async (Controller) => {
          await Promise.resolve();
          return new Controller(dependency.value);
        },
      });
      application.controller(TestController);

      // Act
      const response = await application.inject({
        method: 'GET',
        url: '/factory',
      });

      // Assert
      expect(application.elyum.container).toBeUndefined();
      expect(response.body).toBe('application-factory');
    });

    it('should reject container and resolver configured together', async () => {
      // Arrange
      const application = createApplication();
      const invalidOptions = {
        container: ElyumFactory.createRoot(),
        resolveController: () => ({}),
      };

      // Act & Assert
      await expect(
        application.register(elyum(), invalidOptions as never).ready(),
      ).rejects.toBeInstanceOf(FastifyAdapterConfigurationError);
    });
  });

  describe('error integration', () => {
    it('should forward the original error to the native Fastify error handler', async () => {
      // Arrange
      const failure = new Error('application failure');

      @Get('/failure')
      class TestController {
        execute() {
          throw failure;
        }
      }
      const nativeHandler = vi.fn(
        (error: Error, _request, reply: FastifyReply) => {
          void reply.code(503).send({ message: error.message });
        },
      );
      const application = createApplication();
      application.setErrorHandler(nativeHandler);
      await application.register(elyum());
      application.controller(TestController);

      // Act
      const response = await application.inject({
        method: 'GET',
        url: '/failure',
      });

      // Assert
      expect(nativeHandler).toHaveBeenCalledWith(
        failure,
        expect.anything(),
        expect.anything(),
      );
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ message: 'application failure' });
    });

    it('should let onError send the response with controller context', async () => {
      // Arrange
      const failure = new Error('handled failure');
      const nativeHandler = vi.fn();
      const onError = vi.fn(async (error, context) => {
        expect(error).toBe(failure);
        expect(context.controller.path).toBe('/handled');
        void context.reply.code(422).send({ handled: true });
      });

      @Get('/handled')
      class TestController {
        execute() {
          throw failure;
        }
      }
      const application = createApplication();
      application.setErrorHandler(nativeHandler);
      await application.register(elyum(), { onError });
      application.controller(TestController);

      // Act
      const response = await application.inject({
        method: 'GET',
        url: '/handled',
      });

      // Assert
      expect(onError).toHaveBeenCalledOnce();
      expect(nativeHandler).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(422);
      expect(response.json()).toEqual({ handled: true });
    });

    it('should rethrow the original error when onError does not respond', async () => {
      // Arrange
      const failure = new Error('unhandled failure');
      const onError = vi.fn();
      const nativeHandler = vi.fn(
        (error: Error, _request, reply: FastifyReply) => {
          void reply.code(500).send({ message: error.message });
        },
      );

      @Get('/unhandled')
      class TestController {
        execute() {
          throw failure;
        }
      }
      const application = createApplication();
      application.setErrorHandler(nativeHandler);
      await application.register(elyum(), { onError });
      application.controller(TestController);

      // Act
      const response = await application.inject({
        method: 'GET',
        url: '/unhandled',
      });

      // Assert
      expect(onError).toHaveBeenCalledOnce();
      expect(nativeHandler).toHaveBeenCalledWith(
        failure,
        expect.anything(),
        expect.anything(),
      );
      expect(response.statusCode).toBe(500);
    });

    it('should forward an error thrown by onError', async () => {
      // Arrange
      const replacement = new Error('replacement failure');
      const nativeHandler = vi.fn(
        (error: Error, _request, reply: FastifyReply) => {
          void reply.code(501).send({ message: error.message });
        },
      );

      @Get('/replacement')
      class TestController {
        execute() {
          throw new Error('original failure');
        }
      }
      const application = createApplication();
      application.setErrorHandler(nativeHandler);
      await application.register(elyum(), {
        onError: () => {
          throw replacement;
        },
      });
      application.controller(TestController);

      // Act
      const response = await application.inject({
        method: 'GET',
        url: '/replacement',
      });

      // Assert
      expect(nativeHandler).toHaveBeenCalledWith(
        replacement,
        expect.anything(),
        expect.anything(),
      );
      expect(response.statusCode).toBe(501);
    });

    it('should report a response conflict without sending twice', async () => {
      // Arrange
      let reportedError: unknown;

      @Get('/conflict')
      class TestController {
        execute(@Response() reply: FastifyReply) {
          void reply.code(202).send({ first: true });
          return { second: true };
        }
      }
      const application = createApplication();
      await application.register(elyum(), {
        onError: (error) => {
          reportedError = error;
        },
      });
      application.controller(TestController);

      // Act
      const response = await application.inject({
        method: 'GET',
        url: '/conflict',
      });

      // Assert
      expect(reportedError).toBeInstanceOf(ControllerExecutionError);
      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({ first: true });
    });

    it('should throw compilation errors while registering the controller', async () => {
      // Arrange
      class InvalidController {
        execute() {}
      }
      const application = createApplication();
      await application.register(elyum());

      // Act & Assert
      expect(() => application.controller(InvalidController)).toThrowError(
        expect.objectContaining({ reason: 'route_not_found' }),
      );
    });
  });
});

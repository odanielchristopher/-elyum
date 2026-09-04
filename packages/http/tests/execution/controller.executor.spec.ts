import { IValidator, ValidationError } from '@elyum/validation';
import { describe, expect, it, vi } from 'vitest';

import {
  Body,
  compileController,
  ControllerExecutionError,
  createParamDecorator,
  executeController,
  Get,
  Headers,
  HttpExecutionContext,
  httpResult,
  Param,
  Post,
  Query,
  Request,
  Response,
} from '@elyum/http';

function createRequest<TRequest extends object>(raw: TRequest) {
  return {
    body: { name: 'Elyum' },
    query: { page: '2' },
    params: { id: 'user-id' },
    headers: { authorization: 'Bearer token' },
    method: 'POST',
    url: '/users/user-id?page=2',
    raw,
  };
}

describe('executeController()', () => {
  it('should resolve a controller asynchronously and preserve its this binding', async () => {
    // Arrange
    @Get('/users')
    class TestController {
      readonly value = 'resolved';

      execute() {
        return this.value;
      }
    }
    const compiled = compileController(TestController);
    let requestSeenByResolver: unknown;

    // Act
    const result = await executeController(compiled, {
      request: createRequest({ framework: 'test' }),
      response: {},
      resolveController: async () => {
        requestSeenByResolver = HttpExecutionContext.getRequest();
        return new TestController();
      },
      isResponseSent: () => false,
    });

    // Assert
    expect(result).toEqual({
      kind: 'automatic',
      statusCode: 200,
      body: 'resolved',
    });
    expect(requestSeenByResolver).toEqual({ framework: 'test' });
  });

  it('should inject every built-in source and preserve undecorated positions', async () => {
    // Arrange
    const nativeRequest = { framework: 'request' };
    const nativeResponse = { framework: 'response' };

    @Post('/users/:id')
    class TestController {
      execute(
        @Body('name') body: string,
        @Query('page') page: number,
        @Param('id') id: string,
        @Headers('authorization') authorization: string,
        _undecorated: unknown,
        @Request() request: unknown,
        @Response() response: unknown,
      ) {
        return {
          body,
          page,
          id,
          authorization,
          undecorated: _undecorated,
          request,
          response,
        };
      }
    }

    // Act
    const result = await executeController(compileController(TestController), {
      request: createRequest(nativeRequest),
      response: nativeResponse,
      resolveController: () => new TestController(),
      isResponseSent: () => false,
    });

    // Assert
    expect(result).toEqual({
      kind: 'automatic',
      statusCode: 201,
      body: {
        body: 'Elyum',
        page: '2',
        id: 'user-id',
        authorization: 'Bearer token',
        undecorated: undefined,
        request: nativeRequest,
        response: nativeResponse,
      },
    });
  });

  it('should resolve custom parameter factories sequentially by index', async () => {
    // Arrange
    const events: string[] = [];
    const First = createParamDecorator({
      factory: async () => {
        events.push('first:start');
        await Promise.resolve();
        events.push('first:end');
        return 'first';
      },
    });
    const Second = createParamDecorator({
      factory: () => {
        events.push('second');
        return 'second';
      },
    });

    @Get('/ordered')
    class TestController {
      execute(@First() first: string, @Second() second: string) {
        return [first, second];
      }
    }

    // Act
    const result = await executeController(compileController(TestController), {
      request: createRequest({}),
      response: {},
      resolveController: () => new TestController(),
      isResponseSent: () => false,
    });

    // Assert
    expect(events).toEqual(['first:start', 'first:end', 'second']);
    expect(result).toMatchObject({ body: ['first', 'second'] });
  });

  it('should await a custom validator after its parameter factory', async () => {
    // Arrange
    const validator: IValidator<unknown, string> = {
      async parse(value) {
        return String(value).toUpperCase();
      },
    };
    const ValidatedBody = createParamDecorator<
      undefined,
      unknown,
      { name: string }
    >({
      source: 'body',
      factory: (body) => body.name,
    });

    @Post('/users')
    class TestController {
      execute(@ValidatedBody(validator) name: string) {
        return name;
      }
    }

    // Act
    const result = await executeController(compileController(TestController), {
      request: createRequest({}),
      response: {},
      resolveController: () => new TestController(),
      isResponseSent: () => false,
    });

    // Assert
    expect(result).toMatchObject({ body: 'ELYUM' });
  });

  it('should inject and validate the complete route parameters object', async () => {
    // Arrange
    const validator: IValidator<Record<string, string>, string> = {
      parse(params) {
        return `${params.userId}:${params.postId}`;
      },
    };

    @Get('/users/:userId/posts/:postId')
    class TestController {
      execute(@Param(validator) routeKey: string) {
        return routeKey;
      }
    }

    // Act
    const result = await executeController(compileController(TestController), {
      request: {
        ...createRequest({}),
        params: { userId: 'user-1', postId: 'post-2' },
      },
      response: {},
      resolveController: () => new TestController(),
      isResponseSent: () => false,
    });

    // Assert
    expect(result).toMatchObject({ body: 'user-1:post-2' });
  });

  it('should preserve errors from resolvers, factories, validators, and handlers', async () => {
    // Arrange
    const failures = [
      new Error('resolver failure'),
      new Error('factory failure'),
      new ValidationError('Validation failed', []),
      new Error('handler failure'),
    ];
    const FactoryFailure = createParamDecorator({
      factory: () => {
        throw failures[1];
      },
    });
    const ValidatorFailure = createParamDecorator({
      factory: () => 'value',
    });
    const validator: IValidator = {
      parse: () => {
        throw failures[2];
      },
    };

    @Get('/errors')
    class ResolverController {
      execute() {}
    }
    @Get('/errors')
    class FactoryController {
      execute(@FactoryFailure() _value: unknown) {}
    }
    @Get('/errors')
    class ValidatorController {
      execute(@ValidatorFailure(validator) _value: unknown) {}
    }
    @Get('/errors')
    class HandlerController {
      execute() {
        throw failures[3];
      }
    }
    const baseOptions = {
      request: createRequest({}),
      response: {},
      isResponseSent: () => false,
    };

    // Act & Assert
    await expect(
      executeController(compileController(ResolverController), {
        ...baseOptions,
        resolveController: () => {
          throw failures[0];
        },
      }),
    ).rejects.toBe(failures[0]);
    await expect(
      executeController(compileController(FactoryController), {
        ...baseOptions,
        resolveController: () => new FactoryController(),
      }),
    ).rejects.toBe(failures[1]);
    await expect(
      executeController(compileController(ValidatorController), {
        ...baseOptions,
        resolveController: () => new ValidatorController(),
      }),
    ).rejects.toBe(failures[2]);
    await expect(
      executeController(compileController(HandlerController), {
        ...baseOptions,
        resolveController: () => new HandlerController(),
      }),
    ).rejects.toBe(failures[3]);
  });

  it('should expose native and normalized request data through the context', async () => {
    // Arrange
    const nativeRequest = { id: 'native-request' };
    const nativeResponse = { id: 'native-response' };

    @Get('/context')
    class TestController {
      execute() {
        return {
          request: HttpExecutionContext.getRequest(),
          response: HttpExecutionContext.getResponse(),
          data: HttpExecutionContext.getRequestData(),
        };
      }
    }
    const request = createRequest(nativeRequest);

    // Act
    const result = await executeController(compileController(TestController), {
      request,
      response: nativeResponse,
      resolveController: () => new TestController(),
      isResponseSent: () => false,
    });

    // Assert
    expect(result).toMatchObject({
      body: { request: nativeRequest, response: nativeResponse, data: request },
    });
  });

  it('should isolate execution contexts between concurrent requests', async () => {
    // Arrange
    let releaseFirst!: () => void;
    const firstCanFinish = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    @Get('/context')
    class TestController {
      async execute() {
        const initial = HttpExecutionContext.getRequest<{ id: string }>().id;
        if (initial === 'first') await firstCanFinish;
        return [initial, HttpExecutionContext.getRequest<{ id: string }>().id];
      }
    }
    const compiled = compileController(TestController);
    const execute = (id: string) =>
      executeController(compiled, {
        request: createRequest({ id }),
        response: {},
        resolveController: () => new TestController(),
        isResponseSent: () => false,
      });

    // Act
    const first = execute('first');
    const second = await execute('second');
    releaseFirst();

    // Assert
    await expect(first).resolves.toMatchObject({ body: ['first', 'first'] });
    expect(second).toMatchObject({ body: ['second', 'second'] });
  });

  it('should normalize marked results and treat structural lookalikes as bodies', async () => {
    // Arrange
    @Get('/marked')
    class MarkedController {
      execute() {
        return httpResult({
          statusCode: 202,
          headers: { location: '/jobs/1' },
          body: { id: 1 },
        });
      }
    }
    @Get('/body')
    class BodyController {
      execute() {
        return { statusCode: 418, message: 'body value' };
      }
    }
    const options = {
      request: createRequest({}),
      response: {},
      isResponseSent: () => false,
    };

    // Act
    const marked = await executeController(
      compileController(MarkedController),
      {
        ...options,
        resolveController: () => new MarkedController(),
      },
    );
    const body = await executeController(compileController(BodyController), {
      ...options,
      resolveController: () => new BodyController(),
    });

    // Assert
    expect(marked).toEqual({
      kind: 'automatic',
      statusCode: 202,
      headers: { location: '/jobs/1' },
      body: { id: 1 },
    });
    expect(body).toEqual({
      kind: 'automatic',
      statusCode: 200,
      body: { statusCode: 418, message: 'body value' },
    });
  });

  it('should use the default status for an undefined unsent response', async () => {
    // Arrange
    @Post('/users')
    class TestController {
      execute() {}
    }

    // Act
    const result = await executeController(compileController(TestController), {
      request: createRequest({}),
      response: {},
      resolveController: () => new TestController(),
      isResponseSent: () => false,
    });

    // Assert
    expect(result).toEqual({
      kind: 'automatic',
      statusCode: 201,
      body: undefined,
    });
  });

  it('should return manual mode when the native response was sent', async () => {
    // Arrange
    const response = { sent: false };

    @Get('/manual')
    class TestController {
      execute(@Response() nativeResponse: typeof response) {
        nativeResponse.sent = true;
      }
    }

    // Act
    const result = await executeController(compileController(TestController), {
      request: createRequest({}),
      response,
      resolveController: () => new TestController(),
      isResponseSent: (candidate) => candidate.sent,
    });

    // Assert
    expect(result).toEqual({ kind: 'manual' });
  });

  it('should reject a value returned after sending the native response', async () => {
    // Arrange
    const response = { sent: false };

    @Get('/conflict')
    class TestController {
      execute(@Response() nativeResponse: typeof response) {
        nativeResponse.sent = true;
        return { duplicated: true };
      }
    }

    // Act & Assert
    await expect(
      executeController(compileController(TestController), {
        request: createRequest({}),
        response,
        resolveController: () => new TestController(),
        isResponseSent: (candidate) => candidate.sent,
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        reason: 'response_conflict',
        message: expect.stringContaining('Either send'),
      }),
    );
  });

  it('should reject incompatible values returned by the controller resolver', async () => {
    // Arrange
    @Get('/invalid')
    class TestController {
      execute() {}
    }
    const compiled = compileController(TestController);
    const baseOptions = {
      request: createRequest({}),
      response: {},
      isResponseSent: () => false,
    };

    // Act & Assert
    await expect(
      executeController(compiled, {
        ...baseOptions,
        resolveController: () => null as unknown as TestController,
      }),
    ).rejects.toBeInstanceOf(ControllerExecutionError);
    await expect(
      executeController(compiled, {
        ...baseOptions,
        resolveController: () => ({}) as TestController,
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        reason: 'handler_not_found',
        controllerName: 'TestController',
        method: 'GET',
        path: '/invalid',
        message: expect.stringContaining("'execute' method"),
      }),
    );
  });

  it('should not read reflection metadata after compilation', async () => {
    // Arrange
    @Get('/compiled')
    class TestController {
      execute() {
        return 'compiled';
      }
    }
    const compiled = compileController(TestController);
    const metadataSpy = vi.spyOn(Reflect, 'getMetadata');
    const ownMetadataSpy = vi.spyOn(Reflect, 'getOwnMetadata');

    // Act
    await executeController(compiled, {
      request: createRequest({}),
      response: {},
      resolveController: () => new TestController(),
      isResponseSent: () => false,
    });

    // Assert
    expect(metadataSpy).not.toHaveBeenCalled();
    expect(ownMetadataSpy).not.toHaveBeenCalled();
  });
});

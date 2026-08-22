import {
  compileController,
  Delete,
  Get,
  Head,
  HttpMethod,
  Options,
  Patch,
  Post,
  Put,
  Route,
} from '@elyum/http';
import { describe, expect, it } from 'vitest';

describe('route decorators', () => {
  it.each([
    ['GET', Get],
    ['POST', Post],
    ['PUT', Put],
    ['PATCH', Patch],
    ['DELETE', Delete],
    ['HEAD', Head],
    ['OPTIONS', Options],
  ] as const)('should compile @%s metadata', (method, decorator) => {
    // Arrange
    class TestController {
      execute() {}
    }
    decorator('/unchanged/:id')(TestController);

    // Act
    const compiled = compileController(TestController);

    // Assert
    expect(compiled.method).toBe(method);
    expect(compiled.path).toBe('/unchanged/:id');
  });

  it('should use the root path by default', () => {
    // Arrange
    @Get()
    class TestController {
      execute() {}
    }

    // Act
    const compiled = compileController(TestController);

    // Assert
    expect(compiled.path).toBe('/');
  });

  it('should compile generic @Route metadata', () => {
    // Arrange
    @Route({ method: 'POST', path: '/users', handler: 'run' })
    class TestController {
      run() {}
    }

    // Act
    const compiled = compileController(TestController);

    // Assert
    expect(compiled).toMatchObject({
      method: 'POST' satisfies HttpMethod,
      path: '/users',
      handlerName: 'run',
      defaultStatusCode: 201,
    });
  });
});

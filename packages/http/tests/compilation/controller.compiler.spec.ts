import { describe, expect, it, vi } from 'vitest';

import {
  Body,
  compileController as compileControllerFunction,
  CONTROLLER_ROUTES_METADATA_KEY,
  ControllerCompilationError,
  ControllerCompiler,
  createParamDecorator,
  Get,
  Post,
  Query,
  ROUTE_PARAMS_METADATA_KEY,
} from '@elyum/http';

const compileWithClass: typeof compileControllerFunction = (
  controllerClass,
  options,
) => new ControllerCompiler(options).compile(controllerClass);

describe.each([
  {
    name: 'compileController()',
    compileController: compileControllerFunction,
  },
  {
    name: 'ControllerCompiler.compile()',
    compileController: compileWithClass,
  },
])('$name', ({ compileController }) => {
  describe('handler selection', () => {
    it('should prefer the route handler over the global option', () => {
      // Arrange
      @Get('/users', { handler: 'run' })
      class TestController {
        run() {}
        configured() {}
      }

      // Act
      const compiled = compileController(TestController, {
        controllerMethod: 'configured',
      });

      // Assert
      expect(compiled.handlerName).toBe('run');
    });

    it('should use the globally configured handler', () => {
      // Arrange
      @Get('/users')
      class TestController {
        run() {}
      }

      // Act
      const compiled = compileController(TestController, {
        controllerMethod: 'run',
      });

      // Assert
      expect(compiled.handlerName).toBe('run');
    });

    it('should use the conventional execute handler', () => {
      // Arrange
      @Get('/users')
      class TestController {
        execute() {}
      }

      // Act
      const compiled = compileController(TestController);

      // Assert
      expect(compiled.handlerName).toBe('execute');
    });

    it('should use the conventional handler method', () => {
      // Arrange
      @Get('/users')
      class TestController {
        handler() {}
      }

      // Act
      const compiled = compileController(TestController);

      // Assert
      expect(compiled.handlerName).toBe('handler');
    });

    it('should reject ambiguous conventional handlers with a resolution', () => {
      // Arrange
      @Get('/users')
      class AmbiguousController {
        execute() {}
        handler() {}
      }

      // Act & Assert
      expect(() => compileController(AmbiguousController)).toThrowError(
        expect.objectContaining({
          reason: 'ambiguous_handler',
          message: expect.stringContaining('configure'),
        }),
      );
    });

    it('should reject a configured handler that does not exist', () => {
      // Arrange
      @Get('/users')
      class MissingHandlerController {}

      // Act & Assert
      expect(() =>
        compileController(MissingHandlerController, {
          controllerMethod: 'run',
        }),
      ).toThrowError(
        expect.objectContaining({
          reason: 'handler_not_found',
          message: expect.stringContaining("Add a 'run' method"),
        }),
      );
    });

    it('should reject a controller without a supported handler', () => {
      // Arrange
      @Get('/users')
      class MissingHandlerController {}

      // Act & Assert
      expect(() => compileController(MissingHandlerController)).toThrowError(
        expect.objectContaining({
          reason: 'handler_not_found',
          message: expect.stringContaining('controllerMethod'),
        }),
      );
    });
  });

  describe('route validation', () => {
    it('should reject a controller without route metadata', () => {
      // Arrange
      class MissingRouteController {
        execute() {}
      }

      // Act & Assert
      expect(() => compileController(MissingRouteController)).toThrowError(
        expect.objectContaining({
          reason: 'route_not_found',
          message: expect.stringContaining('Add @Route()'),
        }),
      );
    });

    it('should reject multiple route decorators', () => {
      // Arrange
      @Get('/users')
      @Post('/users')
      class MultipleRoutesController {
        execute() {}
      }

      // Act & Assert
      expect(() => compileController(MultipleRoutesController)).toThrowError(
        expect.objectContaining({
          reason: 'multiple_routes',
          message: expect.stringContaining('Keep only one'),
        }),
      );
    });

    it('should reject invalid runtime route metadata', () => {
      // Arrange
      class InvalidRouteController {
        execute() {}
      }
      Reflect.defineMetadata(
        CONTROLLER_ROUTES_METADATA_KEY,
        [{ method: 'INVALID', path: '' }],
        InvalidRouteController,
      );

      // Act & Assert
      expect(() => compileController(InvalidRouteController)).toThrowError(
        expect.objectContaining({ reason: 'invalid_route' }),
      );
    });
  });

  describe('parameter metadata', () => {
    it('should sort built-in and custom parameters by index', () => {
      // Arrange
      const ActiveUser = createParamDecorator<undefined, string>({
        source: 'custom',
        factory: () => 'user-id',
      });

      @Post('/users')
      class TestController {
        execute(
          @Query('page') _page: number,
          @Body() _body: unknown,
          @ActiveUser() _userId: string,
        ) {}
      }

      // Act
      const compiled = compileController(TestController);

      // Assert
      expect(
        compiled.params.map(({ index, type }) => ({ index, type })),
      ).toEqual([
        { index: 0, type: 'query' },
        { index: 1, type: 'body' },
        { index: 2, type: 'custom' },
      ]);
    });

    it('should reject duplicate parameter indexes', () => {
      // Arrange
      @Post('/users')
      class DuplicateParamController {
        execute(@Body() @Query() _value: unknown) {}
      }

      // Act & Assert
      expect(() => compileController(DuplicateParamController)).toThrowError(
        expect.objectContaining({
          reason: 'duplicate_param_index',
          message: expect.stringContaining('Keep exactly one'),
        }),
      );
    });

    it('should reject malformed parameter metadata', () => {
      // Arrange
      @Get('/users')
      class InvalidParamController {
        execute() {}
      }
      Reflect.defineMetadata(
        ROUTE_PARAMS_METADATA_KEY,
        [{ index: -1, type: 'unknown' }],
        InvalidParamController.prototype,
        'execute',
      );

      // Act & Assert
      expect(() => compileController(InvalidParamController)).toThrowError(
        expect.objectContaining({ reason: 'invalid_param_metadata' }),
      );
    });
  });

  it('should return immutable precompiled metadata', () => {
    // Arrange
    @Get('/users')
    class TestController {
      execute(@Query('page') _page: number) {}
    }

    // Act
    const compiled = compileController(TestController);
    vi.restoreAllMocks();
    const getMetadataSpy = vi.spyOn(Reflect, 'getMetadata');
    const getOwnMetadataSpy = vi.spyOn(Reflect, 'getOwnMetadata');
    void compiled.method;
    void compiled.handlerName;
    void compiled.params[0]?.type;

    // Assert
    expect(Object.isFrozen(compiled)).toBe(true);
    expect(Object.isFrozen(compiled.params)).toBe(true);
    expect(Object.isFrozen(compiled.params[0])).toBe(true);
    expect(getMetadataSpy).not.toHaveBeenCalled();
    expect(getOwnMetadataSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should expose a stable compilation error code', () => {
    // Arrange
    class TestController {}

    // Act
    const compile = () => compileController(TestController);

    // Assert
    expect(compile).toThrow(ControllerCompilationError);
    expect(compile).toThrowError(
      expect.objectContaining({
        code: 'ELYUM_HTTP_CONTROLLER_COMPILATION',
      }),
    );
  });
});

describe('ControllerCompiler configuration', () => {
  it('should reuse constructor options across multiple compilations', () => {
    // Arrange
    @Get('/first')
    class FirstController {
      run() {}
    }
    @Get('/second')
    class SecondController {
      run() {}
    }
    const compiler = new ControllerCompiler({ controllerMethod: 'run' });

    // Act
    const first = compiler.compile(FirstController);
    const second = compiler.compile(SecondController);

    // Assert
    expect(first.handlerName).toBe('run');
    expect(second.handlerName).toBe('run');
  });

  it('should isolate compiler instances with different options', () => {
    // Arrange
    @Get('/users')
    class TestController {
      execute() {}
      run() {}
    }
    const conventionalCompiler = new ControllerCompiler();
    const configuredCompiler = new ControllerCompiler({
      controllerMethod: 'run',
    });

    // Act
    const conventional = conventionalCompiler.compile(TestController);
    const configured = configuredCompiler.compile(TestController);

    // Assert
    expect(conventional.handlerName).toBe('execute');
    expect(configured.handlerName).toBe('run');
  });

  it('should copy constructor options instead of retaining a mutable reference', () => {
    // Arrange
    @Get('/users')
    class TestController {
      run() {}
    }
    const options = { controllerMethod: 'run' };
    const compiler = new ControllerCompiler(options);
    options.controllerMethod = 'missing';

    // Act
    const compiled = compiler.compile(TestController);

    // Assert
    expect(compiled.handlerName).toBe('run');
  });

  it('should remain equivalent to the functional wrapper', () => {
    // Arrange
    @Post('/users')
    class TestController {
      execute(@Body() _body: unknown) {}
    }

    // Act
    const fromClass = new ControllerCompiler().compile(TestController);
    const fromFunction = compileControllerFunction(TestController);

    // Assert
    expect(fromClass).toEqual(fromFunction);
  });
});

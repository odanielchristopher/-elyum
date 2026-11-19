import { Inject, Injectable, ElyumFactory } from '@elyum/core';
import {
  Body,
  createParamDecorator,
  Get,
  Headers,
  HttpExecutionContext,
  httpResult,
  Param,
  Post,
  Query,
  Request,
  Response,
  Route,
  UnauthorizedException,
} from '@elyum/http';
import { ValidationError } from '@elyum/validation';
import { yupValidator } from '@elyum/validation-yup';
import express, {
  Router,
  type ErrorRequestHandler,
  type NextFunction,
  type Request as NativeRequest,
  type RequestHandler,
  type Response as NativeResponse,
} from 'express';
import { describe, expect, it, vi } from 'vitest';
import * as yup from 'yup';

import elyum, { ExpressAdapterConfigurationError, Next } from '@elyum/express';

import { request, serve } from './helpers/server.helper';

describe('validation error confidentiality', () => {
  it('should not send sensitive Yup inputs in the default response', async () => {
    const secrets = [
      'password-example-secret',
      'token-example-secret',
      'authorization-example-secret',
      'nested-example-secret',
    ];
    const validator = yupValidator(
      yup.object({
        password: yup.number(),
        token: yup.number(),
        authorization: yup.number(),
        nested: yup.object({ secret: yup.number() }),
      }),
    );
    @Post('/sensitive')
    class Controller {
      execute(@Body(validator) body: unknown) {
        return body;
      }
    }
    const app = elyum(express(), { json: {} });
    app.controller(Controller);
    app.use(app.elyum.errorHandler());
    const response = await request(`${await serve(app)}/sensitive`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        password: secrets[0],
        token: secrets[1],
        authorization: secrets[2],
        nested: { secret: secrets[3] },
      }),
    });
    expect(response.status).toBe(400);
    const body = await response.text();
    expect(JSON.parse(body).errors).toHaveLength(4);
    for (const secret of secrets) expect(body).not.toContain(secret);
  });
});

describe('@elyum/express native registration', () => {
  it('should preserve identity, native methods, callable Router and chaining', async () => {
    const native = express();
    const nativeUse = native.use;
    const app = elyum(native);
    const router = Router({ mergeParams: true });
    const routes = elyum(router);
    @Get('/items/:id')
    class Controller {
      execute(@Param() params: unknown) {
        return params;
      }
    }
    expect(app).toBe(native);
    expect(app.use).toBe(nativeUse);
    expect(elyum(app)).toBe(app);
    expect(routes).toBe(router);
    expect(typeof routes).toBe('function');
    expect(routes.controller(Controller)).toBe(routes);
    app.use('/shops/:shop', routes);
    app.get('/native', (_req, res) => {
      res.json({ native: true });
    });
    const base = await serve(app);
    expect(await (await request(`${base}/shops/one/items/two`)).json()).toEqual(
      { shop: 'one', id: 'two' },
    );
    expect(await (await request(`${base}/native`)).json()).toEqual({
      native: true,
    });
  });

  it.each([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
  ] as const)(
    'should register native %s routes from immutable compiled metadata',
    async (method) => {
      @Route({ method, path: '/method' })
      class Controller {
        execute() {
          return httpResult({ statusCode: 202, body: { method } });
        }
      }
      const app = elyum(express());
      app.controller(Controller);
      // Removing reflection metadata after registration must not affect execution.
      Reflect.deleteMetadata('http:controller:routes', Controller);
      const res = await request(`${await serve(app)}/method`, { method });
      expect(res.status).toBe(202);
      if (method === 'HEAD') {
        expect(await res.text()).toBe('');
      } else {
        expect(await res.json()).toEqual({ method });
      }
    },
  );

  it('should reject invalid declarations, ambiguous methods, collisions and reconfiguration at startup', () => {
    @Get('/one')
    class First {
      execute() {}
    }
    @Get('/two')
    class Second {
      execute() {}
    }
    @Get('/ambiguous')
    class Ambiguous {
      execute() {}
      handler() {}
    }
    const app = elyum(express());
    expect(() => app.controller()).toThrow('exactly one');
    expect(() => app.controller(First, Second)).toThrow('exactly one');
    expect(() => app.controller(Ambiguous)).toThrow(
      "both 'execute' and 'handler'",
    );
    expect(() => elyum(app, {})).toThrow('already installed');
    const conflicting = express();
    Object.defineProperty(conflicting, 'controller', { value: 'owned' });
    expect(() => elyum(conflicting)).toThrow(ExpressAdapterConfigurationError);
    expect(
      Object.getOwnPropertyDescriptor(conflicting, 'controller')?.value,
    ).toBe('owned');
    expect(() => elyum(Object.freeze(Router()))).toThrow('not extensible');
  });

  it('should honor configured handler selection and decorator precedence', async () => {
    @Get('/configured')
    class Configured {
      run() {
        return 'run';
      }
    }
    @Get('/override', { handler: 'other' })
    class Override {
      other() {
        return 'other';
      }
    }
    const app = elyum(express(), { controllerMethod: 'run' });
    app.controller(Configured).controller(Override);
    const base = await serve(app);
    expect(await (await request(`${base}/configured`)).text()).toBe('run');
    expect(await (await request(`${base}/override`)).text()).toBe('other');
  });
});

describe('native request mapping and responses', () => {
  it('should inject and validate each source once while preserving native identity', async () => {
    const parse = vi.fn((value: unknown) => String(value).toUpperCase());
    let nativeRequest: unknown;
    let nativeResponse: unknown;
    const capture: RequestHandler = (req, res, next) => {
      nativeRequest = req;
      nativeResponse = res;
      next();
    };
    @Post('/values/:id')
    class Controller {
      async execute(
        @Body('name', { parse }) name: string,
        @Query('page') page: string,
        @Param('id') id: string,
        @Headers('x-test') header: string,
        @Request() req: NativeRequest,
        @Response() res: NativeResponse,
      ) {
        expect(req).toBe(nativeRequest);
        expect(res).toBe(nativeResponse);
        expect(HttpExecutionContext.getRequest()).toBe(req);
        expect(HttpExecutionContext.getResponse()).toBe(res);
        expect(HttpExecutionContext.getRequestData().url).toBe(
          '/api/values/item?page=2',
        );
        return { name, page, id, header };
      }
    }
    const app = elyum(express(), { json: {} });
    const routes = elyum(Router());
    routes.controller(capture, Controller);
    app.use('/api', routes);
    const res = await request(`${await serve(app)}/api/values/item?page=2`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test': 'native' },
      body: JSON.stringify({ name: 'elyum' }),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      name: 'ELYUM',
      page: '2',
      id: 'item',
      header: 'native',
    });
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('should apply status and multiple headers and preserve explicit empty/default responses', async () => {
    @Get('/result')
    class Result {
      execute() {
        return httpResult({
          statusCode: 202,
          headers: { 'x-value': 'yes', 'set-cookie': ['a=1', 'b=2'] },
          body: { accepted: true },
        });
      }
    }
    @Post('/empty')
    class Empty {
      execute() {}
    }
    @Get('/no-content')
    class NoContent {
      execute() {
        return httpResult({ statusCode: 204 });
      }
    }
    const app = elyum(express());
    app.controller(Result).controller(Empty).controller(NoContent);
    const base = await serve(app);
    const res = await request(`${base}/result`);
    expect(res.status).toBe(202);
    expect(res.headers.get('x-value')).toBe('yes');
    expect(res.headers.getSetCookie()).toEqual(['a=1', 'b=2']);
    expect(await res.json()).toEqual({ accepted: true });
    const empty = await request(`${base}/empty`, { method: 'POST' });
    expect(empty.status).toBe(201);
    expect(await empty.text()).toBe('');
    const noContent = await request(`${base}/no-content`);
    expect(noContent.status).toBe(204);
    expect(await noContent.text()).toBe('');
  });

  it('should preserve manual redirects and partially sent native responses', async () => {
    @Get('/redirect')
    class Redirect {
      execute(@Response() res: NativeResponse) {
        res.redirect('/target');
      }
    }
    @Get('/stream')
    class Stream {
      execute(@Response() res: NativeResponse) {
        res.write('first');
        queueMicrotask(() => res.end('second'));
      }
    }
    const app = elyum(express());
    app.controller(Redirect).controller(Stream);
    const base = await serve(app);
    const redirect = await request(`${base}/redirect`, { redirect: 'manual' });
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get('location')).toBe('/target');
    expect(await (await request(`${base}/stream`)).text()).toBe('firstsecond');
  });

  it('should leave JSON disabled by default and install it at the explicit position with native options', async () => {
    @Post('/body')
    class BodyController {
      execute(@Body() body: unknown) {
        return { body: body ?? null };
      }
    }
    const plain = elyum(express());
    plain.controller(BodyController);
    const parsed = express();
    const order: string[] = [];
    parsed.use((_req, _res, next) => {
      order.push('before-parser');
      next();
    });
    const app = elyum(parsed, {
      json: {
        limit: '32b',
        verify: () => {
          order.push('parser');
        },
      },
    });
    app.controller(BodyController);
    app.use(app.elyum.errorHandler());
    const init = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"ok":true}',
    };
    expect(
      await (await request(`${await serve(plain)}/body`, init)).json(),
    ).toEqual({ body: null });
    const base = await serve(app);
    expect(await (await request(`${base}/body`, init)).json()).toEqual({
      body: { ok: true },
    });
    expect(order).toEqual(['before-parser', 'parser']);
    expect(
      (
        await request(`${base}/body`, {
          ...init,
          body: JSON.stringify({ value: 'x'.repeat(40) }),
        })
      ).status,
    ).toBe(500);
  });
});

describe('Express continuation', () => {
  it.each([false, true])(
    'should preserve declared middleware order with async=%s',
    async (asyncHandler) => {
      const order: string[] = [];
      @Get('/continue')
      class Controller {
        async execute(
          @Next() next: NextFunction,
          @Response() res: NativeResponse,
        ) {
          if (asyncHandler) {
            await Promise.resolve();
          }
          order.push('controller');
          res.locals.value = 42;
          next();
          order.push('after-next');
        }
      }
      const before: RequestHandler = (_req, _res, next) => {
        order.push('before');
        next();
      };
      const after: RequestHandler = (_req, res) => {
        order.push('after');
        res.json({ value: res.locals.value });
      };
      const app = elyum(express());
      app.controller(before, Controller, after);
      const res = await request(`${await serve(app)}/continue`);
      expect(await res.json()).toEqual({ value: 42 });
      expect(order).toEqual(['before', 'controller', 'after', 'after-next']);
    },
  );

  it('should not continue merely because @Next is injected', async () => {
    @Get('/terminal')
    class Controller {
      execute(@Next() _next: NextFunction) {
        return 'terminal';
      }
    }
    const after = vi.fn<RequestHandler>();
    const app = elyum(express());
    app.controller(Controller, after);
    expect(await (await request(`${await serve(app)}/terminal`)).text()).toBe(
      'terminal',
    );
    expect(after).not.toHaveBeenCalled();
  });

  it('should allow a native manual response followed by next', async () => {
    @Get('/manual')
    class Controller {
      execute(@Response() res: NativeResponse, @Next() next: NextFunction) {
        res.send('sent');
        next();
      }
    }
    const observed = Promise.withResolvers<void>();
    const after: RequestHandler = (_req, res) => {
      expect(res.headersSent).toBe(true);
      observed.resolve();
    };
    const app = elyum(express());
    app.controller(Controller, after);
    expect(await (await request(`${await serve(app)}/manual`)).text()).toBe(
      'sent',
    );
    await observed.promise;
  });

  it.each(['route', 'router'] as const)(
    'should preserve next(%s) native semantics',
    async (skip) => {
      @Get('/skip')
      class Controller {
        execute(@Next() next: NextFunction) {
          next(skip);
        }
      }
      const app = express();
      const routes = elyum(Router());
      routes.controller(Controller);
      routes.get('/skip', (_req, res) => {
        res.send('same-router');
      });
      app.use('/api', routes);
      app.get('/api/skip', (_req, res) => {
        res.send('outside-router');
      });
      expect(await (await request(`${await serve(app)}/api/skip`)).text()).toBe(
        skip === 'route' ? 'same-router' : 'outside-router',
      );
    },
  );

  it('should forward the original delegated error once', async () => {
    const original = new Error('original');
    const errors: unknown[] = [];
    @Get('/error')
    class Controller {
      execute(@Next() next: NextFunction) {
        next(original);
      }
    }
    const app = elyum(express());
    app.controller(Controller);
    const handle: ErrorRequestHandler = (error, _req, res, _next) => {
      errors.push(error);
      res.status(418).end();
    };
    app.use(handle);
    expect((await request(`${await serve(app)}/error`)).status).toBe(418);
    expect(errors).toEqual([original]);
  });

  it.each(['return', 'throw', 'send-return'] as const)(
    'should diagnose %s conflicts or failures without sending twice',
    async (mode) => {
      const original = new Error('late');
      const observed = Promise.withResolvers<unknown>();
      @Get('/late')
      class Controller {
        async execute(
          @Next() next: NextFunction,
          @Response() res: NativeResponse,
        ) {
          if (mode === 'send-return') {
            res.send('original');
          } else {
            next();
          }
          await Promise.resolve();
          if (mode === 'throw') {
            throw original;
          }
          return { unexpected: true };
        }
      }
      const app = elyum(express());
      const after: RequestHandler = (_req, res) => {
        res.send('original');
      };
      app.controller(Controller, after);
      const handle: ErrorRequestHandler = (error, _req, res, _next) => {
        observed.resolve(error);
        if (!res.headersSent) {
          res.status(500).end();
        }
      };
      app.use(app.elyum.errorHandler(), handle);
      expect(await (await request(`${await serve(app)}/late`)).text()).toBe(
        'original',
      );
      const error = await observed.promise;
      if (mode === 'throw') {
        expect(error).toBe(original);
      } else {
        expect(error).toMatchObject({
          reason: 'response_conflict',
          path: '/late',
        });
      }
    },
  );

  it('should capture continuation separately for overlapping controllers on the same request', async () => {
    @Get('/nested')
    class First {
      execute(@Next() next: NextFunction) {
        next('route');
      }
    }
    @Get('/nested')
    class Second {
      async execute(@Next() next: NextFunction) {
        await Promise.resolve();
        next();
      }
    }
    const app = elyum(express(), {
      resolveController: async (Controller) => {
        await Promise.resolve();
        return new Controller();
      },
    });
    app.controller(First);
    const finish: RequestHandler = (_req, res) => {
      res.send('second');
    };
    app.controller(Second, finish);
    expect(await (await request(`${await serve(app)}/nested`)).text()).toBe(
      'second',
    );
  });

  it('should isolate concurrent async contexts and continuations', async () => {
    const arrived = Promise.withResolvers<void>();
    let count = 0;
    @Get('/parallel/:id')
    class Controller {
      async execute(
        @Param('id') id: string,
        @Next() next: NextFunction,
        @Response() res: NativeResponse,
      ) {
        count++;
        if (count === 2) {
          arrived.resolve();
        }
        await arrived.promise;
        expect(HttpExecutionContext.getRequest<NativeRequest>().params.id).toBe(
          id,
        );
        res.locals.id = id;
        next();
      }
    }
    const app = elyum(express());
    const finish: RequestHandler = (_req, res) => {
      res.json({ id: res.locals.id });
    };
    app.controller(Controller, finish);
    const base = await serve(app);
    expect(
      await Promise.all(
        ['a', 'b'].map(async (id) =>
          (await request(`${base}/parallel/${id}`)).json(),
        ),
      ),
    ).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});

describe('native error middleware', () => {
  it('should preserve child controller context in parent application error middleware', async () => {
    const original = new Error('child');
    @Get('/child')
    class Controller {
      execute() {
        throw original;
      }
    }
    const app = elyum(express(), {
      onError: (error, context) => {
        expect(error).toBe(original);
        expect(context.controller?.controllerClass).toBe(Controller);
        context.response.status(422).end();
      },
    });
    const routes = elyum(Router());
    routes.controller(Controller);
    app.use('/api', routes);
    app.use(app.elyum.errorHandler());
    expect((await request(`${await serve(app)}/api/child`)).status).toBe(422);
  });

  it('should preserve validator and custom factory errors through the native pipeline', async () => {
    const unexpected = new Error('validator');
    const factoryError = new Error('factory');
    const FromFactory = createParamDecorator({
      factory: async () => {
        throw factoryError;
      },
    });
    const invalid = ValidationError.fromSingleError('name', 'Required');
    @Post('/validate')
    class ValidatorController {
      execute(
        @Body({
          parse: (input: unknown) => {
            if (input) {
              throw unexpected;
            }
            throw invalid;
          },
        })
        _body: unknown,
      ) {
        return 'unreachable';
      }
    }
    @Get('/factory')
    class FactoryController {
      execute(@FromFactory() _value: unknown) {}
    }
    const app = elyum(express(), { json: {} });
    app.controller(ValidatorController).controller(FactoryController);
    const errors: unknown[] = [];
    const handle: ErrorRequestHandler = (error, _req, res, _next) => {
      errors.push(error);
      res.status(422).end();
    };
    app.use(handle);
    const base = await serve(app);
    await request(`${base}/validate`, { method: 'POST' });
    await request(`${base}/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    await request(`${base}/factory`);
    expect(errors).toEqual([invalid, unexpected, factoryError]);
  });

  it('should let native middleware deny execution before the controller', async () => {
    const executed = vi.fn();
    @Get('/protected')
    class Controller {
      execute() {
        executed();
        return 'secret';
      }
    }
    const authenticate: RequestHandler = (_req, _res, next) => {
      next(new UnauthorizedException('Denied'));
    };
    const app = elyum(express());
    app.controller(authenticate, Controller);
    app.use(app.elyum.errorHandler());
    const res = await request(`${await serve(app)}/protected`);
    expect(res.status).toBe(401);
    expect(executed).not.toHaveBeenCalled();
  });

  it('should forward errors after headers are committed without invoking the callback', async () => {
    const original = new Error('after-headers');
    const onError = vi.fn();
    @Get('/committed')
    class Controller {
      execute(@Response() res: NativeResponse) {
        res.write('prefix');
        throw original;
      }
    }
    const app = elyum(express(), { onError });
    app.controller(Controller);
    const handle: ErrorRequestHandler = (error, _req, res, _next) => {
      expect(error).toBe(original);
      expect(res.headersSent).toBe(true);
      res.end('-suffix');
    };
    app.use(app.elyum.errorHandler(), handle);
    expect(await (await request(`${await serve(app)}/committed`)).text()).toBe(
      'prefix-suffix',
    );
    expect(onError).not.toHaveBeenCalled();
  });

  it.each(['validation', 'known', 'unknown'] as const)(
    'should use the safe fallback without a callback: %s',
    async (kind) => {
      const error =
        kind === 'validation'
          ? ValidationError.fromSingleError('name', 'Required')
          : kind === 'known'
            ? new UnauthorizedException('Denied')
            : new Error('SECRET');
      @Get('/fail')
      class Controller {
        execute() {
          throw error;
        }
      }
      const app = elyum(express());
      app.controller(Controller);
      app.use(app.elyum.errorHandler());
      const res = await request(`${await serve(app)}/fail`);
      expect(res.status).toBe(
        kind === 'validation' ? 400 : kind === 'known' ? 401 : 500,
      );
      const body = await res.json();
      expect(body.code).toBe(
        kind === 'validation'
          ? 'VALIDATION_ERROR'
          : kind === 'known'
            ? 'UNAUTHORIZED'
            : 'INTERNAL_SERVER_ERROR',
      );
      expect(JSON.stringify(body)).not.toContain('SECRET');
    },
  );

  it.each(['known', 'unknown'] as const)(
    'should delegate unanswered %s errors with identity and controller context',
    async (kind) => {
      const original =
        kind === 'known'
          ? new UnauthorizedException('Denied')
          : new Error('original');
      const seen: unknown[] = [];
      @Get('/fail')
      class Controller {
        execute() {
          throw original;
        }
      }
      const app = elyum(express(), {
        onError: async (error, context) => {
          await Promise.resolve();
          seen.push(error);
          expect(context.controller?.controllerClass).toBe(Controller);
        },
      });
      app.controller(Controller);
      const handle: ErrorRequestHandler = (error, _req, res, _next) => {
        seen.push(error);
        res.status(422).json({ native: true });
      };
      app.use(app.elyum.errorHandler(), handle);
      const res = await request(`${await serve(app)}/fail`);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({ native: true });
      expect(seen).toEqual([original, original]);
    },
  );

  it('should support an async callback sending the response and preserve thrown replacement errors', async () => {
    const replacement = new Error('replacement');
    @Get('/fail')
    class Controller {
      execute() {
        throw new Error('first');
      }
    }
    const app = elyum(express(), {
      onError: async (_error, { response, request: req }) => {
        await Promise.resolve();
        if (req.query.replace) {
          throw replacement;
        }
        response.status(409).json({ handled: true });
      },
    });
    app.controller(Controller);
    let seen: unknown;
    const handle: ErrorRequestHandler = (error, _req, res, _next) => {
      seen = error;
      res.status(418).end();
    };
    app.use(app.elyum.errorHandler(), handle);
    const base = await serve(app);
    const handled = await request(`${base}/fail`);
    expect(handled.status).toBe(409);
    expect(await handled.json()).toEqual({ handled: true });
    expect((await request(`${base}/fail?replace=1`)).status).toBe(418);
    expect(seen).toBe(replacement);
  });

  it('should receive parser and middleware errors without inventing controller context', async () => {
    const contexts: unknown[] = [];
    const app = elyum(express(), {
      json: {},
      onError: (error, context) => {
        contexts.push(context.controller);
        context.response.status(400).json({ name: (error as Error).name });
      },
    });
    @Post('/body')
    class Controller {
      execute() {
        return 'unreachable';
      }
    }
    app.controller(Controller);
    app.use(app.elyum.errorHandler());
    const res = await request(`${await serve(app)}/body`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid',
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ name: 'SyntaxError' });
    expect(contexts).toEqual([undefined]);
  });

  it('should delegate unknown errors natively when no Elyum error middleware is installed', async () => {
    const original = new Error('native');
    @Get('/fail')
    class Controller {
      execute() {
        throw original;
      }
    }
    const app = elyum(express());
    app.controller(Controller);
    let seen: unknown;
    const handle: ErrorRequestHandler = (error, _req, res, _next) => {
      seen = error;
      res.status(418).end();
    };
    app.use(handle);
    expect((await request(`${await serve(app)}/fail`)).status).toBe(418);
    expect(seen).toBe(original);
  });
});

describe('controller resolution', () => {
  it('should resolve fresh transient controllers and preserve existing singleton providers', async () => {
    let sequence = 0;
    @Get('/transient')
    class Transient {
      readonly id = ++sequence;
      execute() {
        return this.id;
      }
    }
    @Get('/singleton')
    class Singleton {
      readonly id = ++sequence;
      execute() {
        return this.id;
      }
    }
    const container = ElyumFactory.createRoot();
    container.register({
      token: Singleton,
      useClass: Singleton,
      scope: 'singleton',
    });
    const app = elyum(express(), { container });
    app.controller(Transient).controller(Singleton);
    expect(app.elyum.container).toBe(container);
    const base = await serve(app);
    const get = async (path: string) =>
      (await request(`${base}${path}`)).text();
    expect(await get('/transient')).not.toBe(await get('/transient'));
    expect(await get('/singleton')).toBe(await get('/singleton'));
  });

  it('should discover concrete dependencies while preserving application-owned values', async () => {
    const token = Symbol('value');
    @Injectable()
    class Dependency {
      constructor(@Inject(token) readonly value: string) {}
    }
    @Get('/di')
    class Controller {
      constructor(@Inject(Dependency) readonly dependency: Dependency) {}
      execute() {
        return { value: this.dependency.value };
      }
    }
    const container = ElyumFactory.createRoot();
    container.register({ token, useValue: 'owned' });
    // Vitest does not emit constructor metadata; production tsc does.
    Reflect.defineMetadata('design:paramtypes', [Object], Dependency);
    Reflect.defineMetadata('design:paramtypes', [Dependency], Controller);
    const app = elyum(express(), { container, autoRegisterDependencies: true });
    app.controller(Controller);
    expect(await (await request(`${await serve(app)}/di`)).json()).toEqual({
      value: 'owned',
    });
  });

  it('should leave discovery disabled and reject discovered or existing scoped dependencies before mutation', () => {
    @Injectable({ scope: 'scoped' })
    class Scoped {}
    @Get('/scope')
    class Controller {
      constructor(@Inject(Scoped) readonly dependency: Scoped) {}
      execute() {}
    }
    Reflect.defineMetadata('design:paramtypes', [Scoped], Controller);
    for (const existing of [false, true]) {
      const container = ElyumFactory.createRoot();
      if (existing) {
        container.register({
          token: Scoped,
          useClass: Scoped,
          scope: 'scoped',
        });
      }
      const app = elyum(express(), {
        container,
        autoRegisterDependencies: true,
      });
      expect(() => app.controller(Controller)).toThrow(/scoped/);
      expect(container.getProvider(Controller)).toBeUndefined();
    }
    @Injectable()
    class Missing {}
    @Get('/missing')
    class Plain {
      constructor(@Inject(Missing) readonly dependency: Missing) {}
      execute() {}
    }
    const app = elyum(express());
    Reflect.defineMetadata('design:paramtypes', [Missing], Plain);
    app.controller(Plain);
    expect(app.elyum.container?.getProvider(Missing)).toBeUndefined();
  });

  it.each([false, true])(
    'should support external resolution async=%s and preserve resolver failures',
    async (asyncResolver) => {
      const original = new Error('resolver');
      @Get('/resolved')
      class Controller {
        execute() {
          return 'external';
        }
      }
      @Get('/fail')
      class Failure {
        execute() {}
      }
      const app = elyum(express(), {
        resolveController: (Class) => {
          if (Class === Failure) {
            return Promise.reject(original);
          }
          const value = new Class();
          return asyncResolver ? Promise.resolve(value) : value;
        },
      });
      app.controller(Controller).controller(Failure);
      expect(app.elyum.container).toBeUndefined();
      let seen: unknown;
      const handle: ErrorRequestHandler = (error, _req, res, _next) => {
        seen = error;
        res.status(418).end();
      };
      app.use(handle);
      const base = await serve(app);
      expect(await (await request(`${base}/resolved`)).text()).toBe('external');
      expect((await request(`${base}/fail`)).status).toBe(418);
      expect(seen).toBe(original);
    },
  );

  it('should reject conflicting resolution strategies at runtime', () => {
    const container = ElyumFactory.createRoot();
    const resolveController = () => ({});
    // @ts-expect-error conflicting strategies must also fail at runtime
    expect(() => elyum(express(), { container, resolveController })).toThrow(
      'both container',
    );
    expect(() =>
      // @ts-expect-error discovery belongs to container modes
      elyum(express(), { resolveController, autoRegisterDependencies: false }),
    ).toThrow('dependency graph');
  });
});

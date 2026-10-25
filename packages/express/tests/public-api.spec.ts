import type { Constructor } from '@elyum/core';
import { Get } from '@elyum/http';
import express, {
  Router,
  type NextFunction,
  type RequestHandler,
} from 'express';
import { describe, expect, expectTypeOf, it } from 'vitest';

import elyum, {
  elyum as namedElyum,
  type ElyumExpress,
  type ElyumExpressOptions,
  Next,
} from '@elyum/express';

describe('@elyum/express public API', () => {
  it('should expose the factory, native target, decorator and typed native chaining', () => {
    @Get('/health')
    class Controller {
      execute() {
        return { ok: true };
      }
    }
    const app = elyum(express());
    const routes = elyum(Router());
    expect(namedElyum).toBe(elyum);
    expectTypeOf(Next()).toEqualTypeOf<ParameterDecorator>();
    expectTypeOf(app).toEqualTypeOf<ElyumExpress<ReturnType<typeof express>>>();
    app
      .get('/native/:id', (req, res) => {
        expectTypeOf(req.params.id).toEqualTypeOf<string>();
        res.json({ id: req.params.id });
      })
      .controller(Controller);
    app.use('/api', routes).controller(Controller);
    app.set('trust proxy', true).controller(Controller);
    const middleware: RequestHandler = (_request, _response, next) => {
      next();
    };
    routes
      .controller(middleware, Controller, middleware)
      .get('/native', (_req, res) => {
        res.end();
      });
    app.controller((_req, _res, next: NextFunction) => {
      next();
    }, Controller);
    expectTypeOf(app.listen).toBeFunction();
  });

  it('should retain resolver and parser types without permitting conflicting DI options', () => {
    const options: ElyumExpressOptions = {
      json: { limit: '1mb', strict: false },
      resolveController: <T extends object>(Controller: Constructor<T>) =>
        new Controller(),
    };
    expect(options.json?.strict).toBe(false);
    if (false) {
      // @ts-expect-error controller arguments must be functions or classes
      elyum(express()).controller(42);
      // @ts-expect-error parser options are native options, not arbitrary flags
      elyum(express(), { json: true });
      // @ts-expect-error external resolution cannot request automatic discovery
      const invalid: ElyumExpressOptions = {
        resolveController: () => ({}),
        autoRegisterDependencies: true,
      };
      void invalid;
    }
  });
});

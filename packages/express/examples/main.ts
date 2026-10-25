import 'reflect-metadata';

import { Injectable } from '@elyum/core';
import { Body, Get, Post, Response } from '@elyum/http';
import express, {
  Router,
  type NextFunction,
  type Response as NativeResponse,
} from 'express';

import elyum, { Next } from '@elyum/express';

@Injectable()
class EchoService {
  execute(body: unknown) {
    return { received: body };
  }
}

@Post('/echo')
class EchoController {
  constructor(private readonly service: EchoService) {}
  execute(@Body() body: unknown) {
    return this.service.execute(body);
  }
}

@Get('/health')
class HealthController {
  execute(@Response() response: NativeResponse, @Next() next: NextFunction) {
    response.locals.health = { status: 'ok' };
    next();
  }
}

const app = elyum(express(), { json: { limit: '1mb' } });
const routes = elyum(Router(), { autoRegisterDependencies: true });
app.controller(HealthController, (_request, response) => {
  response.json(response.locals.health);
});
routes.controller(EchoController);
routes.use(routes.elyum.errorHandler());
app.use('/api', routes);
app.use(app.elyum.errorHandler());

const server = app.listen(Number(process.env.PORT ?? 3000), '127.0.0.1');
const shutdown = () => {
  server.close();
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

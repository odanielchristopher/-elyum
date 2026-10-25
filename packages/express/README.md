# @elyum/express

Express 5 integration for Elyum controllers. The factory enriches your existing
app or Router without replacing it. Express still owns middleware, routing,
serialization and the server lifecycle.

```ts
import elyum, { Next } from '@elyum/express';
import { Get } from '@elyum/http';
import express, { type NextFunction } from 'express';

@Get('/health')
class HealthController {
  execute(@Next() next: NextFunction) {
    next();
  }
}

const app = elyum(express(), { json: { limit: '1mb' } });
app.controller(HealthController, (_request, response) => {
  response.json({ status: 'ok' });
});
app.use(app.elyum.errorHandler());
app.listen(3000);
```

## Registration and native behavior

`controller(...handlers)` requires exactly one class with an Elyum route
decorator, anywhere among native middleware. It compiles once during
registration, replaces that class at its declared position with a native
handler, and registers the method/path through Express. No reflection runs per
request. Native app/Router identity, methods and mount prefixes are preserved.
Existing `controller` or `elyum` properties are never overwritten.

Calling `elyum(target)` again reuses installation; passing new options is an
error. No global Express type augmentation is performed: only factory results
have the additional members in their public type.

`json` is opt-in and accepts native `express.json` options. Without it, no
parser is installed. Register middleware that must precede parsing before
calling the factory. There is no built-in CORS, logger or server creation.

## Results and continuation

Return a body (`201` for POST, `200` otherwise), return branded `httpResult`
for explicit status/headers, or send through native `@Response()` and return
void. Unsent `undefined` ends an empty response with the default status.
`res.headersSent || res.writableEnded` detects native manual responses.

`@Next()` is Express-specific. Calling it immediately delegates to native
`next()`, `next(error)`, `next('route')` or `next('router')` and prevents automatic
sending. Injection alone does not delegate. Return void after delegation;
returning a body as well is a conflict forwarded to the native error pipeline.
Downstream middleware may already have run, so conflicts cannot undo it.
Manual send followed by explicit next remains available. Call next within the
awaited controller execution; detached callbacks after completion are outside
the supported lifecycle. Multiple calls retain native behavior and are the
application's responsibility. No implicit next or positional warnings occur.

## Dependency injection

Installation supports an internal Elyum root, `{ container }` borrowed from the
application, or `{ resolveController }` with sync/async resolution. Strategies
are exclusive. Container modes register missing controllers as transient and
preserve existing providers. Borrowed containers are explicitly mutated at
registration; the adapter does not dispose or close them.

`autoRegisterDependencies: true` is optional and only available in container
modes. It discovers concrete injectable classes with singleton/transient
lifetimes, preserves existing providers and rejects reachable scoped providers.
Without discovery, the application owns its explicit graph; opaque factory or
external resolver scopes cannot be inspected. Request-scoped containers and
resource disposal are not supported. Independently installed app/Routers have
separate containers unless you explicitly supply the same container.

## Errors

Install `target.elyum.errorHandler()` explicitly after the routes/mounts it
handles. `onError(error, { request, response, controller? })` receives original
errors; controller context is absent for earlier parser/native middleware
failures. If the callback responds, stop; otherwise forward the original error
unchanged. A callback failure forwards that new error. No fallback runs when a
callback is configured.

Without a callback, the explicit middleware maps `ValidationError` to 400,
serializes `HttpException` with its status, and sends a non-leaking 500 for
unknown errors. Domain/parser errors require application-owned mapping if a
specific status/shape is desired. Already sent responses are forwarded without
another write. Without this middleware all controller failures go directly to
the application's native Express error pipeline.

## Repository example and checks

```sh
pnpm build
pnpm --filter @elyum/express example:build
PORT=3000 pnpm --filter @elyum/express example:start
curl http://127.0.0.1:3000/health
curl -X POST http://127.0.0.1:3000/api/echo \
  -H 'content-type: application/json' -d '{"message":"hello"}'
```

The [example](./examples/main.ts) is compiled with constructor metadata and
demonstrates native continuation, Router mounting and dependency discovery.
It is separate from the existing order reference application.

```sh
pnpm --filter @elyum/express test:ci
pnpm --filter @elyum/express test:package
pnpm typecheck
pnpm typecheck:ts6
pnpm ci:lint
```

Integration tests use real Express servers on ephemeral loopback ports and close
them after each test. This milestone makes no performance or portability claim.

`test:package` requires `pnpm build` first. It compiles and runs independent CJS
and ESM consumers from a temporary directory, without workspace aliases, against
the emitted declarations and runtime exports.

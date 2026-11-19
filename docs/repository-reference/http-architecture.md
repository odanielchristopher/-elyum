# Elyum HTTP architecture

## Status

This specification records accepted HTTP design decisions. The controller metadata API, compilation boundary, framework-neutral executor, and first Fastify adapter milestone described below are implemented. Express remains conceptual.

## Native routing ownership

Elyum does not implement or own an HTTP router. Fastify and Express remain responsible for route registration, matching, lifecycle, hooks/middleware, serialization, and server startup/shutdown.

- Fastify applications continue to use `fastify.route(...)` and `fastify.register(...)`.
- Express applications continue to use `app.get(...)`, `app.post(...)`, `Router`, and native middleware composition.
- Elyum must not decorate either integration with another generically named `route` method when the host already owns that concept.
- Adapter packages translate Elyum controller metadata into native framework configuration without hiding native options.

The framework-neutral HTTP package may compile controller metadata for adapter consumption. Compilation is not routing: it performs reflection, validation, and precomputation outside the request hot path.

## Controller model

One controller class represents exactly one HTTP route.

Method and path are class-level metadata. This keeps route information next to the removable controller unit and avoids adopting a NestJS-style multi-route controller/resource as the initial model.

The public metadata API is:

```ts
@Route({ method: 'POST', path: '/users', handler: 'run' })
class CreateUserController {
  run() {}
}
```

`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`, `@Head`, and `@Options` are thin wrappers over `@Route`. Their signature is `(path = '/', { handler } = {})`. Paths are preserved for the native router without Elyum normalization. Exactly one route decorator is accepted per controller.

A controller does not need to inherit from an Elyum base class. Elyum will define a small public controller contract while retaining structural compatibility where practical.

### Handler method selection

The supported conventional method names are `execute` and `handler`. An adapter installation option must also allow an application to supply its existing method name. The handler declared by the class route decorator takes precedence over the adapter option, which takes precedence over conventions.

Conceptually:

```ts
fastify.register(elyum(), {
  controllerMethod: 'run',
});
```

```ts
const integration = Elyum(app, {
  controllerMethod: 'run',
});
```

Parameter decorators such as `@Body()`, `@Query()`, `@Param()`, and `@Request()` apply to the selected handler method.

Handler selection must never resolve ambiguity silently. During controller registration/compilation:

- use the explicitly configured `controllerMethod` when present;
- otherwise accept exactly one supported conventional method (`execute` or `handler`);
- if both `execute` and `handler` exist without an explicit configuration, throw a configuration error;
- if the configured method does not exist, throw a configuration error;
- if no supported or configured method exists, throw a configuration error.

Every error must identify the controller, explain the ambiguity or missing method, and tell the user how to fix it—for example, remove one conventional method or configure `controllerMethod` explicitly. Detect these errors during registration/compilation rather than on the first request.

### Controller result

The selected method supports three response modes:

1. Return `httpResult({ statusCode, body, headers })`, whose runtime brand prevents an ordinary body containing `statusCode` from being misclassified.
2. Return a body value directly, using documented default status behavior.
3. Receive the native reply/response through a parameter decorator, send the response directly, and return nothing.

The executor/adapter must distinguish these modes without sending twice. If a controller sends the native response and also returns a value, throw an explicit response-conflict error. The error must identify the controller/route and instruct the user to either return the response value or send through the native response—not both.

When the host framework has already committed the response, the adapter must not attempt to send an additional error response. It should report/forward the conflict through the configured or native error/diagnostic mechanism while preserving the original response state.

The structured result should remain a small transport result rather than an attempt to mirror every Fastify or Express response feature. Native response access is the escape hatch for framework-specific behavior.

## Request and response boundary

Shared request data remains generic and minimal. Adapters supply normalized body, query, params, and headers for extraction while retaining typed native request and response values.

Conceptually:

```ts
interface HttpRequest<
  TBody,
  TQuery,
  TParams,
  THeaders,
  TRaw = unknown,
> {
  body: TBody;
  query: TQuery;
  params: TParams;
  headers: THeaders;
  raw: TRaw;
}
```

The adapters must avoid unnecessary per-request transformations. `@Request()` and `@Response()` inject the native framework objects directly. `HttpExecutionContext.getRequest()` and `getResponse()` expose those native objects, while `getRequestData()` exposes normalized extraction data.

## Execution boundary

The shared package exposes `executeController(compiledController, options)`. The adapter supplies normalized request data, native request/response objects, a synchronous or asynchronous controller resolver, and a framework-specific `isResponseSent` predicate.

Execution opens the HTTP context before controller resolution, resolves parameter factories and validators sequentially by parameter index, invokes the precompiled handler with its instance binding, and returns either an automatic response instruction or `{ kind: 'manual' }`. It never sends or serializes the native response.

Direct bodies use the compiled default status (`201` for POST and `200` otherwise). An unsent `undefined` result uses the same default with no body. Status `204` is explicit through `httpResult`. Sending the native response and also returning a value raises an actionable controller execution error.

The resolver callback keeps the executor independent from `ContainerDI`; an adapter may close over Elyum's container or an application-owned container. Resolver, factory, validator, and controller errors retain their original identity for the adapter's future error boundary.

## Parameter decorators

Built-in parameter sources include body, query, path parameter, headers, request, and response. `custom` is a first-class source.

Users can create parameter decorators such as `@ActiveUser()` using the public `createParamDecorator` API. Custom decorators can access the current HTTP execution context and may return values asynchronously.

Parameter metadata must preserve index, source, optional key, validator, and custom factory without unsafe casts caused by an incomplete source union.

`@Param()` and `@Param(validator)` receive the complete native route-params object. `@Param('id')` and `@Param('id', validator)` select one key. Built-in decorators store validators in compiled metadata; their factories only extract values, so the executor applies each validator exactly once.

## Validation

The semantic validation contract belongs to Elyum through `IValidator`. Adapter packages may compile or translate a compatible validator/schema into the native framework validation mechanism when behavior is preserved.

This hybrid design allows Fastify to retain benefits such as native schema handling, serialization, and integrations like Swagger while keeping Elyum controllers independent from a specific validation library.

Requirements:

- native compilation is an adapter optimization, not a different validation contract;
- fallback execution through `IValidator.parse` must remain possible;
- normalized validation outcomes must be equivalent across adapters;
- adapter optimizations must be benchmarked and covered by native integration tests;
- the original/native schema may be exposed to compatible plugins when doing so does not couple `@elyum/http` to that library.

## Hooks, middleware, and guards

Elyum guards are outside the initial product scope. Fastify hooks and Express middleware remain the primary mechanisms for authentication, authorization, and other pre-handler behavior.

The experimental guard API was removed from `@elyum/http`. Do not add guard execution to the initial shared request pipeline.

## Error boundary

Elyum provides a safe default error handler that does not expose internal details for unknown failures. Applications may configure an error callback/handler through the adapter installation options.

The intended behavior is:

1. Preserve the original error and useful cause/context.
2. Delegate to the application handler when configured.
3. Respect a response already sent by the application/native framework.
4. Fall back to normalized known Elyum/validation errors.
5. Return a non-leaking internal-server response for unknown errors.

Adapters integrate this policy with the native Fastify error handler or Express error middleware. The shared HTTP package must not own a server or force one serialized error shape on applications that opt into custom handling.

In the initial Fastify adapter, an optional `onError(error, context)` receives the original error, native request/reply, and compiled controller. A response sent there ends the flow; otherwise the original error is rethrown into Fastify. An error thrown by `onError` replaces it. Without `onError`, Fastify's native error handler receives the original error directly. The adapter does not serialize errors itself.

## Dependency injection and performance

Adapter installation may accept an application-supplied `ContainerDI`. Container ownership, child-container lifecycle, and controller registration must be explicit.

Request-scoped child containers are not assumed to be free. Before making them unconditional in the hot path:

- benchmark direct framework baselines;
- compare root-only resolution with per-request child containers;
- measure throughput, latency, CPU, memory, and allocation pressure;
- determine whether request scope can be opt-in or lazily created;
- reject unnecessary lifecycle complexity if its value does not justify the measured cost.

Singleton/transient controller resolution and a user-supplied root container should not require an unconditional request child when no scoped dependency is used.

## Compilation boundary

The shared HTTP package exposes `ControllerCompiler` as the preferred adapter-facing API. An adapter creates one compiler with its installation options and reuses it during route registration:

```ts
const compiler = new ControllerCompiler({ controllerMethod: 'run' });
const route = compiler.compile(CreateUserController);
```

The compatible `compileController(ControllerClass, { controllerMethod? })` function remains available as a convenience wrapper around a new compiler instance. Both APIs perform the same steps:

1. Read class and selected-method metadata.
2. Validate method/path, selected handler, and parameter definitions.
3. Pre-sort parameters and precompute extraction/validation work.
4. Produce immutable compiled controller metadata with the class, HTTP method, untouched path, selected handler name, ordered parameters, and default direct-body status.
5. Let the native adapter convert that metadata into a native route handler/options object.

Compilation occurs during plugin/application registration. Avoid reflection, handler discovery, and structural validation on every request.

`ControllerCompiler` stores an immutable copy of its options but has no cache or request lifecycle. Separate instances remain isolated, and repeated calls may safely reuse the same configuration.

`executeController` consumes only the immutable compiled representation and performs no reflection or recompilation in the request path.

The compiled representation must not contain Fastify or Express types. Native route options remain outside it and are merged by the relevant adapter.

## Package responsibilities

`@elyum/http` owns:

- controller and parameter contracts;
- class/method/parameter metadata;
- metadata reading and compilation;
- shared extraction and validation semantics;
- minimal request/response/result types;
- safe error classification/default policy primitives;
- execution context integration.

Fastify/Express adapter packages own:

- installation into the native instance;
- native route registration;
- hook/middleware composition;
- native request/reply mapping;
- framework-specific validation/schema optimization;
- native error pipeline integration;
- native startup/shutdown only when explicitly offered as optional convenience.

`@elyum/http` must not own CORS, JSON parsers, server creation, listen/close, or concrete host-framework options.

## Fastify adapter

`@elyum/fastify` is installed through `fastify.register(elyum(), options)` and decorates the instance with `fastify.controller(Controller, nativeOptions?)`. Registration compiles the controller synchronously and delegates to native `fastify.route(...)`; method, URL, and handler come from compiled metadata, while hooks, schema, config, constraints, and compiler options are passed through unchanged.

Installation accepts exactly one resolution strategy. With no strategy, the plugin creates an Elyum container. A supplied `container` is reused. A supplied synchronous or asynchronous `resolveController` supports application-owned factories and external containers. Container modes auto-register a missing controller token as transient and preserve existing providers and scopes. The runtime exposes `fastify.elyum.resolveController` in every mode and `fastify.elyum.container` only in container modes.

Container modes may opt into `autoRegisterDependencies: true`. During `fastify.controller()`, the adapter uses the core `DependencyRegister` to discover missing concrete classes marked with `@Injectable()`. Existing providers are preserved; custom tokens, values, factories without providers, configuration, and interfaces remain explicit. The option cannot be combined with `resolveController` because dependency ownership belongs to that external resolver.

The Fastify adapter permits only singleton and transient providers during automatic graph validation. A scoped provider fails registration with an actionable error because the adapter does not yet create a request child container. Request scope and scoped-resource disposal are a separate milestone that requires comparative performance evidence.

Per request, the adapter passes Fastify body, query, params, headers, request, and reply to the shared executor. It uses `reply.sent` for manual-response detection and applies automatic status, headers, and body without introducing its own serialization. Request-scoped child containers and automatic native schema generation remain deferred until their value and overhead are evaluated.

## Decisions still open

- exact Express composition syntax and error-middleware ordering;
- container ownership, disposal, and optional request-scope policy;
- default error response schema and callback return protocol.

# Elyum product vision

## Purpose

Elyum is a TypeScript framework/toolkit for building Node.js HTTP applications with consistent architectural patterns while retaining the performance, ecosystem, and familiar programming model of the underlying HTTP framework.

It targets the gap between minimal frameworks such as Fastify and Express and highly structured frameworks such as NestJS. Elyum should provide useful structure—dependency injection, execution context, validation, controllers, and integration conventions—through the smallest practical abstraction layer. Elyum guards are not part of the initial scope because native Fastify hooks and Express middleware already cover that responsibility.

## Core promise

Elyum must help a developer build a well-organized Fastify or Express application without making Elyum the application's inescapable runtime architecture.

Removing Elyum will naturally require integration work, but reconstructing the application directly with Fastify or Express must be understandable and bounded rather than a wholesale rewrite. Business rules and services should survive. Routes should continue to resemble the native host framework, and host-native hooks or middleware should remain visible.

This property is called **removability** in this specification. It complements portability:

- **Portability:** reuse application code across supported HTTP adapters.
- **Removability:** migrate from Elyum to direct use of the current HTTP framework without rebuilding the whole application.

## Product principles

1. **Minimal abstraction:** add structure only where it creates measurable architectural value.
2. **Native mental model:** Fastify integration should feel like Fastify; Express integration should feel like Express.
3. **Progressive adoption:** allow Elyum to be introduced into an existing application without requiring an all-at-once migration.
4. **Explicit escape hatches:** expose or preserve access to native request, response, hooks, middleware, plugin options, and error handling where appropriate.
5. **Dependency inversion:** core application behavior depends on Elyum contracts or application-owned abstractions rather than concrete servers and third-party validators.
6. **Modularity:** integrations belong in separate adapter packages; the core must not depend on Fastify, Express, Zod, or Yup.
7. **Evidence over claims:** portability, removability, extensibility, and performance overhead must be demonstrated with equivalent applications and documented measurements.

## Intended developer experience

### Fastify adapter

The Fastify integration should be installed as a normal Fastify plugin, following Fastify's encapsulation and plugin lifecycle instead of wrapping or replacing the Fastify instance.

Installation:

```ts
fastify.register(elyum(), {
  container,
  onError,
});
```

The supported options include:

- supplying an application-owned dependency injection container;
- opting into conservative discovery of concrete `@Injectable` controller dependencies;
- allowing the application to receive and handle errors directly;
- retaining access to route hooks and other native Fastify options.

Route registration uses `fastify.controller(Controller, nativeOptions?)`, which compiles one class-level route and delegates to Fastify's native `fastify.route(...)`. Native hooks and route options remain supplied unchanged; Elyum does not add another generically named `route` method that could be confused with Fastify's own API.

The earlier [`fastify-route-adapter`](https://github.com/odanielchristopher/fastify-route-adapter) repository is the concrete prototype that originated this direction, not automatically the final Elyum API.

### Fastify prototype lineage

The prototype demonstrates the intended integration shape through working application code:

- a Fastify plugin decorates the native instance with `routeAdapter`;
- route groups continue to use `fastify.register(...)`, prefixes, and encapsulation;
- native hooks such as `onRequest` remain attached through Fastify;
- a route declaration identifies a controller and supplies method/path;
- the adapter resolves the controller through DI, reads validation metadata, and delegates to `fastify.route(...)`;
- controllers receive a typed request-shaped input and return an explicit status/body result;
- Fastify retains responsibility for validation execution, reply serialization, hooks, and the error-handler lifecycle.

The initial prototype API is conceptually:

```ts
fastify.routeAdapter(fastify, {
  url: '/sign-in',
  method: 'POST',
  impl: SignInController,
});
```

For Elyum, preserve the successful architectural properties of this prototype while revisiting incidental limitations:

- installation should be packaged as a reusable Elyum Fastify plugin;
- the decorated method already has access to its Fastify instance, so requiring the same instance as an argument should not be assumed necessary;
- the DI container must be configurable instead of relying on a process-global registry;
- validation must use Elyum's validator contract rather than being coupled directly to Zod;
- schema support should not be limited to request bodies;
- application error handling must be injectable/composable with Fastify's native error pipeline;
- controller resolution must support request scopes and concurrency isolation;
- route method/path move into class-level controller metadata in Elyum, although the prototype kept them in the route registration;
- native Fastify route options and hooks must remain available at the route declaration.

Do not describe the prototype as already proving portability, removability, low overhead, or production readiness. It proves the feasibility of adapting a DI-resolved, metadata-bearing controller into Fastify's native routing lifecycle.

### Express adapter

The accepted composition direction is a default factory over an existing
Express application or Router. It returns that same native instance enriched
with `controller` and an `elyum` integration namespace; it does not replace
the native runtime or implement a parallel router.

```ts
const app = elyum(express(), { json: { limit: '1mb' } });
const routes = elyum(Router());

routes.controller(authenticate, HealthController, renderHealth);
app.use('/api', routes);
app.use(app.elyum.errorHandler());
```

Each controller registration contains exactly one metadata-bearing controller
class among native middleware. The adapter replaces the class at its declared
position with a compiled handler and infers method/path from metadata. Native
methods, Router mounting, middleware ordering and server lifecycle remain
available on the original object. Preserving Express does not require spelling
`app.get` or `app.post` for every Elyum-managed route.

Controllers normally return or send a response. Express-specific `@Next()`,
exported only by `@elyum/express`, explicitly delegates to native middleware
continuation and prevents an automatic Elyum response. It makes that controller
Express-specific; it is not a portable shared HTTP decorator. A controller may
appear before later middleware, without a positional error or automatic warning.

JSON parsing is opt-in through native parser options. Without `json`, no parser
is installed. CORS and logging remain application-owned. A public `compile()`
escape hatch is deferred beyond the first milestone.

These capabilities are implemented in the first Express milestone, recorded in
[ADR-EXPRESS-001](../adr/ADR-EXPRESS-001.md). With an application `onError`
callback configured, an unanswered error is forwarded unchanged to the next
native error middleware. The explicit Elyum error middleware provides a safe
fallback only when no callback is configured.

## Adapter boundary

Shared HTTP behavior may include:

- controller and parameter metadata;
- dependency resolution and request-scoped containers;
- validation contracts and normalized validation errors;
- execution context;
- framework-neutral compiled controller metadata where useful.

Adapter-specific behavior includes:

- registering routes with the native framework;
- translating native request and response objects;
- mapping Fastify hooks or Express middleware;
- participating in the framework's lifecycle and error pipeline;
- retaining access to native route options.

Avoid forcing Fastify and Express through a lowest-common-denominator API when that would conceal useful native capabilities. Shared contracts should support the adapters, not dictate an unnatural public API.

## Final project outcome

The TCC prototype is complete when it can demonstrate all of the following:

1. A non-trivial reference application runs through Elyum on Fastify.
2. An equivalent adapter runs the same relevant application behavior on Express.
3. Changing the HTTP adapter requires little or no change to business services and controllers, with the changed lines documented.
4. A representative Elyum application can be converted to direct Fastify or Express with bounded, explainable integration work, demonstrating removability.
5. Native hooks/middleware and application-owned error handling work through each adapter.
6. Request-scoped dependency injection when justified by measured cost, parameter extraction, validation, native hooks/middleware, handler execution, and error propagation work end to end.
7. Benchmarks compare Elyum adapters with equivalent direct Fastify and Express implementations using throughput, latency, and resource-use metrics under controlled conditions.
8. An extension exercise demonstrates the effort needed to add a new integration or cross-cutting component.
9. Results document both benefits and limitations; the project does not assume the abstraction has zero cost.

## Evaluation dimensions

- **Architectural portability:** code reused and lines changed when switching adapters.
- **Removability:** code and concepts retained when removing Elyum while keeping the host framework.
- **Performance overhead:** throughput, latency distributions, CPU, and memory relative to direct framework usage.
- **Extensibility:** effort and touched components required to add an adapter, validator, or request concern.
- **Developer-facing complexity:** amount of glue code, configuration, implicit behavior, and framework-specific knowledge required.

## Current implementation status

The repository currently contains a strong foundation but not an end-to-end HTTP framework:

- `@elyum/core`: dependency injection, scopes, hierarchical containers, reflection metadata, errors, and asynchronous execution context.
- `@elyum/validation`: framework-agnostic validation contract and normalized errors.
- `@elyum/validation-zod` and `@elyum/validation-yup`: concrete validation adapters.
- `@elyum/http`: controller contracts, class-level route decorators, immutable controller compilation, framework-neutral controller execution, native request/response escape hatches, HTTP context, parameter decorators, exceptions, and coercion.
- `@elyum/fastify`: Fastify 5 plugin, native controller registration, configurable controller resolution, native route-option passthrough, response mapping, and error-pipeline integration.
- `@elyum/express`: Express 5 app/Router enrichment, ordered native middleware,
  controller compilation, sync/async resolution, native `@Next()` continuation,
  opt-in JSON parsing, response mapping and explicit error middleware.

The evaluation package now contains four independent order API baselines and a
shared real-HTTP acceptance/equivalence suite. Request-scope evaluation, automatic
schema integration, measured portability/removability experiments and benchmarks
remain separate work. The Express package retains a separate runnable example.

Dependency auto-registration is an optional startup convenience. It discovers only concrete `@Injectable` classes and leaves tokens, factories, values, configuration, and implementation selection explicit. Fastify does not yet support request-scoped providers; that lifecycle remains gated by disposal semantics and comparative HTTP benchmarks.

## Open design decisions

Do not silently settle these while working on unrelated tasks:

- future evolution of the Express API beyond the implemented first milestone;
- hook merging and encapsulation rules in Fastify;
- which future conveniences should be enabled by default versus opt-in;
- ownership and lifecycle rules for a user-supplied DI container;
- whether request-scoped child containers provide enough value to justify their measured overhead;
- the normalized error boundary versus fully native error handling;
- measurable acceptance thresholds for overhead and migration effort.

When a task depends on one of these decisions, inspect existing experiments and ask for clarification if the choice would materially constrain the public API.

## Non-goals

- Reimplement Fastify or Express internals.
- Hide every difference between supported servers.
- Create an all-encompassing application platform before validating the HTTP abstraction.
- Require all business code to inherit from Elyum base classes.
- Make removal technically impossible through pervasive Elyum-specific types or runtime magic.
- Claim that more abstraction is inherently better than native framework code.

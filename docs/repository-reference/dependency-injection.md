# Elyum dependency injection

## Purpose

Dependency injection belongs to `@elyum/core` and remains independent from HTTP servers. Elyum supports explicit class, value, and factory providers. Automatic discovery is an optional startup convenience, not a replacement for explicit composition or an implicit runtime registry.

## Conservative automatic registration

The public discovery service is `DependencyRegister`:

```ts
const dependencyRegister = new DependencyRegister(container);

dependencyRegister.registerDependencies(CreateUserController, {
  allowedScopes: ['singleton', 'transient'],
});
```

It reads constructor metadata and recursively registers missing concrete classes marked with `@Injectable()`. The root class is analyzed but not registered. This lets adapters retain ownership of controller registration and scope.

Discovery follows these rules:

- all graph validation finishes before any discovered provider is registered;
- existing providers are never replaced;
- existing class and factory providers have their declared dependencies traversed;
- value providers terminate their branch;
- missing optional dependencies remain absent;
- automatically discovered providers use their declared `@Injectable` scope, defaulting to singleton;
- `allowedScopes` lets an integration reject scopes it cannot implement correctly;
- circular dependencies and registration failures include the complete dependency path.

Interfaces do not exist at runtime. Missing string/symbol tokens, application configuration, native clients, factories, and classes declaring a custom provider token require explicit registration. This restriction keeps implementation choice visible and makes migration away from Elyum understandable.

## Fastify policy

`@elyum/fastify` exposes `autoRegisterDependencies: true` only in container modes. It is disabled by default and cannot be combined with an application-owned `resolveController`, because Elyum cannot inspect or mutate an external resolver safely.

When enabled, `fastify.controller()` discovers dependencies during route registration and permits only singleton and transient providers. A scoped provider causes an actionable registration error, including when it was registered explicitly in the supplied container. The supplied container is mutated only after the graph is fully valid.

Controllers remain transient and are registered by the Fastify adapter rather than by `DependencyRegister`.

## Request scope and performance

Fastify continues to resolve controllers from the root container in the current milestone. Request scope is deferred until Elyum defines provider disposal and measures the cost of child containers under representative HTTP load.

An exploratory microbenchmark on the current implementation measured approximately 282 ns for root resolution and 901 ns for `fork() + resolve()` on a four-level graph, an increment near 0.62 microseconds. This isolated diagnostic excludes Fastify, concurrency, garbage collection, and resource disposal. It is not evidence for a low-overhead product claim.

A later request-scope milestone must compare direct Fastify, root-only Elyum, and child-container Elyum using throughput, latency distributions, CPU, memory, allocation, and garbage-collection measurements. It must also define deterministic cleanup for scoped resources before request scope can become a supported adapter behavior.

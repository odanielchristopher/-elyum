# Elyum testing strategy

## Purpose

This specification defines the current testing standard for Elyum. It applies to every workspace package and to future HTTP adapters, examples, and regression suites.

Tests exist to protect observable contracts and architectural claims. A green suite must mean more than isolated implementation details work: the relevant public behavior, package boundary, and native framework integration must also work.

## Current baseline

The repository currently uses:

- Vitest as the test runner and assertion library;
- package-local `tests/` directories;
- `*.spec.ts` test files;
- `describe`, `it`, and `expect` from Vitest;
- behavior descriptions and test names in English;
- Arrange / Act / Assert comments in non-trivial cases;
- unit and small integration tests for dependency injection, execution context, errors, decorators, and validation adapters.

New work must preserve these conventions. Existing placeholder tests do not establish a precedent and must be replaced when their feature is implemented.

## Test levels

Use the lowest level that can prove the behavior, but do not replace a real integration boundary with mocks merely to keep a test small.

### Unit tests

Unit tests exercise deterministic behavior without starting an HTTP application or depending on a concrete third-party framework.

Appropriate subjects include:

- token description and type guards;
- metadata readers and decorator metadata;
- provider selection and dependency resolution;
- value coercion;
- normalized error construction and serialization;
- pure route-definition transformations.

Mock only direct collaborators whose behavior is outside the unit's contract. Prefer small fakes or in-memory implementations over assertion-heavy mocks.

### Package integration tests

Package integration tests exercise multiple Elyum components together through their public contracts.

Examples include:

- decorators plus reflection metadata plus dependency resolution;
- validation contracts plus Zod or Yup adapters;
- execution context plus a request-scoped child container;
- route metadata plus parameter extraction and validation;
- error normalization across package boundaries.

Import through the package's public entry point when the test is verifying public usability. Direct internal imports are acceptable only for an intentionally internal unit.

### Adapter contract tests

Every HTTP adapter must run a shared behavioral contract. The contract defines what all adapters promise without erasing native framework differences.

At minimum, each adapter must prove:

- plugin/integration registration and startup;
- route registration from controller metadata;
- all supported HTTP methods and path parameters;
- body, query, parameter, header, request, and response injection;
- synchronous and asynchronous handlers;
- dependency injection for controllers and their dependencies;
- singleton/transient provider behavior, unsupported-scope rejection, and
  request-scoped behavior where the adapter explicitly supports that lifecycle;
- validation success, transformation, and normalized failure;
- native hook or middleware pre-handler behavior;
- status, headers, JSON payloads, empty responses, and redirects where supported;
- application-owned error handling and default error handling;
- actionable registration errors for ambiguous, missing, or misconfigured controller handler methods;
- a response-conflict error when a controller both sends through the native response and returns a value;
- access to native request, response, hooks, middleware, and route options promised by that adapter;
- isolation between concurrent requests;
- cleanup and shutdown behavior.

The same contract cases and fixtures should be reusable between Fastify and Express. Adapter-specific assertions belong in separate native-integration suites.

### Native adapter integration tests

Run adapters against real Fastify and Express instances using their supported injection/test mechanism or a local ephemeral server when the real network boundary is relevant.

Do not mock Fastify or Express when verifying:

- plugin lifecycle or encapsulation;
- Fastify hook ordering and route options;
- Express middleware and error-middleware ordering;
- native request/response access;
- parsing, serialization, status, or header behavior;
- framework error propagation and shutdown.

Fastify tests must verify that Elyum participates as a native plugin and does not replace the Fastify instance. Express tests must verify that Elyum composes with native middleware and does not create a disconnected routing runtime.

### Express adapter coverage

The implemented first Express milestone includes checks for identity of enriched app/Router,
native methods and chaining, callable Router mounting, property collisions,
ordered middleware with exactly one controller, and JSON parsing only when
explicitly enabled with native options.

Cover Express-specific `@Next()` for ordinary continuation, errors by identity,
route/router skipping, async execution, later middleware, manual send followed
by next, returned-body conflicts and late errors. The optional neutral executor
extension is covered alongside regression of existing Fastify automatic/manual
behavior. Native Express integration and public type fixtures are implemented.
The package also provides `test:package` to compile and run CJS/ESM consumers
outside the workspace, without path aliases, against built exports.

With `onError` configured, prove that an unanswered known or unknown error
reaches the next native error middleware with its original identity and no
Elyum fallback response. Without a callback, prove the explicit middleware's
known-error and non-leaking unknown-error fallback. Cover callbacks that send
or throw, async callbacks, and already committed responses.

### End-to-end reference application tests

Maintain a non-trivial reference application that can be exercised through every supported Elyum HTTP adapter. Run the same behavior scenarios against each adapter, including at least:

- successful create and read flows;
- invalid input;
- authenticated/authorized and denied requests;
- application error handling;
- request-scoped state isolation;
- a route using a native framework extension point.

The reference scenarios validate user-visible parity. They do not require identical internal implementation or identical native options.

The four evaluation baselines follow [contracts v2](../evaluation/evaluation-contracts-v2.md).
Their shared suite uses real HTTP and public startup entrypoints, with fresh
state and deterministic dependencies. Authentication and request-correlation
scenarios are outside that baseline; this does not add request-scoped provider
support to either adapter.

### Architecture evaluation tests

Portability and removability are product claims and require controlled evidence rather than ordinary assertions alone.

- **Portability fixture:** run equivalent application behavior through the Fastify and Express Elyum adapters, recording which application files and lines differ.
- **Removability fixture:** compare an Elyum application with a direct native implementation while keeping business services and domain behavior equivalent. Record files changed, concepts replaced, and retained code.
- **Extensibility exercise:** implement a representative new adapter or cross-cutting component and record affected packages, changed lines, and required framework knowledge.

Keep these fixtures stable enough for comparison. Do not use different business applications to support portability or removability claims.

### Benchmarks

Benchmarks are not functional tests and must not run as part of the ordinary unit-test command.

Compare equivalent implementations:

- direct Fastify versus Elyum on Fastify;
- direct Express versus Elyum on Express.

Use the same routes, payloads, validation behavior, environment, Node.js version, concurrency levels, warm-up, duration, and machine conditions. Record throughput, latency distributions, CPU, and memory. Repeat runs and report variability. Store the benchmark protocol and raw results separately from assertions.

Never make a low-overhead claim from a single run, dissimilar applications, or development-mode servers.

## Naming and organization

- Place package tests under `packages/<package>/tests/`.
- Mirror the source responsibility where useful, for example `tests/di/container.spec.ts` for `src/di/container.di.ts`.
- Use the `*.spec.ts` suffix.
- Name a top-level `describe` after the public unit or behavior under test.
- Group method-specific cases in nested `describe('<method>()')` blocks when that improves navigation.
- Write `it` descriptions as observable English behavior, normally beginning with `should` while that remains the prevailing repository style.
- Do not encode issue numbers or implementation steps as the only description of expected behavior.

Example structure:

```ts
describe('ElyumContainer', () => {
  describe('resolve()', () => {
    it('should reuse singleton providers across child containers', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

Arrange / Act / Assert comments are expected when the phases are not already obvious. Avoid empty comments or excessive ceremony in very small tests.

## Assertion standard

Assert public outcomes rather than private implementation details.

Prefer assertions about:

- returned values and inferred types;
- instance identity across scopes;
- emitted metadata when metadata itself is the contract;
- error class, stable code, message shape, cause, and serialized representation;
- HTTP status, headers, body, and observable hook/middleware order;
- isolation across independently executed or concurrent requests.

Avoid tests whose only assertion is that a mock was called when a meaningful result can be observed. Do not rely only on snapshots for errors, routes, or HTTP responses whose individual fields are contractual.

When testing an error path, prove both that an error occurs and that it is the correct Elyum/native error with the relevant contextual information.

## Required behavioral matrices

### Dependency injection

Cover:

- class, value, and factory providers;
- class, string, and symbol tokens;
- singleton reuse at the root and across child containers;
- scoped reuse within one child and isolation between children;
- a new transient instance on every resolution;
- explicit and reflected injection;
- optional missing dependencies;
- duplicate registration, missing provider, non-injectable provider when enforced, and circular dependency errors;
- factory dependency resolution and failures;
- concurrency where scoped state is involved.

### Execution context

Cover:

- access inside a context;
- failure or absence outside a context;
- nested contexts;
- synchronous and asynchronous propagation;
- concurrent context isolation;
- get, set, has, and get-or-throw behavior.

### Validation adapters

Every validation adapter must prove:

- valid parsing;
- transformations/coercions performed by the underlying library;
- synchronous and asynchronous behavior when supported;
- single, multiple, nested, and array field errors;
- conversion to `ValidationError` without losing useful field/code information;
- rethrowing unexpected non-validation errors;
- public helper/type inference behavior.

### HTTP routing and adapters

Cover both the shared adapter contract and framework-native behavior. Pay particular attention to ordering, because hooks, middleware, guards, validation, controller execution, response handling, and error handling form one observable pipeline.

For every supported pipeline, tests must define and verify the expected order rather than relying on incidental implementation order.

## Type-level regression tests

Runtime tests are insufficient for a TypeScript-first public API. Protect important inference and rejected usage with compile-time fixtures or a dedicated type-testing tool when ordinary `tsc` assertions become unclear.

Type-level coverage is required for:

- decorator overloads;
- validator input/output inference;
- typed request body, query, params, and headers;
- adapter options and native option passthrough;
- provider tokens and resolved values;
- APIs whose usability depends on generic inference.

Do not use broad casts in a type test to make the intended usage compile.

## Isolation and determinism

- Each test owns its container, metadata-bearing fixture classes, application instance, and mutable state unless sharing is the behavior under test.
- Close servers and release resources in teardown.
- Do not depend on test execution order.
- Do not use real external services in the normal suite.
- Avoid arbitrary sleeps; synchronize on observable completion.
- Use fixed inputs and clocks where time affects behavior.
- Use ephemeral ports when a network server is necessary.
- Concurrent-request tests must be deterministic and assert cross-request isolation explicitly.

## Coverage policy

Coverage percentage is a diagnostic, not the definition of correctness. Do not add low-value assertions solely to increase a number.

Prioritize complete behavioral coverage of:

- public contracts;
- branching error paths;
- DI lifecycle and isolation;
- adapter lifecycle and request pipeline;
- third-party integration boundaries;
- previously reported regressions.

Numeric coverage thresholds may be introduced only after the suite and generated files are consistently configured across packages. Until then, a feature is not complete merely because the repository-wide percentage is high.

## Regression policy

A bug fix must include a test that fails for the reported behavior before the fix and passes afterward, at the lowest level that reproduces the real defect. Cross-package or native-framework bugs require an integration regression test; a mocked unit test alone is insufficient.

Keep the regression named by expected behavior. Do not preserve temporary debugging output or timing dependencies.

## Commands and completion criteria

The standard repository checks are:

```sh
pnpm test:ci
pnpm typecheck
pnpm typecheck:ts6
pnpm ci:lint
```

During the TypeScript 7 transition, `pnpm typecheck` verifies the native
compiler and `pnpm typecheck:ts6` protects compatibility with tools that still
consume the TypeScript 6 JavaScript API. Both checks are required until that
bridge is intentionally removed.

Use package filters while developing, then run the relevant repository-level checks before considering cross-package work complete.

A test-related change is complete when:

- relevant new behavior and meaningful failures are covered;
- no placeholder assertion remains for the completed feature;
- tests pass repeatedly and independently of order;
- real adapter boundaries are exercised where applicable;
- public types are checked when inference is part of the contract;
- resources are cleaned up;
- test, typecheck, and formatting results are reported accurately;
- benchmark results are not presented as functional test results.

Known repository failures must be reported and must not be concealed by weakening or skipping unrelated checks.

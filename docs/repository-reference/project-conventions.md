# Elyum project conventions

## Repository organization

Elyum is a pnpm TypeScript monorepo. Packages are independently publishable and use the `@elyum/*` namespace.

Keep responsibilities separated:

- `core`: framework-independent runtime primitives such as DI, metadata, context, and base errors;
- `http`: framework-neutral HTTP contracts and shared execution behavior;
- `validation`: validation contracts and normalized errors;
- integration packages: adapters for concrete servers or validation libraries;
- tests: package-local behavior and integration coverage under each package's `tests/` directory.

Concrete libraries must depend inward on contracts. Do not introduce Fastify, Express, Zod, or Yup dependencies into `core`.

Use focused directories by technical responsibility, following the current vocabulary: `constants`, `context`, `contracts`, `decorators`, `di`, `enums`, `errors`/`exceptions`, `guards`, `helpers`, `types`, and `utils`. Add a new category only when existing categories do not express its responsibility.

Use `index.ts` as a deliberate public barrel. Export supported public API and avoid exposing internals accidentally. A barrel must not reference missing modules.

## File and symbol naming

- Files: `kebab-case` with a responsibility suffix.
- Classes, enums, interfaces, and type aliases: `PascalCase`.
- Functions, methods, properties, and variables: `camelCase`.
- Constants and metadata keys: `UPPER_SNAKE_CASE`.
- NPM packages: lowercase `@elyum/<name>`.

Current suffix vocabulary:

- `*.decorator.ts`
- `*.contract.ts`
- `*.type.ts`
- `*.context.ts`
- `*.error.ts` for core/domain errors
- `*.exception.ts` for HTTP exceptions
- `*.helper.ts`
- `*.util.ts`
- `*.di.ts`
- `*.spec.ts`

Prefer one primary public concept per file.

## TypeScript and formatting

Follow the repository configuration:

- TypeScript 7's native compiler, installed as `@typescript/native`, is the
  primary `tsc` used by package typechecks and project-reference builds;
- the `typescript` package name intentionally points to the TypeScript 6
  compatibility package while ESLint, tsup, and other tools still require the
  JavaScript compiler API;
- keep `pnpm typecheck:ts6` passing while this bridge exists, and remove the
  bridge only after the complete toolchain supports the TypeScript 7 API;
- `ignoreDeprecations: "6.0"` is restricted to package build configurations as
  a temporary tsup declaration-build compatibility measure; it must not mask
  deprecated options in the shared configuration;
- strict TypeScript;
- single quotes and semicolons;
- trailing commas in multiline structures;
- spaces inside object braces, none inside array brackets;
- grouped, alphabetized imports with blank lines between groups;
- package imports across workspace boundaries and relative imports inside a package;
- explicit `type` imports/exports where useful;
- no unchecked duplicate imports;
- decorators and emitted metadata where required by the reflection-based API.

Avoid `any` when a stable boundary can be typed, even though lint currently permits it. Use `unknown` for untrusted input and keep casts close to adapter/reflection boundaries.

## API design

- Prefer small contracts and composition over inheritance-heavy APIs.
- Prefer classes for cohesive services that own reusable configuration or represent a lifecycle, such as compilers and adapters.
- Keep small stateless transformations and utilities as functions; do not introduce classes that only provide namespacing.
- Keep generic inference useful at the call site, especially for validators and parameter decorators.
- Make lifecycle, caching scope, and error behavior explicit.
- Preserve native framework extension points in adapter APIs.
- Avoid implicit behavior that makes debugging or removing Elyum disproportionately difficult.
- Treat breaking public API decisions as architectural decisions and update `product-vision.md` when they affect the core promise.

## Documentation language

Public code identifiers, error codes/messages, package metadata, test names, and commit messages use English.

Existing source comments are primarily Portuguese. For consistency in new reusable/public API documentation, prefer English. Portuguese remains appropriate for TCC prose and repository specs intended to support academic discussion. Do not mechanically translate existing comments during unrelated work.

Use TSDoc/JSDoc when it explains a non-obvious contract, lifecycle, generic, error condition, or realistic usage. Avoid comments that only repeat the implementation.

## Testing conventions

The authoritative testing standard is defined in
[`testing-strategy.md`](./testing-strategy.md). In summary, use Vitest,
behavior-oriented English test names, Arrange / Act / Assert for non-trivial
tests, and the lowest test level that proves the behavior without hiding real
integration boundaries.

## Errors

- Core framework errors extend the Elyum base error and expose a stable `ErrorCode`.
- HTTP exceptions carry status information and a serializable shape.
- Third-party validation errors are converted to Elyum's normalized validation error at the adapter boundary.
- Preserve original/native errors or causes when normalization would otherwise make application error handling or debugging harder.

## Git conventions

Follow Conventional Commits such as `feat:`, `fix:`, `refactor:`, `test:`, and `docs:`. Write concise English descriptions and proofread spelling. Keep commits scoped to one coherent change.

## Definition of done for implementation work

In proportion to the change:

- public exports resolve;
- formatting and typechecking pass;
- relevant tests cover observable behavior;
- package boundaries remain valid;
- native adapter behavior is verified with its actual framework;
- docs/specs are updated if product intent or a public architectural decision changed.

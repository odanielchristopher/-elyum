# Elyum repository context

Before reviewing, designing, or changing Elyum, read:

- `docs/specs/product-vision.md` for the product goal, architectural boundaries, adapter direction, and final TCC outcome.
- `docs/specs/dependency-injection.md` before changing providers, dependency discovery, container scopes, or adapter-driven registration.
- `docs/specs/http-architecture.md` before changing controllers, routing metadata, request/response handling, validation, errors, or HTTP adapters.
- `docs/specs/project-conventions.md` for the repository organization and writing conventions.
- `docs/specs/testing-strategy.md` before adding, changing, or reviewing tests or making claims supported by tests.
- `docs/specs/reference-application.md` before changing the example order API, its domain, application ports, infrastructure, or adapter-specific composition.

These documents are the persistent source of truth for project intent. Keep them aligned when an architectural or convention decision changes.

## Essential invariants

- Elyum is a minimal abstraction over native Node.js HTTP frameworks, initially Fastify and Express.
- Help developers apply structure and design patterns without making the application difficult to migrate away from Elyum.
- Preserve the host framework's concepts and extension mechanisms. Do not hide Fastify hooks/plugins or Express middleware behind an incompatible universal API.
- Keep business code independent from concrete HTTP servers where that reduces coupling, but provide escape hatches to native framework behavior.
- Prefer small, composable packages and contracts over a monolithic framework.
- Treat API sketches in the product spec as design direction until their signatures are explicitly accepted and implemented.
- Do not claim portability or low overhead without comparative evidence.

# 10: API documentation from the shared schema

**What to build:** Browsable API documentation a reviewer can read without opening the source, generated from the shared rules so it cannot drift away from them.

**Blocked by:** 08

**Status:** done

- [x] Browsable API documentation is served
- [x] It is generated from the shared creation rules rather than written separately
- [x] It reflects the Conditional Requirement without that rule being restated by hand
- [x] Every endpoint the directory uses appears in it

## Comments

Implemented. Verified against the acceptance criteria:

- Browsable documentation is served at `/api/docs` (Swagger UI, from `@nestjs/swagger` 12's bundled `swagger-ui-dist`, so nothing loads from a third party) with the raw OpenAPI document at `/api/docs-json`. Setup lives in `configureApp` beside the validation pipe, so the served application and the HTTP-level tests get the same document; main.ts logs the URL at startup.
- It is generated, not written: the document reads each `@Body({ schema })` and `@Query({ schema })` already on the controllers, and the `standardSchema` on each response, through the schema's own Standard JSON Schema (ADR-0002, "generates OpenAPI from that same schema with no converter"). `POST /api/users` is therefore documented from `createUserSchema`, `GET /api/users?page=&search=` from `listUsersQuerySchema`, and responses from `storedUserSchema`. `UserPage` and `ValidationFailure` were interfaces; they are now zod schemas in the shared module with the types inferred from them, so the list and 400 responses are documented from the same definitions the frontend reads, and `isValidationFailure` parses with the schema rather than checking by hand. Each shared schema carries a `meta` id so it appears as a named component (`User`, `CreateUser`, `UserPage`, `ValidationFailure`).
- The Conditional Requirement is a refinement, which has no JSON Schema of its own, so `conditional-requirement.ts` now also derives its documentation from the same `REQUIRED_BY_ROLE` table the refinement reads: a per-field description (`Required for an admin or an editor`, `Required for an admin`), a schema description in prose, and one `if`/`then` clause per Role for a machine reader. `createUserSchema` attaches them as metadata. Nothing about the rule is spelled a second time.
- Every endpoint the directory uses is in the document (`GET /api/users`, `GET /api/users/{id}`, `POST /api/users`), plus `GET /api`. Each carries a summary and its 400 and 404 outcomes.
- Tests: Seam 2 `apps/api/src/app/docs.spec.ts` (the UI is served; every endpoint is listed; the list parameters; the creation body's fields, required set, Role enum and formats; the Conditional Requirement's clauses and descriptions, asserted as literals from the spec's table; the responses resolving to the shared User, UserPage and ValidationFailure schemas).
- README's hand-written route table, which had already drifted (it said the Seed Data was served as-is), is replaced by a pointer to the generated documentation; ticket 11 rewrites the README in full.

Code review (standards + spec axes) led to: the document declared as OpenAPI 3.1, where the creation schema's `if`/`then` clauses are keywords rather than extensions a reader may ignore; the list parameters described on `listUsersQuerySchema` itself, so their documentation is generated like the body's, and the operation prose no longer restating the search rule; the one "must have" phrasing shared by the messages and the documentation sentences (`mustHave`), so the two cannot diverge in wording; the `if`/`then` clause given a type; the list response schema named like its neighbours; the README no longer restating the rule by hand next to the pointer to the generated docs; the docs spec's `document()` renamed so it no longer shadows the DOM global, typed without `any`, and its response assertions split one shape per case; "The three Roles" no longer counting them. Left as-is on purpose: `isValidationFailure` and `UserPage` now parsing with the shared schemas, which is one definition rather than a hand-written guard beside it; `GET /api` documented although the directory does not call it, since every endpoint should appear and its shape is that endpoint's own; the documentation functions staying beside the table they read, so nothing about the rule lives outside `conditional-requirement.ts`; the spec asserting `enum: ['admin']`, which is the served document and what a 3.0 or 3.1 reader sees; the 400 for a non-numeric id documented without a body, since it is the framework's default rather than the field-keyed one.

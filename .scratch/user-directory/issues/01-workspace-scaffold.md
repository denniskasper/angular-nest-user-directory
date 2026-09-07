# 01: Workspace scaffold

**What to build:** A single monorepo holding the frontend application, the API application and the shared module, with both applications startable from one codebase. Nothing user-facing yet — this exists so every later ticket has somewhere to land, and so the shared module is provably consumable by both sides before any rule depends on it.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Both applications start with documented commands and serve without errors
- [x] TypeScript is pinned to the version the frontend framework permits
- [x] No package resolves outside its declared peer range without a recorded override
- [x] Change detection is zoneless and the zone library is absent from the build
- [x] A value exported from the shared module is imported and used by both applications, proving it resolves in both build pipelines
- [x] The server framework version follows ADR-0002; if its packaging proves unworkable the documented fallback is taken and the ADR updated to say so
- [x] Workspace layout follows ADR-0003

## Comments

Implemented. Verified against the acceptance criteria:

- `npm start` (or `npm run start:api` / `npm run start:frontend`) serves the API on :3000 and the frontend on :4200 with `/api` proxied; both start clean.
- TypeScript is `~6.0.3`, the range `@angular/compiler-cli` 22.1 permits (`>=6.0 <6.1`).
- `npm ls --all` exits clean. The out-of-range packages are `@nestjs/core` and `@nestjs/common` 12 against `@nx/nest`'s `<12` peer range, plus `@nestjs/schematics` moved to 12 so its Angular devkit dedupes with the root's (the Nest 11 schematics dragged in a devkit 19 whose chokidar peer could not be met). All three are recorded as `overrides` in `package.json` per ADR-0002.
- zone.js is not installed and not present in `dist/apps/frontend`; the app was generated with `--zoneless`.
- `USER_ROLES` from `@pdr-cloud/shared` is returned by `GET /api` and rendered by the frontend root component; a vitest HTTP-level spec (`apps/api/src/app/app.spec.ts`) and a Playwright spec (`apps/frontend-e2e/src/scaffold.spec.ts`, phone + desktop) prove both build pipelines resolve it.
- NestJS 12.0.1 works under Nx's webpack build on Node 22.12+ (`require(esm)`); ADR-0002 gained an Outcome section, the fallback was not needed.
- Layout follows ADR-0003; two creation-time tooling quirks are appended to that ADR.

Not in this ticket: the frontend placeholder is unstyled and the scaffold Playwright spec will be superseded by the list spec in ticket 03.

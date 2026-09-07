# User Directory

A paginated, searchable directory of Users with a form for adding new ones.
An Nx monorepo holding an Angular frontend, a NestJS API and a shared module
that both consume.

```
apps/frontend   Angular 22, zoneless
apps/api        NestJS 12
libs/shared     the module both applications consume (Role vocabulary so far)
```

## Requirements

- Node.js 22.12 or newer (the API bundle loads ESM-only packages via `require`, which needs this floor)
- npm 10 or newer

## Install

```sh
npm install
```

## Run

Start both applications together:

```sh
npm start
```

Or individually:

```sh
npm run start:api        # http://localhost:3000/api
npm run start:frontend   # http://localhost:4200 (proxies /api to the API)
```

## Check

```sh
npm run typecheck   # TypeScript across all projects
npm run lint
npm test            # unit and HTTP-level tests (vitest)
npm run e2e         # browser tests (Playwright, needs `npx playwright install chromium`)
npm run build
```

## Notes

Decisions with lasting consequences are recorded in `docs/adr/`.
The domain vocabulary is in `CONTEXT.md`.

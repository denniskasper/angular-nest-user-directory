# User Directory

A paginated, searchable directory of Users with a form for adding new ones.
An Nx monorepo holding an Angular frontend, a NestJS API and a shared module
that both consume.

```
apps/frontend   Angular 22 + Angular Material, zoneless
apps/api        NestJS 12
libs/shared     the module both applications consume (Role vocabulary, User schemas, Conditional Requirement)
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

To try it on a phone, start both with the frontend bound to every
interface, then open `http://<this machine's LAN address>:4200` on the
phone. The API stays on localhost; the frontend proxies `/api` to it.

```sh
npm run start:lan
```

## Check

```sh
npm run typecheck   # TypeScript across all projects
npm run lint
npm test            # unit and HTTP-level tests (vitest)
npm run e2e         # browser tests (Playwright, needs `npx playwright install chromium`)
npm run build
```

## API

Browsable documentation is served by the API itself at
`http://localhost:3000/api/docs` (the raw OpenAPI document is at
`/api/docs-json`). It is generated from the shared schemas rather than
written by hand: the body of `POST /api/users` is documented from the same
creation schema that validates it, so the Conditional Requirement is
expressed once, in `libs/shared`, and cannot drift from what the form and
the server enforce.

The Seed Data (the 100 Users from the challenge) is committed as an
application asset at `apps/api/src/assets/seed/users.json`; Normalization
of its malformed records happens once, on first start, into the runtime
store under `data/`.

## Theme and layout

The Material 3 theme is generated from the four brand colours with
`@angular/material:theme-color`; the tonal palettes live in
`apps/frontend/src/styles/_theme-colors.scss` and are applied once in
`styles.scss`. The literal brand hexes are exposed as `--brand-*` custom
properties (`_brand.scss`) for the places that must show the colour itself.
Light and dark appearance follow the system preference through
`color-scheme: light dark`; there is no toggle.

Breakpoints (tablet, laptop, desktop; phone is the baseline) are defined
once in `apps/frontend/src/styles/_breakpoints.scss` and consumed with
`@use 'breakpoints' as bp; @include bp.up(tablet) { … }`. Fonts (Fraunces,
Instrument Sans) are self-hosted from `@fontsource-variable`, so nothing
loads from a third party.

## Notes

Decisions with lasting consequences are recorded in `docs/adr/`.
The domain vocabulary is in `CONTEXT.md`.

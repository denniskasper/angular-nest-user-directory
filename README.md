# User Directory

A paginated, searchable directory of Users with a form for adding new ones.
An Nx monorepo holding an Angular frontend, a NestJS API and a shared module
that both consume.

```
apps/frontend   Angular 22 + Angular Material, zoneless
apps/api        NestJS 12
libs/shared     the module both applications consume (Role vocabulary, User schema)
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

| Route            | Returns                     |
| ---------------- | --------------------------- |
| `GET /api/users` | every User, as a JSON array |

The Seed Data (the 100 Users from the challenge) is committed as an
application asset at `apps/api/src/assets/seed/users.json` and served as-is
for now; Normalization of its malformed records is a later ticket, so a few
Legacy Records still carry misspelled field names and text ids.

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

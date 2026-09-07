# User Directory

A paginated, searchable directory of Users with a form for adding new ones.
An Nx monorepo holding an Angular frontend, a NestJS API and a shared module
that both consume, so the browser and the server validate a new User against
one definition and cannot disagree.

**→ [user-directory.denniskasper.dev](https://user-directory.denniskasper.dev)**

The public instance holds the 100 fictional Users of the Seed Data and
accepts new ones from anyone, as the form does locally. See
[Deployment](#deployment).

```
apps/frontend      Angular 22 + Angular Material (Material 3), zoneless
apps/frontend-e2e  Playwright specs, run at a phone and a desktop viewport
apps/api           NestJS 12
libs/shared        the module both applications consume: Role vocabulary,
                   User schemas, the Conditional Requirement
tools/             the reset script
deploy/            the smoke test against the built image
.github/workflows  the CI workflow: check, then trigger the deployment
```

This repository was developed **agentic-coding first**. The spec, tickets,
domain glossary and architecture decision records were written before the
code, and the code was then implemented by coding agents working from them,
ticket by ticket, with a review pass after each. The agent tooling is kept in
the repository on purpose so the process is as reviewable as the result: see
[How this was built](#how-this-was-built).

## Requirements

- Node.js 22.12 or newer (the API bundle loads ESM-only packages via
  `require`, which needs this floor; see ADR-0002)
- npm 10 or newer

## Install

```sh
npm install
```

The browser tests additionally need a Chromium build once:

```sh
npx playwright install chromium
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

The directory is at `http://localhost:4200`, the smiley at
`http://localhost:4200/smiley`, and the browsable API documentation at
`http://localhost:3000/api/docs`.

To try it on a phone, start both with the frontend bound to every
interface, then open `http://<this machine's LAN address>:4200` on the
phone. The API stays on localhost; the frontend proxies `/api` to it.

```sh
npm run start:lan
```

## Data

The 100 Users from the challenge (the Seed Data) are committed verbatim as
an application asset at `apps/api/src/assets/seed/users.json`. That file is
only ever read.

The runtime store is a separate file, `data/users.json`, which is
git-ignored. On the first start, when no store exists, the API runs
Normalization over the Seed Data once (see [Seed Data](#seed-data) below),
writes the result as the store, and logs a report of what it repaired. Every
later start reads the store as it is. Users created through the form or the
API are appended to the store and survive a restart.

### Scripts

```sh
npm run reset   # remove the store; the next start rebuilds it from the Seed Data
```

The reset removes `data/users.json` and any temporary file an interrupted
write left beside it. It never touches the Seed Data asset. It is the way
back to a clean starting state after trying the creation form, and the way
to see the Normalization report again.

Both the API and the reset script honour `DATA_DIR`, so the store can be
kept somewhere other than `data/`:

```sh
DATA_DIR=/somewhere/else npm run start:api
DATA_DIR=/somewhere/else npm run reset
```

If the store has been hand-edited into something the stored schema rejects,
the API refuses to start and says so, naming the file; run the reset and
start again.

## Check

```sh
npm run typecheck   # TypeScript across all projects
npm run lint
npm test            # unit and HTTP-level tests (vitest)
npm run e2e         # browser tests (Playwright, phone and desktop)
npm run build
```

The browser tests start their own API against a store under `tmp/e2e/`, so
they neither read nor write `data/`. The HTTP-level tests boot the whole
application against a store in a fresh temporary directory, per suite or
per test.

## API

Browsable documentation is served by the API itself at
`http://localhost:3000/api/docs` (the raw OpenAPI 3.1 document is at
`/api/docs-json`). It is generated from the shared schemas rather than
written by hand: the body of `POST /api/users` is documented from the same
creation schema that validates it, so the Conditional Requirement is
expressed once, in `libs/shared`, and cannot drift from what the form and
the server enforce.

In brief:

| Endpoint                           | Behaviour                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/users`                   | Every User as an array                                                                                                                                  |
| `GET /api/users?page=2&search=ann` | One page of 25 matches plus the total; `search` is a case-insensitive substring of the Full Name                                                        |
| `GET /api/users/:id`               | That User, or 404                                                                                                                                       |
| `POST /api/users`                  | Validates against the shared creation schema, assigns the next id, persists, returns 201 with the User; 400 with messages keyed by field name otherwise |

## Seed Data

The Seed Data is malformed on purpose, and how it is handled is the
judgement call this challenge is really testing. Read naively, it either
shows broken rows or silently loses Users.

### What was wrong

Of the 100 records, 13 carry a defect:

| Records   | Defect                                                     |
| --------- | ---------------------------------------------------------- |
| 2, 3, 4   | birth date held under a misspelled field name, `birthDtae` |
| 5, 88, 91 | first name held under a misspelled field name, `fistName`  |
| 74, 96    | id held as text (`"74"`) rather than a number              |
| 1         | an impossible birth date, `31-31-9999`                     |
| 8, 38, 82 | an email of `not-an-email`                                 |
| 25        | no email at all                                            |

### What was done, and why

The rule is: **repair what is unambiguous, clear what cannot be salvaged,
never drop a record.** All 100 Users appear in the directory.

- **Repaired.** The two misspelled field names are renamed to their canonical
  names, and the two text ids are converted to numbers. In each case the
  intent is beyond doubt, so the value is kept.
- **Cleared.** The impossible birth date and the three unusable emails are
  removed from their records. There is no defensible way to guess what they
  should have been, and inventing a value would be worse than admitting it is
  unknown. The Users themselves stay; the field reads as absent in the detail
  view and the API omits it.
- **Left alone.** User 25 has no email; nothing is renamed or cleared, the
  record is stored as it came. User 5's phoneNumber is the literal string
  `invalid-number`; no phoneNumber format is specified anywhere, the schema
  accepts any non-empty string, so it is kept verbatim rather than
  second-guessed. Many viewers have no phoneNumber and many editors no
  birthDate, which is exactly what their Role allows.

So 13 records carry a defect and Normalization touches 12 of them; User 25
needs nothing done. The startup report lists each by id with what was renamed,
converted or cleared, including the value that was cleared, so the repairs
are visible rather than silent.

### Why it looks deliberate

The three records with `birthDtae` are all admins that otherwise hold a
phoneNumber. Correcting the field name is exactly what makes them satisfy the admin
rule. Left uncorrected, they are the only three records in the entire file
that violate the Conditional Requirement. An implementation that validates
the Seed Data strictly reports three invalid admins; one that repairs first
reports none.

### Strict for new input, tolerant for what is stored

**The strict rules apply to new input. They are not applied retroactively to
stored Users.** This is ADR-0001, and it is why the shared module exports two
schemas for the same entity:

- the **creation schema**, which is strict and the sole authority on what a
  new User must provide, including the Conditional Requirement;
- the **stored schema**, which is tolerant and describes what may
  legitimately already exist: `email`, `phoneNumber` and `birthDate` may be
  absent on a Legacy Record.

Rejecting Legacy Records under the creation rules would drop eleven Users
from the directory over a formatting defect, and would let the two text ids
through unrepaired, since the creation rules never see an id. The tolerant
read, after Normalization, is there to prevent both. Consumers of a stored User treat those three fields as
optional.

## Decisions

The decisions with lasting consequences are recorded as ADRs in `docs/adr/`;
the domain vocabulary (User, Role, Conditional Requirement, Full Name, Seed
Data, Legacy Record, Normalization) is in `CONTEXT.md`. In brief:

- **One shared rules module.** `libs/shared` owns the User schemas and the
  Conditional Requirement. The form validates against the creation schema
  before submitting, the API validates the body against it, and the API
  documentation is generated from it. The rule that an admin needs
  phoneNumber and birthDate, an editor needs phoneNumber, and a viewer needs
  neither is a single table read by the refinement, the form's hints and the
  documentation.
- **A refinement, not a union keyed on Role.** The Conditional Requirement is
  a `superRefine` over a flat object, so each issue carries the path of the
  one field at fault and maps straight onto one form control. It runs even
  when another field has already failed, so Role-dependent errors appear
  alongside the others rather than after them.
- **Framework validation, no bespoke layer.** NestJS 12's built-in Standard
  Schema validation pipe parses request bodies and query strings with the
  shared zod schemas directly, and its OpenAPI generation reads the same
  schemas. That is why NestJS 12 was chosen although it sits outside the
  peer range the Nx tooling declares; the overrides in `package.json` and
  the fallback that was not needed are recorded in ADR-0002.
- **Strict writes, tolerant reads.** Two schemas for one entity, above, per
  ADR-0001.
- **Persistence.** The Users are held in memory as the source of truth for
  reads, behind a repository interface; nothing above it touches the
  filesystem. Every write runs through one queue, so creations cannot
  interleave, and the next id is assigned inside that queue, so concurrent
  creations cannot collide. Each flush writes a temporary file and renames
  it into place, so an interrupted write never leaves a partial store.
- **Workspace layout.** The workspace was created from the Angular preset
  and the Nest application added afterwards, because `@nx/angular` refuses
  Nx's current default TypeScript project-references layout (ADR-0003).
- **Theme.** A Material 3 theme is generated from the four brand colours
  with `@angular/material:theme-color`; the tonal palettes live in
  `apps/frontend/src/styles/_theme-colors.scss` and are applied once in
  `styles.scss`. Light and dark appearance follow the system preference
  through `color-scheme: light dark`. Fonts are self-hosted, so nothing
  loads from a third party.
- **The brief's named APIs.** Where the challenge names an API, that API is
  used: the creation form is an Angular Reactive Form of Material form
  fields (`ReactiveFormsModule`, `mat-form-field`, `matInput`, `mat-select`,
  errors in `mat-error`), a User's detail opens in a `MatDialog`, success and
  error messages are `MatSnackBar`s, the list pages with `MatPaginator`, and
  the smiley is a standalone `SmileyComponent`. The form is still validated
  by the shared creation schema alone: one group-level validator parses the
  draft and writes each issue onto the control at its path, and Material's
  error state is opened for an issue caused from outside a control, so a
  field the chosen Role has just made required is marked at fault before
  anyone visits it. Two things depart from the brief's wording on purpose
  and are documented here: below tablet width the table gives way to a
  stacked presentation (next), and the API is served under `/api`.
- **Mobile-first.** The phone viewport is the baseline and wider layouts add
  to it. The table's four columns do not fit a phone, so below tablet width
  the list is a stacked per-User presentation carrying the same fields; the
  Material table appears from tablet width upward. The detail view is a
  full-screen surface on phones and a centred dialog from tablet up.
  Breakpoints are defined once in `_breakpoints.scss`.
- **Smiley.** `/smiley` is a standalone component built from Flexbox and
  Grid only: no absolute positioning, no images, no SVG. It scales with the
  viewport and uses the brand palette.

## Tests

Tests assert externally observable behaviour at three seams, and nothing
below them:

1. **The shared module's parse boundary** (`libs/shared`): the Conditional
   Requirement proved exhaustively for every Role, plus the cases where an
   unrelated error must not hide a Role-dependent one.
2. **The HTTP API** (`apps/api`), through the whole booted application:
   listing, paging, search, fetching by id, creation and its field-keyed
   failures, persistence across a restart, Normalization of the Seed Data,
   the reset script, and the generated documentation.
3. **The browser** (`apps/frontend-e2e`), Playwright at a phone and a
   desktop viewport. Four deliberately minimal directory specs: the list
   renders and pages, search narrows, creation succeeds and shows the new
   User, and choosing admin with an empty phoneNumber shows the inline
   error. The last is the one test that proves the shared rules through the
   entire stack. A fifth spec covers the shell and the smiley, including that
   it is built without positioning, images or vectors and scales with the
   viewport.

Angular components, services, the repository, the write queue and the
normalizer are not tested in isolation; their behaviour is proved above them.

## Assumptions

- The Seed Data's field-name misspellings and text ids are defects of
  transcription, not intent, so correcting them is safe.
- No phoneNumber format is specified, so any non-empty string is accepted
  and stored values are not reformatted.
- A birth date is an ISO calendar date (`YYYY-MM-DD`) with no time or zone.
- Role is a validation selector only. It grants nothing, and there is no
  authentication or authorisation anywhere.
- Ids are assigned as one more than the highest id in the store.
- Search is a case-insensitive substring match against the Full Name, so
  `na sm` finds Anna Smith and `smith` finds every Smith.

## Known limitations

- **Single-process writes.** The write queue serialises creations within one
  API process. Two processes sharing one `data/users.json` would race; a
  multi-instance deployment needs a different store.
- **In-memory reads.** The whole directory is held in memory and every list
  request is served from it. That is right for 100 Users and wrong for a
  million; the repository interface is where a database would go.
- **No update or delete.** Only listing, reading and creating are
  specified.
- **No repair workflow for Legacy Records.** Normalization is automatic and
  reported in the log; there is no interface for reviewing or fixing a
  cleared field.
- **Sorting, filtering by anything other than Full Name, and column
  selection** are not offered.
- **No appearance toggle.** Light and dark follow the system preference.
- **No internationalisation.** Copy is in English only.
- **A hand-edited store is rejected, not repaired.** Normalization runs only
  on the Seed Data at first start; a store that later fails the stored schema
  stops the API with a message naming the file.

## Deployment

One image, one process: Node runs the API and serves the built frontend
beside it, so the browser's relative `/api` requests need neither a proxy
nor CORS. Hosted on a private server behind [Dokploy](https://dokploy.com/).

```sh
docker build -t user-directory .
docker run -p 3000:3000 user-directory
```

The [`Dockerfile`](Dockerfile) builds in two stages. The first runs the same
`nx` builds as `npm run build`; the second installs only what the API bundle
requires at runtime (the lockfile the build writes to `dist/apps/api` names
five packages) and copies in the bundle and the built frontend. Nothing else
from the workspace is in the image. It runs as the unprivileged `node` user
and answers a `HEALTHCHECK` at `/api` every 30 seconds.

The served frontend is the one addition the container makes to what
`npm start` runs (`apps/api/src/app/serve-frontend.ts`, opted into by
`STATIC_DIR`). It does four things a static host would otherwise do:

- **The SPA fallback.** Any page request outside `/api` gets `index.html`,
  so a deep link such as `/users/7` or a reload on `/smiley` reaches the
  router instead of a bare 404. Requests under `/api` never get the page.
- **Cache rules by file.** The hashed bundles and fonts are cached for a
  year and marked immutable; `index.html` is `no-cache`, since it carries
  no hash and names the hashed files. A device that cached it would keep
  the previous deployment's bundle names.
- **Compression**, for the bundles and the API alike.
- **Headers.** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  and no `X-Powered-By`.

Three environment variables, all set in the image: `PORT` (3000),
`DATA_DIR` (`/data`, where the store is written) and `STATIC_DIR`
(`/app/public`, the built frontend). The store lives outside the image:
mount a volume at `/data` to keep created Users across deployments. Without
one, every new container starts from the Seed Data again, which is the
behaviour `npm run reset` produces locally.

Dokploy provides TLS, the domain and the routing in front. It is set up as:

1. **DNS** — an `A` record `user-directory` in the zone `denniskasper.dev`
   pointing at the server (Cloudflare, proxy off, so Dokploy obtains its
   certificate through the HTTP-01 challenge).
2. **Dokploy** — a new _Application_, source GitHub → this repository,
   branch `main`, build type **Dockerfile** (path `./Dockerfile`).
3. **Domain** — `user-directory.denniskasper.dev`, container port
   **3000**, HTTPS with a Let's Encrypt certificate.
4. **Volume** — a volume mount at `/data`, so the store survives a redeploy.
5. **Deploy** — _Auto Deploy_ is **off**. GitHub Actions triggers the build,
   and only once the checks are green.

### Check, then ship

If Dokploy listened to the push itself, the tests and the deployment would
run side by side, and a red run would go live anyway. So
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) holds the trigger,
and its last job calls Dokploy's API (`POST /api/application.deploy`,
header `x-api-key`). The repository holds `DOKPLOY_URL`, `DOKPLOY_API_KEY`
and `DOKPLOY_APPLICATION_ID` as secrets for it.

Dokploy has no public address; it hangs off a tailnet. The runner sits in
GitHub's cloud and could not reach it, so it joins the tailnet as a
short-lived node for the duration of that one job (`tailscale/github-action`,
secrets `TS_OAUTH_CLIENT_ID` and `TS_OAUTH_SECRET`). What it may do there is
decided by the ACL on `tag:ci`: reach the Dokploy host, nothing else. The
three checks before it need none of this; they run entirely on the runner.

Three checks run first, and they see different things:

- **Types, lint, tests, build** — `npm run typecheck`, `npm run lint`,
  `npm test`, `npm run build`. The same builds the Dockerfile runs, so a
  broken build fails here, two minutes in.
- **Smoke test on the image** ([`deploy/smoke-test.sh`](deploy/smoke-test.sh))
  — the SPA fallback, the cache rules, the compression, the headers and the
  API beside it, against the running container. The browser specs cannot
  see this: they run against the development server, and the served
  frontend does not exist there.
- **Browser specs** — `npm run e2e`, at both viewports.

The smoke test also runs by hand, against a local container or the public
URL:

```sh
deploy/smoke-test.sh https://user-directory.denniskasper.dev
```

## How this was built

The order was documentation first, then code. `.scratch/user-directory/`
holds the spec and the thirteen tickets that were implemented in sequence,
each with a comment recording what was verified and what the review changed.
`CONTEXT.md` fixes the vocabulary; `docs/adr/` records the decisions.

The coding agents worked from those documents using the skills under
`.agents/skills/` (test-driven development at agreed seams, a two-axis code
review against the spec and the repo's standards, domain modelling, frontend
design) with `AGENTS.md` and `docs/agents/` as the standing instructions.
`.claude/skills` is a symlink to the same skills directory. All of it is
kept in the repository so the reasoning behind the code can be read alongside
it. The challenge materials themselves are not part of the submission and
are excluded via `.gitignore`.

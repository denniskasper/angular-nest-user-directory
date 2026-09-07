# 13: Public deployment

**What to build:** The directory reachable at `https://user-directory.denniskasper.dev`, deployed the way `narkose.denniskasper.dev` is: a container image built from a `Dockerfile`, hosted behind Dokploy on a private server, with GitHub Actions holding the trigger so nothing ships until the checks are green. The application has no backend of its own to point at; the API and the frontend go out together, one process on one origin, so the browser's relative `/api` requests need neither a proxy nor CORS.

**Blocked by:** 12

**Status:** done

- [x] A `Dockerfile` builds both applications and produces an image holding only the API bundle, its runtime dependencies and the built frontend, running as an unprivileged user with a `HEALTHCHECK`
- [x] The API serves the built frontend beside itself when told where it is: the SPA fallback for any page request outside `/api`, cache rules that differ between `index.html` and the hashed files, compression, and `nosniff`/`DENY` headers
- [x] The store lives outside the image (`DATA_DIR=/data`), so a volume keeps created Users across deployments
- [x] A smoke test runs against the built image and checks the layer the browser specs cannot see: the fallback, the cache rules, the compression, the headers and the API beside it
- [x] `.github/workflows/ci.yml` runs types, lint, tests and build; the smoke test on the image; and the browser specs, and only then asks Dokploy to deploy, over the tailnet, on a push to `main`
- [x] The README links the public URL and documents the image, the Dokploy setup and the check-then-ship arrangement
- [x] DNS record, Dokploy application, Tailscale access and the five repository secrets are in place, and the public URL passes `deploy/smoke-test.sh`

## Notes for the implementer

- The served frontend is a deployment concern, not a development one: `npm start` keeps the development server serving the frontend and proxying `/api`, and the HTTP-level tests boot without a frontend unless a spec asks for one. `STATIC_DIR` is the opt-in, set in the image only.
- Reuse narkose's arrangement rather than a different host: the same tailnet, the same `tag:ci`, the same Dokploy, so that one ACL and one OAuth client serve both. The five secrets are per repository.
- The spec's out-of-scope list keeps multi-instance deployment out; one container with one volume is the whole of it.

## Comments

Implemented. Verified against the acceptance criteria:

- `Dockerfile`: two stages. The build stage installs the workspace with `npm ci` and runs the same `nx run-many -t build -p api frontend` as `npm run build`, copying only what those builds read (`nx.json`, `tsconfig.base.json`, the root eslint and vitest configs that Nx's plugins load while computing the project graph, `libs/`, `apps/api`, `apps/frontend`); `.dockerignore` keeps the rest out of the context. The serve stage installs from the `package.json` and lockfile the API build writes to `dist/apps/api`, which name only the five packages the bundle requires, then copies in `main.js`, the Seed Data asset and the built frontend. It runs as `node` (uid 1000), `/data` is owned by that user, and the `HEALTHCHECK` asks `/api`, which costs no file access. Image size 202 MB, of which the Node base is most. `app.enableShutdownHooks()` in `main.ts` is what makes a `docker stop` take 0.24 s rather than Docker's 10 s timeout: Node as process 1 ignores SIGTERM unless a handler is installed.
- `apps/api/src/app/serve-frontend.ts`, called from `configureApp` when a `frontendDir` is given: `compression()` and the two headers registered before every route, so the API's responses get them too; `useStaticAssets` with `index.html` at `no-cache` and any file whose name carries Angular's eight-character hash at `public, max-age=31536000, immutable`; a fallback that sends `index.html` for a `GET`/`HEAD` that accepts HTML outside the API prefix and passes everything else on. `x-powered-by` is disabled. `compression` (already in the tree through webpack-dev-server) is now a declared dependency, with its types as a dev dependency.
- Seam 2, `apps/api/src/app/frontend-serving.spec.ts`, booting the application with a stand-in frontend directory carrying the file names Angular emits: the page at the root and on a deep route, never cached; the hashed bundle and font immutable for a year, `favicon.ico` not; the bundle and the list compressed for a client that accepts it; the API still answering under its prefix, a missing User still a JSON 404, an unknown route under `/api` and a request that does not want a page both kept away from the page; the headers on every response; and, without a directory, no page at all, as the other specs and development have it. 14 cases; the API suite is 52 green.
- `deploy/smoke-test.sh`, 18 checks against the running container, all green locally: the API root, all 100 Users, User 74 fetched by its repaired numeric id, a JSON 404, the docs, the page at `/`, `/users/7` and `/smiley`, the fallback staying out of `/api`, the bundle immutable, `index.html` and the deep route `no-cache`, the bundle and the list compressed, `nosniff` on three paths, no `X-Powered-By`.
- Persistence through a volume, checked by hand: a User created as id 101 against a named volume is still there, "Loaded 101 Users from /data/users.json", after the container is removed and a new one started on the same volume.
- `.github/workflows/ci.yml`, in English: `checks`, `image` and `e2e` in parallel, `deploy` after all three on a push to `main`, joining the tailnet with `tailscale/github-action` and calling `POST /api/application.deploy`. Prose paths are ignored so a README or ticket edit does not cost a run or trigger a deployment that ships the same files. Actions pinned to the current majors (checkout and setup-node 7, cache 5, upload-artifact 7, tailscale 4).
- README: the public URL at the top, `deploy/` and `.github/workflows` in the layout, a Deployment section with the image, the served frontend's four jobs, the three environment variables and the volume, the Dokploy steps and the check-then-ship arrangement; "thirteen tickets".

Noted, not changed: an unknown route under `/api` such as `/api/nothing` answers with Express's default HTML "Cannot GET" page, not JSON, and did so before this ticket; the missing-User 404 is JSON because the controller throws it. The smoke test and the spec assert only that the page is not served there.

**Open and only doable at the infrastructure:** the DNS record, the Dokploy application with its domain and volume, the Tailscale ACL and OAuth client, and the five repository secrets (`TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DOKPLOY_URL`, `DOKPLOY_API_KEY`, `DOKPLOY_APPLICATION_ID`), none of which exist for this repository yet (`gh secret list` is empty). All of it needs Cloudflare, Tailscale and the server. A wizard at `tmp/deploy-wizard.sh` (git-ignored, one run) walks through those steps in order and writes the secrets with `gh`. Until they exist, the `deploy` job fails at the tailnet step while the three checks before it run as they should. The ticket therefore stood on `ready-for-human`, as ticket 18 of narkose did at the same point.

## Checked at the deployment

`user-directory.denniskasper.dev` is up. The infrastructure steps were done by hand through the wizard: the tailnet policy already carried `tag:ci` and a grant to the Dokploy host on port 3000 from the narkose setup, in the newer `grants` syntax; the existing OAuth client was reused; the A record points at the same server the zone's other records name, proxy off; the Dokploy application has its domain, the volume at `/data` and Auto Deploy off. Checked against the public URL, not the local container:

- **All 18 smoke checks pass** over verified TLS and HTTP/2: the API root, all 100 Users, User 74 by its numeric id, a JSON 404, the docs, the page at `/`, `/users/7` and `/smiley`, the fallback staying out of `/api`, the bundle immutable and `index.html` `no-cache`, the bundle and the list gzipped, `nosniff` everywhere, no `X-Powered-By`.
- **The deployed bundle is the committed one.** Its name, `main-KPQGDOG7.js`, is the same hash the local build of this tree produces.
- **Both viewports in a real browser** (Playwright Chromium, Pixel 7 and Desktop Chrome): the deep link `/users/7` opens Sarah Russell's detail, full-screen on the phone and as a centred dialog over the list on the desktop; `/smiley` loads; no console errors, page errors or failed requests at either width.

One thing the public URL caught that the local container could not: the smoke test matched the docs' status line as `http/1.1 200`, and behind Dokploy the line reads `HTTP/2 200`. The check now matches the status code alone.

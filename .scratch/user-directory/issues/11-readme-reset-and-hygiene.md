# 11: README, reset script and submission hygiene

**What to build:** Everything a reviewer needs to clone the repository, run it, and understand the decisions behind it — particularly the handling of the malformed Seed Data, which is the judgement call this challenge is really testing.

**Blocked by:** 08, 09, 10

**Status:** done

- [x] README covers installing dependencies and starting both applications
- [x] README documents any data scripts
- [x] README explains what was wrong with the Seed Data, what was repaired, what was cleared, and why
- [x] README states plainly that strict rules apply to new input rather than retroactively to stored Users
- [x] README records assumptions, architectural decisions and known limitations, including the single-process write constraint
- [x] A script resets the store to a clean starting state
- [x] Challenge materials are excluded from the repository; agent tooling is retained
- [x] The repository can be cloned, installed and run from scratch with no undocumented steps

## Comments

Implemented. Verified against the acceptance criteria:

- README covers requirements (Node 22.12+, npm 10+), `npm install`, the one-off `npx playwright install chromium`, and starting both applications together (`npm start`), individually, or bound to the LAN for a phone; it names where the directory, the smiley and the API documentation are served.
- README documents the one data script, `npm run reset`, what it removes and what it never touches, the `DATA_DIR` override both it and the API honour, and what to do when a hand-edited store is rejected at startup.
- README has a Seed Data section: a table of the 13 records that fail today's creation rules and their defects; what was repaired (two misspelled field names, two text ids), what was cleared (one impossible birth date, three unusable emails) and why; and what was left alone (User 25 with no email at all, User 5's `invalid-number` phone since no phone format is specified). This settles ticket 04's open question: ADR-0001's 13 is the count of records that carry a defect, Normalization touches 12 of them, and the thirteenth is User 25 with no email, not User 5's phoneNumber as ticket 04 guessed. Run over the raw Seed Data, the creation schema rejects 11 (it has no id field, so the two text ids pass it unrepaired) and the stored schema 9 (birthDate is optional, so the three `birthDtae` admins pass it with their birth dates lost). The ADR's 13 is the honest count of what would be lost or mangled by any strict read and is left as is; the README says "carry a defect" rather than "fail the rules". The spec's Further Notes observation about the three `birthDtae` admins is stated plainly.
- README states in bold that the strict rules apply to new input and are not applied retroactively to stored Users, and explains the two schemas per ADR-0001.
- README records assumptions, the architectural decisions (shared rules module, refinement over union, framework validation and NestJS 12 per ADR-0002, strict writes and tolerant reads, the queued and atomic persistence, workspace layout per ADR-0003, theme, mobile-first, smiley), the three test seams, and known limitations, the single-process write constraint first.
- At the user's request, README notes that the repository was developed agentic-coding first, with a closing section on how: documents first, then coding agents working ticket by ticket from the spec, glossary and ADRs using the skills under `.agents/skills/`.
- `tools/reset-store.mjs`, aliased as `npm run reset`, removes `$DATA_DIR/users.json` (default `data/users.json`) and any `users.json.*.tmp` an interrupted write left beside it, keeps the directory and anything else in it (a `users.json.bak` survives, and the spec says so), and says what it removed or that there was nothing to. It resolves the store the same way `users-store-path.ts` does. Tests at Seam 2 (`apps/api/src/app/users/reset-store.spec.ts`), through the application that starts after the script: a created User is gone and the next start reports Normalization again; a stray temporary file is removed; running with nothing to remove succeeds and says so.
- Hygiene: `challenge/` and `*.zip` were already git-ignored and nothing under them is tracked; `data/` and `tmp/` are ignored; `.agents/skills`, the `.claude/skills` symlink, `skills-lock.json`, `.scratch/` and `docs/agents/` are retained and now explained in the README.
- Clone-from-scratch: verified by cloning the committed tree into a temporary directory and following the README only: `npm ci` (1391 packages), `npm run typecheck`, `npm test` (all suites), `npm run build`, `npm run reset` with no store ("Nothing to remove"), `npm run start:api` (100 Users listed, `/api/docs` answers 200, User 74 fetched by numeric id, a viewer created as id 101, an admin without phoneNumber and birthDate rejected with both fields named, the Normalization report logged with 12 of 100), `npm run reset` with a store (removed), and `npm run e2e` (18 passed at both viewports). No undocumented step was needed.

Code review (standards + spec axes) led to: the README saying the 13 records "carry a defect" rather than "fail the rules", since the creation schema alone rejects 11 (above); the reset script removing only `users.json.*.tmp` rather than every `users.json.*` sibling, with a spec case proving an unrelated file survives; the glossary's `phoneNumber` and `Users` in the README's prose where it had drifted to "phone number" and "people"; the reset spec's header no longer claiming it never inspects a file, its stdout assertion moved before the restart, and its nothing-to-remove case asserting the store path rather than wording; `users-store-path.ts` and `FileUsersRepository` naming the reset script that mirrors their path and temp-file name, since the `.mjs` cannot import them; the HTTP-level tests described as booting per suite or per test. Left as-is on purpose: `Status: done` on the ticket, which every ticket in this effort uses; the commit typed `docs`, since the README is the deliverable and the script serves it; the `DATA_DIR` default spelled in the script as well as in `users-store-path.ts`, cross-language and one line, now cross-referenced both ways.

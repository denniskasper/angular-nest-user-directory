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
- README has a Seed Data section: a table of the 13 records that fail today's creation rules and their defects; what was repaired (two misspelled field names, two text ids), what was cleared (one impossible birth date, three unusable emails) and why; and what was left alone (User 25 with no email at all, User 5's `invalid-number` phone since no phone format is specified). This settles ticket 04's open question: ADR-0001's 13 is the count of records that fail the strict rules (checked by running the creation rules over the Seed Data), Normalization touches 12 of them, and the thirteenth is User 25, not User 5's phone as ticket 04 guessed. The ADR count is right and left as is. The spec's Further Notes observation about the three `birthDtae` admins is stated plainly.
- README states in bold that the strict rules apply to new input and are not applied retroactively to stored Users, and explains the two schemas per ADR-0001.
- README records assumptions, the architectural decisions (shared rules module, refinement over union, framework validation and NestJS 12 per ADR-0002, strict writes and tolerant reads, the queued and atomic persistence, workspace layout per ADR-0003, theme, mobile-first, smiley), the three test seams, and known limitations, the single-process write constraint first.
- At the user's request, README notes that the repository was developed agentic-coding first, with a closing section on how: documents first, then coding agents working ticket by ticket from the spec, glossary and ADRs using the skills under `.agents/skills/`.
- `tools/reset-store.mjs`, aliased as `npm run reset`, removes `$DATA_DIR/users.json` (default `data/users.json`) and any `users.json.*.tmp` an interrupted write left beside it, keeps the directory and anything else in it, and says what it removed or that there was nothing to. It resolves the store the same way `users-store-path.ts` does. Tests at Seam 2 (`apps/api/src/app/users/reset-store.spec.ts`), through the application that starts after the script: a created User is gone and the next start reports Normalization again; a stray temporary file is removed; running with nothing to remove succeeds and says so.
- Hygiene: `challenge/` and `*.zip` were already git-ignored and nothing under them is tracked; `data/` and `tmp/` are ignored; `.agents/skills`, the `.claude/skills` symlink, `skills-lock.json`, `.scratch/` and `docs/agents/` are retained and now explained in the README.
- Clone-from-scratch: verified by cloning the committed tree into a temporary directory, `npm ci`, typecheck, test, build, `npm run reset`, starting the API and fetching the list and the documentation, and the browser tests (see the comment below for the result).

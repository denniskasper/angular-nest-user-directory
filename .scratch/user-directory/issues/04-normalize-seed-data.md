# 04: Normalize the Seed Data

**What to build:** All 100 Users appearing correctly. The malformed records in the Seed Data are repaired where the intent is unambiguous and preserved with unusable values cleared where it is not — once, rather than on every start. Per ADR-0001.

**Blocked by:** 03

**Status:** done

- [x] All 100 Users are listed
- [x] Values stored under misspelled field names appear under their canonical names
- [x] Ids held as text are numbers (fetching such a User by id is proved when ticket 05 adds the endpoint)
- [x] Values that cannot be salvaged are cleared rather than causing the whole record to be discarded
- [x] Normalization runs once, not on every start
- [x] The original Seed Data is never modified
- [x] Startup reports how many records were repaired, which fields were cleared, and for which ids
- [x] Verified through the API seam; no separate seam is opened on the normalizer

## Comments

Implemented. Verified against the acceptance criteria through the API seam (`apps/api/src/app/users/normalization.spec.ts`), booting the whole application against a store in a fresh temporary directory:

- All 100 Users are listed after starting against the Seed Data.
- Users 5, 88 and 91 carry their first name under `firstName` (was `fistName`); Users 2, 3 and 4 carry their birth date under `birthDate` (was `birthDtae`). With that rename the three admins satisfy the admin rule, as the spec's Further Notes predicted.
- Users 74 and 96 have numeric ids. There is no `GET /api/users/:id` yet, so the "fetching by id succeeds" half of that criterion is proved when ticket 05 adds the endpoint; this ticket proves the id type. The checklist line is reworded to say so rather than claim more than the tests show.
- User 1's impossible birth date (`31-31-9999`) and the `not-an-email` addresses on Users 8, 38 and 82 are cleared, so those fields read as absent while the Users remain. Twelve records are repaired in total.
- Normalization runs once: a second start against the same store logs no report and serves the store as written. The Seed Data asset is byte-for-byte unchanged after a start.
- Startup logs one report naming the count of repaired records and, per id, what was renamed, converted or cleared (with the cleared value).

How it is built: `normalizeSeedData` (`apps/api/src/app/users/normalization.ts`) renames the two known misspellings, converts an id held as a string of digits, then parses against the shared `storedUserSchema` and clears only `email`, `phoneNumber` or `birthDate` when the schema rejects them. A record that still fails afterwards throws at startup with its id, since silently dropping a User is what ADR-0001 forbids. `FileUsersRepository` replaces `SeedUsersRepository` behind the unchanged `UsersRepository` interface: it reads `$DATA_DIR/users.json` (default `data/users.json`, git-ignored) into memory, and when the file is absent runs Normalization and writes the store via a temporary file and rename. The API specs share `apps/api/src/testing/boot-app.ts`, which boots the app the way `main.ts` does but overrides the store path, so no spec touches the real data directory.

Noticed and left alone: User 5's phoneNumber is `invalid-number`. The stored schema accepts any string as a phoneNumber and the spec defines no phone format, so it is kept verbatim rather than cleared. This is why the report says 12 records where ADR-0001 counts 13 Legacy Records: the ADR counts the phone as a defect, Normalization does not touch it. Worth a line in the README (ticket 11), and the ADR's count may want reconciling.

Code review (standards + spec axes) led to: the store is validated against `storedUserSchema` on every read, so a corrupt or hand-edited store fails at startup with a message naming the file and how to recover, rather than serving malformed Users (previously a bare cast); the rename entries in the report are structured `{ from, to }` and `describeReport` lives beside the report types in `normalization.ts`; the log assertions check ids and fields rather than exact wording; the seed-untouched spec reads its baseline before any start. Left as-is on purpose: the temporary-file-and-rename write, because this ticket performs a flush and the spec says every flush is written that way; the `DATA_DIR` override and `data/` default, which the git-ignore already anticipated and ticket 11's reset script needs.

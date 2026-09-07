# 07: Create a User

**What to build:** A new User can be added to the directory and is still there after a restart. This ticket owns the entire write path, so it also owns the guarantees that make concurrent writes safe.

**Blocked by:** 04

**Status:** done

- [x] A User can be created from the form and appears in the directory afterwards
- [x] The created User survives a restart
- [x] An id is assigned automatically and never collides, including under concurrent creation
- [x] Concurrent writes do not interleave
- [x] An interrupted write never leaves a partial or corrupted store
- [x] A confirmation is shown on success, and a clear message on failure
- [x] The server rejects input that the form would have rejected
- [x] The form is single-column and full-width on phones, and may use two columns from tablet up
- [x] Nothing above the repository boundary touches the filesystem

## Comments

Implemented. Verified against the acceptance criteria:

- `POST /api/users` validates the body against the shared `createUserSchema` (`libs/shared/src/lib/create-user.ts`) through Nest 12's `StandardSchemaValidationPipe` via `@Body({ schema })`, the same mechanism ticket 06 established for the query (ADR-0002). The schema is strict: names must be non-blank after trimming, `email` must be one, `phoneNumber` and `birthDate` may be absent but not blank, `role` is one of the three, and an `id` in the body is stripped. Every issue names one field. Which Roles require `phoneNumber` and `birthDate` is ticket 08's refinement on this same schema.
- `UsersRepository.create` is the only write. `FileUsersRepository` runs every write through one promise chain, assigns `max(id) + 1` inside it, writes the whole collection to a temporary file and renames it into place, and only then commits the new collection to memory — so concurrent creations cannot collide or interleave, an interrupted flush leaves the previous store intact, and a failed write is not served. Nothing above the repository touches the filesystem.
- The form (`apps/frontend/src/app/users/create-user-page.*`, route `/users/new`, reached from the "Add a User" nav link) is an Angular 22 signal form. One `validateTree` rule parses the draft with the shared schema and attaches each issue to the control at its path, so the browser never accepts what the server rejects; blanks in the optional fields are sent as absences, and the value validated is exactly the value posted. Errors appear inline under the control once it has been visited or a submit was attempted, with `aria-invalid` and `aria-describedby`. The three Roles are a radio group presented as pills that take their Role's seal tint when chosen.
- The outcome is a notice (`Notices` service, `<app-notice>` in the shell): a success names the User and the id the server gave them and clears itself after seven seconds; a failure stays until dismissed — a 400 quotes the server's field messages, anything else reads as a connection problem. On success the form navigates to the directory searched for the new Full Name, so the new User is what the list shows.
- Single column and full width on phones; from tablet up the name pair, the contact pair, and birth date with Role sit side by side, with the group titles in a margin column and the sheet held at 44rem. Verified at Pixel 7 and 1280px in both colour schemes.
- Tests: Seam 1 `libs/shared/src/lib/create-user.spec.ts` (accepted with and without the optionals; each field rejected by name; several fields named at once; id ignored). Seam 2 `apps/api/src/app/users/create-user.spec.ts` (created, assigned 101, fetched and listed; kept across a restart against the same store; 20 concurrent creations get 101–120 and all 120 are read back after a restart; a bad body is a 400 naming every field and stores nothing; a sent id is ignored). Seam 3 `apps/frontend-e2e/src/create.spec.ts`, the third of the four browser specs: layout at both widths, an empty and a bad-email submit rejected in the browser with no request made, a failed request reported and the draft kept, then a successful creation with the confirmation, the URL and the new entry in the directory.
- The test harness (`boot-app.ts`) now listens on an ephemeral port so supertest shares one server across parallel requests; before, each request started and stopped the unlistened server and the concurrent case reset itself. Playwright's API server now runs against `tmp/e2e/data`, wiped at each launch, so browser runs neither write to the real `data/` store nor accumulate Users; and the creation spec runs in `desktop-create`/`phone-create` projects that depend on `desktop` and `phone`, since it grows the directory the list and search specs count.

Code review (standards + spec axes) led to: the browser suite never reusing an API already running on port 3000, which would have been serving the real store the creation spec writes to; `BootedApp.restart()` in the test harness, replacing the close-then-boot-again dance that closed the app twice; error notices in their own `role="alert"` region, successes in the `role="status"` one, both always present; a submit rejected in the browser moving focus to the first control at fault (whose error is read with it) instead of six inline alerts firing at once, and `aria-invalid` on the Role radios; the running-title and icon-button shapes lifted to global `.eyebrow` and `.icon-button` classes, used by the directory head, the detail and this page; the phone/desktop rule read from the shared e2e helper everywhere; the payload parse moved inside the request's `try`. Left as-is on purpose: a success landing on the directory searched for the new Full Name, which is how "the list reflects my new User" is made true rather than left to a page the User may not be on; trimming names and phone numbers, since surrounding whitespace is never part of a name; an `id` in the body stripped rather than rejected, which is the schema's normal handling of an unknown key and is tested. Handed to ticket 08 (noted there): the `touched()` gate on inline errors, and the 400 body still in Nest's default prose shape.

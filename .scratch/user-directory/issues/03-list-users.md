# 03: List Users end-to-end

**What to build:** The directory itself — every User from the Seed Data, visible and readable at any screen size. This is the tracer bullet: the first ticket that cuts through the shared module, the API and the UI together.

**Blocked by:** 02

**Status:** done

- [x] Requesting the list of Users with no parameters returns every User
- [x] Each User shows id, Full Name, email and Role
- [x] Phone viewports show a stacked per-User presentation with no horizontal scrolling
- [x] Tablet and wider show the tabular presentation
- [x] Users missing an email, phoneNumber or birthDate still appear, with absent fields reading as absent rather than as broken values
- [x] Tests at the shared-module and API seams cover the read path
- [x] A browser spec covers the list rendering at both phone and desktop widths
- [x] Legacy Records with misspelled field names may still render imperfectly; that is expected until ticket 04

## Comments

Implemented. Verified against the acceptance criteria:

- `GET /api/users` returns all 100 Users from the Seed Data, committed as an application asset (`apps/api/src/assets/seed/users.json`) and served as-is through a `UsersRepository` seam (`SeedUsersRepository` for now; the file store and write queue land behind the same interface later).
- The shared module gained `storedUserSchema` (the tolerant stored schema per ADR-0001, Zod 4), the `User` type inferred from it, and `fullName()`. Zod is now a direct dependency.
- The list page (`apps/frontend/src/app/users/user-list-page.*`) reads the list as an `httpResource` and renders it twice from one source: a stacked `<ul>` of entries on phones and a native-element Material table from tablet up. The switch is a media query through `bp.up(tablet)`, so the breakpoint stays defined once in SCSS and no TypeScript copy was needed. Each User shows id, Full Name, email and Role; Role is a tinted chip per Role.
- An absent email reads "No email" in the stacked entry and a muted dash with screen-reader text in the table; nothing renders as `undefined` for absent fields.
- Tests: Seam 1 `libs/shared/src/lib/user.spec.ts` (stored schema accepts complete and Legacy Records, rejects an unknown Role and a text id); Seam 2 `apps/api/src/app/users/users.spec.ts` (count, a known User's fields, absent fields absent); Seam 3 `apps/frontend-e2e/src/list.spec.ts` at phone and desktop (presentation switch with no horizontal scroll, all 100 listed with a known User's fields, absent email). Playwright now boots the API alongside the frontend.
- Removed the ticket-02 landing placeholder from the shell; the footer still renders `USER_ROLES` from the shared module.

Known, expected until ticket 04: Users 5, 88 and 91 hold their first name under `fistName` and so render as "undefined Taylor" and the like; Users 74 and 96 have text ids; the unsalvageable emails (for example `not-an-email` on User 8) render verbatim rather than as absent, because clearing them is Normalization's job. The cast in `SeedUsersRepository` is commented as the deliberate lie it is until then.

Code review (standards + spec axes) led to: the easing curve and `rise` keyframes moved to `styles/_motion.scss` shared by the shell and the list; the API's global prefix now lives once in `configure-app.ts`, used by `main.ts` and the HTTP-level specs; `.sr-only` became a global utility; the browser spec proves the id with an exact-text match and folds the absent-email case into the list test to keep the spec count at the four the spec asks for. Left as-is on purpose: `UsersService` only delegates today (search and paging land there in ticket 06), and the total tally and loading/error states are kept because story 5 and the resource-based read model call for them.

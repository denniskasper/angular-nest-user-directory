# 05: View a single User's details

**What to build:** Selecting a User from the directory opens their full detail, fetched individually so what is shown is current rather than whatever the list happened to hold.

**Blocked by:** 03

**Status:** done

- [x] Selecting a User opens their details
- [x] Details show Full Name, email, phoneNumber, birthDate and Role
- [x] The User is fetched individually rather than reused from the list
- [x] Requesting an id that does not exist returns a not-found response, distinguishable from a broken one
- [x] Full-screen presentation on phones, centred dialog from tablet up
- [x] Dismissing returns to the list with browsing position intact

## Comments

Implemented. Verified against the acceptance criteria:

- `GET /api/users/:id` returns the User holding that id, `404` with a body naming the id when no User does, and `400` when the id is not a number — so absent, malformed and broken are three different answers. `UsersRepository` gained `findById`; `UsersService` raises the not-found; the controller parses the id with `ParseIntPipe`. The known-id case fetches User 74, whose id was text in the Seed Data, closing the half of ticket 04's criterion that was deferred here.
- Selecting a User opens their detail: each name in the list is a link to `users/:id`, stretched over the whole entry or row (`.stretched`, global) so any of it is the target while the name stays the accessible label. The detail route is a *child* of the list route, so the list stays mounted underneath with its scroll position intact.
- `UserDetail` (`apps/frontend/src/app/users/user-detail.*`) reads the route id through `withComponentInputBinding` and fetches `/api/users/:id` as its own `httpResource`, never reusing the list's data. It shows Full Name, email (a `mailto:` link), phoneNumber, birthDate (a `<time>` with the ISO value, displayed as a long date) and the Role seal; absent fields read "Not recorded". A `404` or `400` reads "No User with id N"; any other failure reads as broken with a retry.
- The presentation is a native `<dialog>` opened with `showModal()`: a full-screen sheet rising from the bottom on phones, a centred card from tablet up, both entirely in the component's SCSS (mobile-first, `bp.up(tablet)` additive). Native modal gives the focus trap, Escape and focus restoration for free; a backdrop click also dismisses. `body:has(dialog[open])` locks scrolling and `scrollbar-gutter: stable` keeps the layout from shifting when it does.
- Dismissing returns to the list: opened from the list, it steps back in history so Back afterwards does not reopen the dialog; opened directly from a link, it navigates to the list. Query params are preserved both ways, so ticket 06's page and search survive the round trip.
- Tests: Seam 2 `apps/api/src/app/users/users.spec.ts` (known id, unknown id, malformed id). Seam 3: the list spec in `apps/frontend-e2e/src/list.spec.ts` now also opens User 74, checks the individual fetch, the fields, full-screen at phone width and centring over the content column at desktop, the scroll position after dismissing, and the not-found reading — folded into the existing list test to keep the browser spec count at the four the spec asks for, as ticket 03 did. Dialog geometry is measured after the entrance animation settles, and the browsing position is read once the dialog is open rather than before the click: Playwright's click re-scrolls the link into view if the rows' staggered entrance is still pending, which once made the assertion flake; the app itself does not move the page on focus or on dismiss.
- Shared styling moved to global partials as the ticket 03 review established: the Role seal and absent marker to `styles/_marks.scss`, the brand thread gradient to a `brand.thread` mixin (used by the shell and the dialog's top edge), and the pill button shape to `.pill-button` in `styles.scss`.

Code review (standards + spec axes) led to: the browser test folded into the list spec rather than added as a fifth; the dialog's four-way state cascade collapsed into one computed `title` and `absent`/`broken` signals; a malformed id (`400`) reading as absence in the UI instead of a broken request with a retry that could never succeed; dismiss stepping back in history instead of navigating forward to the list; the retry button deduplicated into `.pill-button`; the API spec's boot hoisted to file level; the phone flag exposed from the e2e helper; the stray `html` block folded into the theme block. Left as-is on purpose: the `waitForResponse` on `/api/users/74`, because "fetched individually" is a stated criterion and the response is the only observable of it; `queryParamsHandling: 'preserve'`, which ticket 06 needs; the humanised labels "Phone number" and "Birth date", which are the reading forms of `phoneNumber` and `birthDate` rather than the avoided synonyms; the `mailto:` link and retry, which are small and consistent with the list page's error state.

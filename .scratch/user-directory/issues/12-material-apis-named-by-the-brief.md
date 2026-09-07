# 12: Use the Angular APIs the challenge names

**What to build:** The same directory, detail, creation form, notices and smiley, built on the Angular and Angular Material APIs the challenge brief names explicitly, so an assessor grading against the brief's wording finds each one where they expect it. Nothing a person sees or a test asserts changes: the behaviour, the mobile-first layouts, the shared rules and the three test seams all stay as they are.

The brief says, verbatim: "Use Angular Reactive Forms", "Clicking a user row opens a Material Dialog", "Display success and error messages using Angular Material Snackbar", and "a standalone Angular component called SmileyComponent". The implementation chose a signal form, a native `<dialog>`, a custom notice outlet and `SmileyPage`, each for a reason recorded in tickets 05, 07 and 09. Those reasons were sound but the brief is unambiguous, and this is an assessment; the choice is reversed rather than argued.

**Blocked by:** 11

**Status:** ready-for-agent

- [ ] The creation form is a Reactive Form (`ReactiveFormsModule`, a `FormGroup` of `FormControl`s) validated by the shared `createUserSchema`; every issue is attached to the control at its path, and Role-dependent errors appear against their field the moment the Role changes, including on controls nobody has visited yet
- [ ] Its controls are Material form fields (`mat-form-field` with `matInput`, `mat-select` for the Role) with errors shown in `mat-error`, full-width and single-column on phones, two columns permitted from tablet up
- [ ] The User detail opens in a `MatDialog`, fetches the User individually, shows Full Name, email, phoneNumber, birthDate and Role, and dismisses by Close, Escape and backdrop; full-screen on phones, centred from tablet up
- [ ] Success and error outcomes are shown with `MatSnackBar`; a success names the created User, an error is readable and dismissible, both are announced to assistive technology
- [ ] The list is paginated with `MatPaginator` at 25 per page, reachable and tappable at phone width without horizontal scrolling
- [ ] The smiley component's class is `SmileyComponent`, still standalone, still on `/smiley`, still built without positioning, images or vectors
- [ ] The shared `createUserSchema` remains the only definition of what a new User must provide; no rule is restated in the form
- [ ] The existing Seam 2 and Seam 3 specs pass unchanged in what they assert; selectors may change, expectations may not
- [ ] `spec.md`'s Frontend composition paragraph names these APIs, and the README's Decisions section says the brief's named APIs are used
- [ ] The stacked per-User presentation on phones and the `/api` route prefix stay as they are (not in this ticket; documented in the README)

## Notes for the implementer

- The hard part is the Reactive Forms version of what ticket 08 proved: a field a Role has just made required is at fault the moment the Role is chosen, before anyone visits it. A single group-level validator that parses the whole value with `createUserSchema` and writes each issue onto the control at its path (`setErrors`) re-runs on any value change; the `CONDITIONAL_REQUIREMENT` marker from the shared module is what lets an untouched control show that error while ordinary "malformed value" errors wait for a visit. Blanks in `phoneNumber` and `birthDate` must be sent as absences, as today.
- `MatDialog` opened from a route keeps the URL-driven detail (`/users/:id`) working: open the dialog in the routed component and navigate back on close, so a deep link still opens the detail and dismissing still returns to the list with its page and search intact. Full-screen on phones is `maxWidth: '100vw'` plus a panel class, from tablet up the default centred panel.
- `MatSnackBar` replaces `Notices`/`NoticeOutlet` entirely; a success may auto-dismiss, an error should carry an action so it stays until dismissed, matching what ticket 07 settled.
- `MatPaginator` emits page changes; keep paging a navigation (query parameter) so a URL still reproduces what was on screen, as ticket 06 settled.
- Keep the Material 3 theme and the brand custom properties; the new components pick up the theme through `mat.theme` already applied in `styles.scss`.
- Tests: no new seam. Update the Seam 3 selectors and the `presentation.ts` helpers as needed, keep the four directory specs and the shell spec asserting exactly what they assert now, at both viewports.

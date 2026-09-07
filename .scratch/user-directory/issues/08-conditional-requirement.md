# 08: Conditional Requirement by Role

**What to build:** The rule that makes this directory non-trivial: which fields a User must provide depends on their Role, the browser and the server both enforce it from one definition, and the person filling in the form is told exactly what is missing as soon as it becomes missing.

**Blocked by:** 07

**Status:** done

- [x] Selecting admin requires both phoneNumber and birthDate
- [x] Selecting editor requires phoneNumber
- [x] Selecting viewer requires neither
- [x] Required fields update the moment the Role changes, without resubmitting
- [x] Errors appear inline against the specific field at fault
- [x] An error in an unrelated field does not suppress the Role-dependent errors
- [x] The server enforces the identical rule from the same shared definition; the rule is not written twice
- [x] Validation failures are returned keyed by field name
- [x] Shared-module tests cover all three Roles, accepted and rejected, asserting the field named in each issue
- [x] A Role outside the three permitted values is rejected
- [x] A browser spec selects admin, leaves phoneNumber empty, and asserts the inline error

## Comments

From ticket 07's review, two things this ticket inherits rather than starts from blank:

- The form (`apps/frontend/src/app/users/create-user-page.ts`, `errorOf`) shows a field's error once it is `touched()` — visited, or a submit attempted. "Required fields update the moment the Role changes, without resubmitting" needs a never-visited phoneNumber to show its error as soon as admin is chosen, so that gate has to be replaced, not extended.
- The 400 body is still Nest's default `message: string[]` ("field: message"). `apps/api/src/app/users/create-user.spec.ts` asserts that shape and `describeFailure` in the form quotes it; both are rewritten when this ticket keys the body by field name (spec.md, API contract) and maps it onto controls.

Implemented. Verified against the acceptance criteria:

- The rule lives once, in `libs/shared/src/lib/conditional-requirement.ts`: a table of the fields each Role requires (`requiredFieldsFor`), and the message for a field a Role wants (`An admin must have a phone number`). `createUserSchema` enforces it as a `superRefine` over the flat object, one `custom` issue per missing field at that field's path, with `when: () => true` so it runs even when another field has already failed. Its issues carry `params.rule = 'conditionalRequirement'`, and `isConditionalRequirementIssue` tells them apart from a malformed value. A Role outside the three is rejected by the enum before the refinement, which then does nothing.
- The server enforces it through the same schema, unchanged: the `@Body({ schema })` pipe from ticket 07. What changed is the 400 body. `configureApp` gives the Standard Schema pipe an `exceptionFactory` that answers with the shared `validationFailure` shape — `{ statusCode, error, message, fields }`, `fields` keyed by field name with a list of messages each. The query validation from ticket 06 answers the same way (`fields.page`).
- The form maps a Conditional Requirement issue onto its control as a `conditionalRequirement` error rather than a `standardSchema` one, and the `touched()` gate is replaced: a `standardSchema` error (the person's own entry, malformed or missing for every User) still waits until the control was visited or a submit attempted, while any other kind shows at once. So choosing admin marks a never-visited phoneNumber the moment it is chosen, and the marks follow the Role as it changes. Each label a Role requires also carries a small seal in that Role's tint, `Required for admin`, read from `requiredFieldsFor`, so the requirement is visible before and after the field is filled.
- A 400 from the server is no longer quoted as prose: `submit`'s action returns the field-keyed messages as `server` errors on the controls they name, with a notice pointing at them, and focus moves to the first control at fault as it does for a browser-side rejection. A body without fields is reported in the notice.
- Tests: Seam 1 `libs/shared/src/lib/conditional-requirement.spec.ts` (all three Roles accepted and rejected, the field named in each issue; both admin fields named at once; an unrelated error not suppressing the Role's; the message and the marker; a non-record input) and `validation-failure.spec.ts`. Seam 2 `apps/api/src/app/users/create-user.spec.ts` (the field-keyed 400 body; admin without either field, editor without phoneNumber, viewer with neither accepted; a Role-dependent fault alongside an unrelated one) and the page query assertion updated. Seam 3 `apps/frontend-e2e/src/conditional-requirement.spec.ts`, the fourth browser spec, at both widths: admin chosen with nothing visited shows both errors and both seals, `aria-invalid` and the description on phoneNumber, the error under its own line, an email fault not hiding them, filling clearing the fault but keeping the seal, editor and viewer following, and no request ever made.
- Found on the way: the error line's `↳` was generated content read by assistive technology as part of the message; it is now declared decorative (`content: '↳ ' / ''`).

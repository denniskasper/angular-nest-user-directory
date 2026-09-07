# 08: Conditional Requirement by Role

**What to build:** The rule that makes this directory non-trivial: which fields a User must provide depends on their Role, the browser and the server both enforce it from one definition, and the person filling in the form is told exactly what is missing as soon as it becomes missing.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Selecting admin requires both phoneNumber and birthDate
- [ ] Selecting editor requires phoneNumber
- [ ] Selecting viewer requires neither
- [ ] Required fields update the moment the Role changes, without resubmitting
- [ ] Errors appear inline against the specific field at fault
- [ ] An error in an unrelated field does not suppress the Role-dependent errors
- [ ] The server enforces the identical rule from the same shared definition; the rule is not written twice
- [ ] Validation failures are returned keyed by field name
- [ ] Shared-module tests cover all three Roles, accepted and rejected, asserting the field named in each issue
- [ ] A Role outside the three permitted values is rejected
- [ ] A browser spec selects admin, leaves phoneNumber empty, and asserts the inline error

## Comments

From ticket 07's review, two things this ticket inherits rather than starts from blank:

- The form (`apps/frontend/src/app/users/create-user-page.ts`, `errorOf`) shows a field's error once it is `touched()` — visited, or a submit attempted. "Required fields update the moment the Role changes, without resubmitting" needs a never-visited phoneNumber to show its error as soon as admin is chosen, so that gate has to be replaced, not extended.
- The 400 body is still Nest's default `message: string[]` ("field: message"). `apps/api/src/app/users/create-user.spec.ts` asserts that shape and `describeFailure` in the form quotes it; both are rewritten when this ticket keys the body by field name (spec.md, API contract) and maps it onto controls.

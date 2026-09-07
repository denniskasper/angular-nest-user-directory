# Spec: User Directory

Status: done

## Problem Statement

There is no way to see, search or add the people recorded in the system. The Seed Data exists as a raw file, and part of it is malformed — misspelled field names, ids stored as text, an impossible birth date, several unusable email addresses — so anything reading it naively either shows broken rows or silently discards people.

Separately, what a User is *required* to provide is not uniform: it depends on their Role. Expressing that rule once, and having both the browser and the server agree on it, is the core difficulty. If the two disagree, a form can accept input the server rejects, or reject input the server would accept.

## Solution

A User Directory: a paginated, searchable list of Users, a detail view for any single User, and a form for adding new ones.

A single Conditional Requirement rule set lives in one shared place and governs both the form and the API, so the browser and the server can never disagree about whether a User is valid. As the Role selected in the form changes, the fields required change with it, live, and the messages shown name the specific fields at fault.

All 100 Users from the Seed Data appear in the directory. The malformed records are repaired where the intent is unambiguous and preserved with the unusable values cleared where it is not, rather than being dropped.

## User Stories

1. As a directory user, I want to see all Users in a table, so that I can survey who is in the system.
2. As a directory user, I want each row to show the User's id, Full Name, email and Role, so that I can identify people at a glance.
3. As a directory user, I want the table paginated at 25 Users per page, so that I am not overwhelmed by a single long list.
4. As a directory user, I want to move between pages, so that I can reach Users beyond the first 25.
5. As a directory user, I want to see how many Users exist in total, so that I know the size of what I am browsing.
6. As a directory user, I want to search by Full Name, so that I can find a specific person without paging through everything.
7. As a directory user, I want search to match across the first and last name together, so that typing part of a first name, a space, and the start of a last name finds the right person.
8. As a directory user, I want search to ignore letter casing, so that I do not have to match capitalisation exactly.
9. As a directory user, I want pagination to apply to my search results, so that a broad search stays navigable.
10. As a directory user, I want to click a row to open that User's details, so that I can see information the table does not show.
11. As a directory user, I want the detail view to show Full Name, email, phoneNumber, birthDate and Role, so that I have the complete picture of one person.
12. As a directory user, I want the detail view to fetch that User individually, so that what I see is current rather than whatever the list held.
13. As a directory user, I want the detail view to dismiss cleanly, so that I can return to browsing.
14. As a directory user, I want Users whose email or birthDate could not be salvaged to still appear, so that people are not missing from the directory because of a formatting defect.
15. As a directory user, I want absent fields to read as absent rather than as broken values, so that I can tell missing data from wrong data.
16. As an administrator, I want a form for adding a User, so that I can grow the directory.
17. As an administrator, I want to enter first name, last name, email, phoneNumber, birthDate and Role, so that I can describe the person fully.
18. As an administrator, I want to choose the Role from the three available values, so that I cannot invent one that does not exist.
19. As an administrator, I want to be told which fields are required as soon as I pick a Role, so that I know what is expected before I submit.
20. As an administrator selecting admin, I want both phoneNumber and birthDate to become required, so that the record meets the rule for that Role.
21. As an administrator selecting editor, I want phoneNumber to become required, so that the record meets the rule for that Role.
22. As an administrator selecting viewer, I want neither to be required, so that I am not asked for information that Role does not need.
23. As an administrator, I want the required fields to update the moment I change Role, so that the form reflects my current choice rather than a stale one.
24. As an administrator, I want errors shown against the specific field at fault, so that I know exactly what to fix.
25. As an administrator, I want a field error elsewhere in the form not to hide the Role-dependent errors, so that I can see everything wrong at once instead of fixing problems in waves.
26. As an administrator, I want a clear confirmation when a User is created, so that I know the action succeeded.
27. As an administrator, I want a clear message when creation fails, so that I am not left guessing.
28. As an administrator, I want the list to reflect my new User after creation, so that I can see the result of my work.
29. As an administrator, I want the server to reject anything the form would have rejected, so that the rules are not merely cosmetic.
30. As an administrator, I want a newly created User to be given an id automatically, so that I do not have to invent one.
31. As an administrator, I want my created User to survive a restart, so that my work is not lost.
32. As an API consumer, I want to request the full list of Users, so that I can consume the directory without knowing about pagination.
33. As an API consumer, I want to optionally request a page and a search term, so that I can retrieve only what I need.
34. As an API consumer, I want a paged response to tell me the total number of matches, so that I can render pagination myself.
35. As an API consumer, I want to fetch a single User by id, so that I can show one person.
36. As an API consumer, I want a clear response when a requested id does not exist, so that I can distinguish absent from broken.
37. As an API consumer, I want validation failures returned keyed by field name, so that I can attach each message to the right input without parsing prose.
38. As an API consumer, I want browsable API documentation, so that I can learn the contract without reading source.
39. As a maintainer, I want the Conditional Requirement rules defined exactly once, so that the browser and the server cannot drift apart.
40. As a maintainer, I want concurrent writes not to interleave, so that the persisted file is never corrupted or partially written.
41. As a maintainer, I want ids assigned without collision under concurrent creation, so that two Users can never share one.
42. As a maintainer, I want Normalization to run once rather than on every start, so that the stored data settles into a known-good shape.
43. As a maintainer, I want the original Seed Data preserved untouched, so that I can always see what was actually provided.
44. As a maintainer, I want a way to reset the stored data, so that I can return to a clean starting state.
45. As a maintainer, I want to see what Normalization repaired and cleared at startup, so that the repairs are visible rather than silent.
46. As a reviewer, I want an explanation of how the malformed Seed Data was handled, so that I can judge whether it was noticed and reasoned about.
47. As a reviewer, I want the shared rules used demonstrably by both applications, so that I can confirm the architecture rather than take it on trust.
48. As a reviewer, I want instructions to install and run both applications, so that I can start them without guesswork.
49. As a directory user, I want the interface to use the project's colours consistently, so that it reads as one designed product.
50. As a directory user, I want the interface to work in light and dark appearance, so that it suits my system preference.
51. As a directory user, I want to visit a dedicated page showing a smiley built purely from layout and styling, so that I can see the styling exercise.
52. As a directory user, I want that smiley to scale with my viewport, so that it works on any screen size.

53. As a directory user on a phone, I want the directory usable at the narrowest common screen width, so that I can browse without pinching or scrolling sideways.
54. As a directory user on a phone, I want each User's key details readable without horizontal scrolling, so that the list is usable on a narrow screen.
55. As a directory user on a tablet, I want the layout to use the extra width, so that space is not wasted.
56. As a directory user on a large desktop, I want content to stay within a comfortable reading width, so that the interface does not sprawl.
57. As a directory user on a phone, I want the detail view to use the full screen, so that information is not crammed into a small box.
58. As an administrator on a phone, I want the creation form in a single column with full-width controls, so that I can complete it comfortably one-handed.
59. As an administrator on a phone, I want inline errors to stay visible beside their field, so that I can see what to fix without losing my place.
60. As a directory user on a phone, I want pagination controls to remain reachable and tappable, so that I can move between pages.
61. As a directory user on a touch screen, I want tap targets large enough to hit accurately, so that I do not mis-tap adjacent controls.
62. As a directory user, I want the smiley page to scale to my viewport at any size, so that it looks intentional on any device.

## Implementation Decisions

**Shared rules module.** One module owns the vocabulary and rules for a User and is consumed unchanged by both applications. It exports two distinct schemas:

- A **creation schema**: strict, and the sole authority on what new input must satisfy, including the Conditional Requirement.
- A **stored schema**: tolerant, describing what may legitimately already exist in the store. `email`, `phoneNumber` and `birthDate` are permitted to be absent on a stored User.

These are deliberately different, per ADR-0001. A field may be required at creation and yet absent on a Legacy Record.

**The Conditional Requirement contract.**

| Role | phoneNumber | birthDate |
|---|---|---|
| `admin` | required | required |
| `editor` | required | not required |
| `viewer` | not required | not required |

Implemented as a refinement over a flat object rather than as a union keyed on Role, so that each issue carries the path of the specific field at fault and maps directly onto a single form control. The refinement is configured to run even when another field has already failed, so Role-dependent errors surface alongside other errors rather than after them.

**API contract.**

- Listing Users with no parameters returns the complete list.
- Listing with paging or search parameters returns a page of matches together with the total number of matches.
- Search matches a case-insensitive substring against the Full Name, and is applied before paging.
- Fetching a single User by id returns that User, or a not-found response.
- Creating a User validates against the creation schema, assigns the next id, persists, and returns the created User.
- Validation failures return a body keyed by field name, so a client can attach messages to controls without interpretation.
- API documentation is generated from the shared creation schema rather than described separately, so it cannot drift from the rules.

**Validation on the server** uses the framework's built-in schema validation against the shared creation schema. No bespoke validation layer is written; per ADR-0002 this is the reason for the framework version chosen.

**Persistence.** The collection is held in memory and is the source of truth for reads. Writes are serialised through a single queue so they cannot interleave, and each flush is written to a temporary file and moved into place, so an interrupted write can never leave a partial file. Id assignment happens inside that same serialised section, so concurrent creations cannot collide. Persistence sits behind a repository interface; nothing above it touches the filesystem.

**Seed Data and Normalization.** The Seed Data is committed as an application asset, distinct from the runtime store, and is never modified. On first start, if no store exists, Normalization runs once and writes the store, per ADR-0001:

- Misspelled field names are corrected to their canonical names.
- Ids held as text are converted to numbers.
- Values that cannot be salvaged — an unparseable birth date, an email that is not one — are cleared rather than causing the whole record to be discarded.
- The result is reported at startup: how many records were repaired, which fields were cleared, and for which ids.

A script resets the store so a clean start is always available.

**Frontend composition.** Reads are expressed as resources derived from the current page and search terms, so changing either re-fetches declaratively; creation is an imperative one-shot request. The creation form is a reactive form validated by the shared creation schema, with issues mapped onto controls by path. Field-level problems appear inline against their control; the outcome of a submission is announced separately as a transient notification.

**Responsive design.** Mobile-first: the smallest supported viewport is the baseline and wider layouts are additive, never a desktop layout shrunk down. Four ranges are supported: phone, tablet, laptop and large desktop. All UI work goes through the `frontend-design` skill, per AGENTS.md.

The table is the hard case, and it drives the layout: four columns do not fit a phone. On narrow viewports the tabular presentation is replaced by a stacked per-User presentation carrying the same fields; the table proper appears from tablet width upward. Horizontal scrolling was considered and rejected — it hides Role and email behind a gesture, making the primary information invisible on the smallest screen.

The detail view presents as a full-screen surface on phones and as a centred dialog from tablet up. The creation form is single-column and full-width on phones, and may use two columns from tablet up. Interactive elements meet minimum touch-target sizing. Pagination stays reachable without horizontal scrolling at every width.

**Theming.** A Material 3 theme is generated from all four specified brand colours, producing harmonised tonal palettes, and applied globally. Light and dark appearance is driven by the standard colour-scheme mechanism rather than a bespoke toggle.

**Smiley.** A standalone component on its own route, built with layout primitives only. No absolute positioning, no images, no vector assets. It scales with the viewport.

**Workspace.** A single monorepo holding the two applications and the shared module. Per ADR-0003, the workspace is created from the Angular preset and the server application added afterwards, because the framework rejects the tooling's default project layout.

## Testing Decisions

A good test here asserts externally observable behaviour — what a caller, a client or a person sees — and never reaches into how a result was produced. Tests are written at the highest seam that can prove the behaviour, and there are exactly three seams.

**Seam 1 — the shared rules module's parse boundary.** A pure input-to-issues function. This is where the Conditional Requirement is proved exhaustively: for each of the three Roles, that a complete record is accepted, and that omitting each field the Role requires is rejected with an issue naming that field. Also covered here: that a Role outside the three permitted values is rejected, and that an error in an unrelated field does not suppress the Role-dependent issues. This is the highest-value seam because both applications consume this exact boundary.

**Seam 2 — the HTTP API boundary.** Exercised through the running application, never against service or repository classes directly. Covers: listing returns the expected shape and count; paging and search narrow correctly and report the correct total; fetching a known id returns that User and an unknown id does not; creation rejects records violating the Conditional Requirement with field-keyed messages; creation accepts a valid record, assigns an id and returns it; and a created User is still present when read back. Normalization is proved through this same seam — after starting against the provided Seed Data, all 100 Users are listed, the records with misspelled field names carry their values under the correct names, ids that were text are numbers, and the unsalvageable values read as absent. No separate seam is opened on the normalizer, the repository or the write queue.

**Seam 3 — the browser, via Playwright.** Four specs, kept deliberately minimal: the list renders and pages; search narrows the results; creating a User succeeds and the confirmation appears and the new User is visible; and selecting the admin Role while leaving phoneNumber empty shows an inline error against that field. The last of these is the only test that proves the shared rules working through the entire stack, which is why it is included in a minimal set.

The four browser specs run at two viewports — a phone and a desktop — since the layouts genuinely differ rather than merely reflowing. One additional assertion covers the switch itself: the stacked presentation is shown at phone width and the tabular one at desktop width. This keeps the spec count at four while proving the mobile-first claim.

There is no prior art in this repository — it is greenfield, so these tests establish the conventions rather than follow them.

Not tested, deliberately: Angular components and services in isolation, and the repository, write queue and normalizer as units. These are lower seams whose behaviour is already proved above them, and testing them directly would couple the suite to implementation detail.

## Out of Scope

- Authentication, authorisation and access control. Role is a validation selector only and grants nothing; see CONTEXT.md.
- Updating or deleting Users. Only listing, reading and creating are specified.
- Any user-facing repair or review workflow for Legacy Records. Normalization is automatic and reported in logs, not an interface.
- Multi-process or multi-instance deployment. The write queue serialises within one process only; a shared store across processes would need a different mechanism.
- A real database. Persistence is a file by requirement.
- Sorting the table, filtering by anything other than Full Name, and column selection.
- Internationalisation and localisation.
- A bespoke dark-mode toggle. Appearance follows the system preference.

## Further Notes

The malformed Seed Data appears to be deliberate rather than accidental. The three records whose birth date sits under a misspelled field name are all admins that otherwise hold a phone number; correcting the name is exactly what makes them satisfy the admin rule. Left uncorrected, they are the only records in the entire file that violate the Conditional Requirement. An implementation that validates the Seed Data strictly reports three invalid admins; one that repairs first reports none. This is worth stating plainly in the README, which is a requirement of the deliverable.

The framework version chosen for the server sits outside the range the monorepo tooling declares support for. ADR-0002 records why, and records the fallback: an earlier version with a hand-written validation layer, if the packaging differences prove unworkable.

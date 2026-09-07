# 03: List Users end-to-end

**What to build:** The directory itself — every User from the Seed Data, visible and readable at any screen size. This is the tracer bullet: the first ticket that cuts through the shared module, the API and the UI together.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Requesting the list of Users with no parameters returns every User
- [ ] Each User shows id, Full Name, email and Role
- [ ] Phone viewports show a stacked per-User presentation with no horizontal scrolling
- [ ] Tablet and wider show the tabular presentation
- [ ] Users missing an email, phoneNumber or birthDate still appear, with absent fields reading as absent rather than as broken values
- [ ] Tests at the shared-module and API seams cover the read path
- [ ] A browser spec covers the list rendering at both phone and desktop widths
- [ ] Legacy Records with misspelled field names may still render imperfectly; that is expected until ticket 04

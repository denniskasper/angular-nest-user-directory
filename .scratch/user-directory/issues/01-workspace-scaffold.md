# 01: Workspace scaffold

**What to build:** A single monorepo holding the frontend application, the API application and the shared module, with both applications startable from one codebase. Nothing user-facing yet — this exists so every later ticket has somewhere to land, and so the shared module is provably consumable by both sides before any rule depends on it.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Both applications start with documented commands and serve without errors
- [ ] TypeScript is pinned to the version the frontend framework permits
- [ ] No package resolves outside its declared peer range without a recorded override
- [ ] Change detection is zoneless and the zone library is absent from the build
- [ ] A value exported from the shared module is imported and used by both applications, proving it resolves in both build pipelines
- [ ] The server framework version follows ADR-0002; if its packaging proves unworkable the documented fallback is taken and the ADR updated to say so
- [ ] Workspace layout follows ADR-0003

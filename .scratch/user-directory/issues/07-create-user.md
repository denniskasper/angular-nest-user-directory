# 07: Create a User

**What to build:** A new User can be added to the directory and is still there after a restart. This ticket owns the entire write path, so it also owns the guarantees that make concurrent writes safe.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] A User can be created from the form and appears in the directory afterwards
- [ ] The created User survives a restart
- [ ] An id is assigned automatically and never collides, including under concurrent creation
- [ ] Concurrent writes do not interleave
- [ ] An interrupted write never leaves a partial or corrupted store
- [ ] A confirmation is shown on success, and a clear message on failure
- [ ] The server rejects input that the form would have rejected
- [ ] The form is single-column and full-width on phones, and may use two columns from tablet up
- [ ] Nothing above the repository boundary touches the filesystem

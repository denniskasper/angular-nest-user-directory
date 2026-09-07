# 04: Normalize the Seed Data

**What to build:** All 100 Users appearing correctly. The malformed records in the Seed Data are repaired where the intent is unambiguous and preserved with unusable values cleared where it is not — once, rather than on every start. Per ADR-0001.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] All 100 Users are listed
- [ ] Values stored under misspelled field names appear under their canonical names
- [ ] Ids held as text are numbers, and fetching such a User by id succeeds
- [ ] Values that cannot be salvaged are cleared rather than causing the whole record to be discarded
- [ ] Normalization runs once, not on every start
- [ ] The original Seed Data is never modified
- [ ] Startup reports how many records were repaired, which fields were cleared, and for which ids
- [ ] Verified through the API seam; no separate seam is opened on the normalizer

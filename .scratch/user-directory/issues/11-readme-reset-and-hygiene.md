# 11: README, reset script and submission hygiene

**What to build:** Everything a reviewer needs to clone the repository, run it, and understand the decisions behind it — particularly the handling of the malformed Seed Data, which is the judgement call this challenge is really testing.

**Blocked by:** 08, 09, 10

**Status:** ready-for-agent

- [ ] README covers installing dependencies and starting both applications
- [ ] README documents any data scripts
- [ ] README explains what was wrong with the Seed Data, what was repaired, what was cleared, and why
- [ ] README states plainly that strict rules apply to new input rather than retroactively to stored Users
- [ ] README records assumptions, architectural decisions and known limitations, including the single-process write constraint
- [ ] A script resets the store to a clean starting state
- [ ] Challenge materials are excluded from the repository; agent tooling is retained
- [ ] The repository can be cloned, installed and run from scratch with no undocumented steps

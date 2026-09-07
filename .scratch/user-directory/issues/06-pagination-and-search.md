# 06: Pagination and Full Name search

**What to build:** A directory that stays navigable at 100 Users or 100,000 — paged, and searchable by Full Name, with both applied on the server rather than by loading everything into the browser.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] 25 Users per page
- [ ] Navigating between pages works, and the total number of matches is reported
- [ ] Search matches a case-insensitive substring against the first and last name joined by a single space
- [ ] Search is applied before paging, and the reported total reflects matches rather than the whole directory
- [ ] Requesting the list with no paging or search parameters still returns the complete list
- [ ] Pagination controls remain reachable and tappable at phone width without horizontal scrolling

# AGENTS.md

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<optional scope>): <description>`.

Keep them short — a subject line under ~50 characters, lowercase, imperative mood, no trailing period. Omit the body unless the _why_ is genuinely non-obvious.

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

```
feat(auth): add session refresh
fix: handle empty payload
docs: note commit conventions
```

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, used verbatim: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Frontend work

Use the `frontend-design` skill for all UI work — components, pages, layout, styling, theming.

Design **mobile-first**: the smallest supported viewport is the baseline, and wider layouts add to it rather than shrinking down from desktop. Every view must work at phone, tablet, laptop and large-desktop widths.

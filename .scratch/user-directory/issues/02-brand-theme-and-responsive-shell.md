# 02: Brand theme and responsive app shell

**What to build:** The application's visual foundation — the brand palette applied globally, light and dark appearance, and the mobile-first layout shell that every later view is built inside. This sits early on purpose: retrofitting responsiveness onto finished components is the failure this ordering avoids.

**Blocked by:** 01

**Status:** done

- [x] All four specified brand colours are present in the rendered application
- [x] Derived surfaces and containers harmonise with the brand colours rather than reading as off-palette
- [x] Light and dark appearance both render correctly and follow the system preference, with no bespoke toggle
- [x] A layout shell holds content at a comfortable width on large desktops and fills the viewport on phones
- [x] Breakpoints for phone, tablet, laptop and large desktop are defined once and reused, not redefined per component
- [x] Built using the frontend-design skill, per AGENTS.md

## Comments

Implemented. Verified against the acceptance criteria:

- Angular Material 22.1 and the CDK were added. The Material 3 theme is generated from all four brand colours with the `@angular/material:theme-color` schematic (`apps/frontend/src/styles/_theme-colors.scss`) and applied once, on `html`, in `styles.scss`.
- The generated tonal palettes do not contain the literal brand hexes (Material picks tones such as #009adc, not #1da4e8), so the four exact colours are exposed as `--brand-*` custom properties (`_brand.scss`) and painted by the header signet, the brand thread under the header, the footer mark and focus rings. Surfaces, containers, text and the active nav pill all come from the derived `--mat-sys-*` tokens.
- Light and dark appearance use `theme-type: color-scheme`, so Material emits `light-dark()` values and `color-scheme: light dark` on `html` lets the browser choose. No toggle exists.
- The shell (`app.ts` / `app.html` / `app.scss`) is a sticky header, a `<main>` content column and a footer. On phones `<main>` is the full viewport with gutters inside; from tablet up the gutter grows and the column is held at 72rem and centred.
- Breakpoints live once in `apps/frontend/src/styles/_breakpoints.scss` (tablet 600px, laptop 1024px, desktop 1440px; phone is the baseline) with a `bp.up()` mixin, resolved through `stylePreprocessorOptions.includePaths`. A TypeScript consumer (the detail dialog in ticket 05) will need the tablet threshold once; that is deferred until it exists.
- Built with the frontend-design skill: Fraunces (display) and Instrument Sans (body), self-hosted via `@fontsource-variable`; a four-colour thread drawn in on load; a faint brand-colour wash at the top of the page; `prefers-reduced-motion` honoured.
- Tests at Seam 3 only, `apps/frontend-e2e/src/shell.spec.ts` (phone + desktop): all four brand colours are painted, body luminance flips with the emulated colour scheme, and the shell names the app, has a nav and its `<main>` fills the phone viewport / is narrower and centred on desktop with no horizontal scroll. It replaces the scaffold spec from ticket 01.

Not in this ticket: the landing placeholder in `<main>` (headline and Role chips) is there so the shell is not empty and to keep the shared-module proof; ticket 03 replaces it. The nav has only a Directory link; ticket 09 adds Smiley.

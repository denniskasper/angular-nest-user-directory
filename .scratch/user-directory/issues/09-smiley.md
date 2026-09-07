# 09: Pure-CSS smiley

**What to build:** A dedicated page showing a smiley built entirely from layout and styling. Independent of the directory work — parallelisable from ticket 02 onward.

**Blocked by:** 02

**Status:** done

- [x] A dedicated route renders the smiley
- [x] Built with layout primitives only: no absolute positioning, no images, no vector assets
- [x] Scales with the viewport at phone, tablet, laptop and large-desktop widths
- [x] Fits the application's theme rather than sitting visually outside it
- [x] Built using the frontend-design skill, per AGENTS.md

## Comments

Implemented. Verified against the acceptance criteria:

- `/smiley` (`apps/frontend/src/app/app.routes.ts`, lazy like its siblings) renders `SmileyPage` (`apps/frontend/src/app/smiley/smiley-page.*`), reached from a Smiley link in the shell nav that ticket 02 left for this ticket.
- Layout primitives only. The frame is a square CSS grid whose single cell holds the ring and the face; the face is a grid of five rows (brow, eyes, a beat, the grin, chin); the eyes are a flex row; the grin is a three-column grid with the cheeks either side of the mouth. The mouth is the classic: a box with only its bottom edge stroked and its corners rounded until the stroke is a bowl that thins to nothing at the ends. Nothing is `position: absolute`, no `<img>` or `<svg>`, no `url()` anywhere; the sheen and blush are gradients and colour, which is styling.
- Scales with the viewport. The frame is `min(100%, 64dvh)` of its column, and it is a `container-type: inline-size` container, so every feature is sized in `cqi` against one diameter and stays in proportion. Phone (Pixel 7): the face fills the column; 320px: it still fits with no sideways scroll; laptop and up: the page becomes two columns with the text in a margin beside the plate; 1920px: the face is the larger of the two. Verified at all four in both colour schemes.
- Fits the theme. The face is the brand tertiary itself (`--brand-tertiary`, the yellow); the ring is the brand thread wound into a halo, sharing its stops with the shell's rule (`brand.$thread-stops`); the ink and blush are struck from the brand primary and error colours; the page head uses the same running title, Fraunces headline and lede as the directory and the form, now lifted to global `.page-title` and `.lede`. The face is scheme-independent on purpose — the same face in the dark — with its shadow in its own ink so it does not become a glow on a dark surface.
- Built with the frontend-design skill: the page is an exhibit plate — running title, headline, the plate, and a short ruled ledger of what it is made of. Motion is the ring winding in (by turning the gradient's start angle, not the box: a rotated square overflows its frame, and Chrome on a phone widens the whole page to fit it), the smile drawing in, the cheeks blooming, and the eyes blinking every few seconds; `prefers-reduced-motion` is honoured by the global rule.
- Shell change: three links no longer fit beside the brand on phones, so the nav drops to its own row there (`app.scss`), with `--shell-bar-height` raised to match on phones so the notice still hangs under the bar; from tablet up the header is as before. This touches every page and is covered by the existing shell test (no sideways scroll at Pixel 7) and the smiley test at 320px.
- Tests at Seam 3 only, folded into `apps/frontend-e2e/src/shell.spec.ts` (phone + desktop) rather than added as a new spec: the nav reaches the route; the face is named for assistive technology; nothing under `<main>` is absolutely, fixed or sticky positioned, no image or vector element exists, and no `url()` is painted — the one place the suite reads computed style, since how the smiley is built is itself the requirement; the face's colour is the brand tertiary and all four brand colours are painted; and the face is round, within the screen, at least half the viewport's shorter side, smaller at 320×568 and larger at 1920×1080 than as loaded — the resize is the only way to prove "scales", which the two project widths alone cannot.

Code review (standards + spec axes) led to: the page head lifted to global `.page-title` and `.lede` (third copy across the directory, the form and this page); the thread's stops shared between the shell rule and the ring; the nav's phone offset named against the link padding it mirrors; the ink struck from black rather than a new hex, and the face's shadow drawn in ink so dark mode does not turn it into a glow; the e2e materials scan renamed for what a non-empty result means with a note on why it reads CSS, and the brand-painted and no-sideways-scroll expectations shared across the shell tests. Left as-is on purpose: the resize inside the test (see above); the `backgroundColor` assertion, which is the face's colour as the browser reports it; and the exhibit framing, which the frontend-design mandate calls for.

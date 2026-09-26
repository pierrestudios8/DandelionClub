# Header

The site header: a night bar with the yellow logo on the left and navigation in capitals on the right, as on the live site (which shows "Plantings" and "Join").

**Consumer provides:** the nav links (at most four plus one `dc-btn` for the main action) and the current page state (`aria-current="page"` on the active link).

- Logo: `dandelion-club-logo-yellow.svg` at 160 × 65, linked home, `alt="Dandelion Club"`.
- Links use the `eyebrow` style in `dandelion`; underline on hover at 2px.
- Gutter `space-7` (32px), `space-4` under 600px. Below 600px the links collapse into a menu button (to be designed in page layouts).
- Sticky on scroll is fine; never transparent over photos, since the header is part of the night frame.

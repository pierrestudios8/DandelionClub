# Decisions

Newest first. Add a line for every decision that isn't already in CLAUDE.md or SPEC.md.

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-09-27 | An all-placeholder example upcoming planting (`tests/fixtures/example-planting.ts`) and an example tree price of R350 load only with `DC_FIXTURES` (Playwright and the local preview), never on Vercel | The Planting detail design needs an upcoming planting and none exists; a real-looking date on the shared preview could be taken for a real event |
| 2026-09-27 | `pnpm todos` also scans pages, components, layouts and form messages, and page copy that is still bracketed in the designs is written as `TODO:` placeholders | Placeholders in page copy must be counted before launch, not only those in content |
| 2026-09-27 | Forms post to one stub endpoint (`/api/[form]`) that returns success: JSON for fetch, a 303 to `/thank-you/[type]` without JavaScript; a minimal thank-you page exists already | Phase 3 asks for working no-JavaScript forms; Phase 5 swaps in real handlers |
| 2026-09-27 | Client-side validation writes fixes next to each field (not browser bubbles) and falls back to native validation without JavaScript; the Donate toggle and amounts are styled radio buttons | Errors "written out and linked with aria-describedby" (CLAUDE.md), and both payment forms must work without JavaScript |
| 2026-09-27 | "Add to calendar" on the planting page waits for Phase 5 (`calendar.ts`); the sign-up panel shows "N spots" from `capacity`, not "spots left" | No link to a missing file; a static page can't know how many people have signed up |
| 2026-09-27 | Sites list with planted sites first, then by name; the impact strip shows only when trees planted is known, with whichever other figures are real | Matches the Home design's order; a strip of "1 planting · 1 school" says too little |
| 2026-09-27 | Two bands on the same ground in a row share their spacing (the second loses its top padding) | Matches the designs, which use one section gap between consecutive paper bands |
| 2026-09-27 | Other donation amounts must be a whole number of rand, R5 or more | PayFast's minimum payment; revisit if the provider changes |
| 2026-09-27 | Page screenshots for review are committed under `docs/screenshots/phase-3/` | The GitHub API can't attach images to a PR |
| 2026-09-27 | Typed fields (numbers, URLs, times, coordinates, booleans) accept their real type or a `TODO:` string (`orTodo` in `src/lib/schema.ts`); a placeholder must say what's missing | SPEC.md wants unknown counts, links and coordinates as `TODO:`, and the build should still reject typos like `treesPlanted: forty` |
| 2026-09-27 | Seed entries are `publish: false`. Content helpers include unpublished entries in dev and Vercel previews and drop them when `VERCEL_ENV=production` | Every seed entry still has unknowns; the club can review them on previews while production shows only confirmed content |
| 2026-09-27 | "Upcoming" means dated today or later on the Cape Town calendar (Africa/Johannesburg), so a planting stays upcoming all day; cancelled plantings appear in neither list | Matches how volunteers read a date; a cancelled date shouldn't be advertised or counted |
| 2026-09-27 | Impact figures include volunteers (CLAUDE.md lists it) and are all null until at least one planting is held; sums are null if any held planting's count is a TODO or missing | "Hide a figure until its inputs are real"; a zero on launch day says nothing |
| 2026-09-27 | Settings is a one-entry collection (`getEntry('settings', 'settings')`) with an inline loader over `settings.json` | Astro's file loader treats a JSON object's keys as separate entries |
| 2026-09-27 | The Silukhanyo planting's title is "First food forest planting", from the Home design's site card | The only confirmed wording for that day |
| 2026-09-27 | Upcoming and past are decided at build time, so the static site needs a daily rebuild to move a planting from upcoming to past on time (to set up with Vercel before launch) | The site is static; without a rebuild the announcement bar would keep showing a past date |
| 2026-09-27 | Design-derived sizes moved into `design/tokens.json` (Dandelion Club Design System v2); `DESIGN_DERIVED` removed from `scripts/tokens.ts` | The design system is the single source again; the canvas and the code read the same values |
| 2026-09-27 | Sizes the approved designs use but `tokens.json` lacks (mobile display 32/30, eyebrow 14/18, tag 12/16, card titles 26/32, logo, seed band, focus offset 3px) live in `DESIGN_DERIVED` in `scripts/tokens.ts` and are generated into `tokens.css` | `design/` is read-only and components may only use token values; this keeps one place for every raw value. Move them into `tokens.json` on the next design-system export |
| 2026-09-27 | Header links collapse into the menu below 1024px, not 600px as Header.md says | Four nav links plus the "Get involved" button don't fit on one line in Unbounded 900 below about 1000px |
| 2026-09-27 | Mobile menu is a modal `<dialog>`, with a `<noscript>` link list as the fallback | Native focus trap, Escape to close and inert background without a library |
| 2026-09-27 | The past PlantingCard is a whole-card link with photo and "See the day →", as in `Plantings.dc.html`, rather than PlantingCard.md's ghost button | The page design is the later, approved layout |
| 2026-09-27 | The newsletter sign-up has a POPIA consent checkbox and a honeypot, which the designs leave out | SPEC.md requires both on every form |
| 2026-09-27 | `src/content/settings.json` is created in Phase 1 and read as plain JSON by the footer and Contribute block; Phase 2 adds its schema | The footer needs the NPC name, registration and contact details now, and unknowns belong in content as `TODO:` |
| 2026-09-27 | `/styleguide` is injected in dev and Vercel previews and left out when `VERCEL_ENV=production`; Astro's dev toolbar is off under e2e | Reviewable on the preview link without shipping to production; the toolbar adds headings that axe and the one-h1 test would see |
| 2026-09-27 | Fonts: Fontsource latin subsets only (Unbounded 300/900, Geist 400/700/900), preloading Unbounded 900 and Geist 700 | Smallest download; the site is English. Unbounded has no `→` glyph in any subset, so arrows fall back to the system font, as they did in the design canvas |
| 2026-09-26 | TypeScript pinned to 6.0.x, not 7 | `@astrojs/check` and typescript-eslint don't support TypeScript 7 yet; revisit when they do |
| 2026-09-26 | Playwright starts Astro with `node …/astro.mjs dev --ignore-lock` and waits on the URL | Astro 7 backgrounds `astro dev` when it detects a coding agent, and a `pnpm exec` wrapper leaves the server running after tests |
| 2026-09-26 | Prettier skips Markdown | The docs are hand-written prose and the brief should not be reflowed |
| 2026-09-26 | `scripts/tokens.ts` is a stub in Phase 0 that writes an empty `tokens.css` | `pnpm build` runs it; the real generator and its test are Phase 1 |
| 2026-09-26 | Keep the Framer site live until sign-off; move the domain by DNS only at cutover | No gap in the public site; easy rollback |
| 2026-09-26 | Brand comes from the live site: night #1E122B, dandelion #FFCD19, paper #FCFAF2, Unbounded and Geist, seed logo | It's the identity already in public use |
| 2026-09-26 | Astro static site on Vercel, content in collections edited as files | Fast on mobile data, free to host, easy for Claude Code to maintain |
| 2026-09-26 | Native forms writing to Google Sheets, replacing Google Forms | On-brand forms, data stays in the club's existing Workspace |
| 2026-09-26 | PayFast recommended for payments, sandbox until the club confirms | South African, supports monthly giving; final choice open |
| 2026-09-26 | Unconfirmed facts stay as `TODO:` placeholders and block publishing | Nothing invented goes live |
| 2026-09-26 | Rive taproot story is a later phase; a `RiveSlot` holds its place | Launch doesn't wait on animation |

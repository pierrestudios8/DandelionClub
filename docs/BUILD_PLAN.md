# Build plan

Nine phases. Do one phase per branch and pull request, in order. Each phase ends at its **Done when** checklist, a green `pnpm build && pnpm check && pnpm lint && pnpm test`, a Vercel preview link, and a short PR summary: what was built, what's left, and the `pnpm todos` count. Stop after each phase for Pierre's review before starting the next.

## Phase 0: Set up

- Astro + TypeScript (strict) project with pnpm, ESLint, Prettier, Vitest, Playwright plus `@axe-core/playwright`.
- `@astrojs/vercel` adapter, `astro:assets`, `@astrojs/sitemap`.
- Folder structure from CLAUDE.md. Copy `design/brand/*.svg` to `public/brand/`.
- `.env.example`, `.gitignore` (including `.env*.local`), `docs/DECISIONS.md` with a first entry.
- Scripts from CLAUDE.md, including `pnpm todos` (lists every `TODO:` in `src/content/` with its file).
- GitHub Actions: build, check, lint and unit tests on every PR.

**Done when:** `pnpm dev` serves a blank page, CI is green on the PR, and a Vercel preview URL exists.

## Phase 1: Tokens, fonts, layout, components

- `scripts/tokens.ts`: read `design/tokens.json` and write `src/styles/tokens.css` (colour, spacing, radius, border and layout custom properties, `--font-display`, `--font-text`, one utility class per type style). Unit-test that every token appears.
- Self-host Unbounded and Geist; preload the display 900 and text 700 weights.
- `global.css`: reset, `body` on `paper` in `--font-text`, focus ring rules, `prefers-reduced-motion`.
- `BaseLayout.astro`: `<html lang="en-GB">`, meta and Open Graph slots, skip link, AnnouncementBar, Header, `<main>`, Footer.
- Components from `design/components/*.md`: Button (primary, ghost, quiet, disabled), Header (desktop plus mobile menu), AnnouncementBar, Hero, NextPlanting, PlantingCard (upcoming, past), SeedBand (with `RiveSlot`), Contribute, RouteCard, FormField (text, email, tel, number, select, textarea, checkbox, error and hint states), Footer, Section (band wrapper: `night` | `paper` | `paper-sunk` | `dandelion`), Placeholder (renders `TODO:` values).
- A dev-only `/styleguide` route showing every component in every variant, on each ground it's allowed on.

**Done when:** `/styleguide` matches the component guidelines at 390px and 1440px, axe reports no violations there, and no hard-coded colour or size values appear outside `tokens.css` (add a lint check for hex values in `src/components`).

## Phase 2: Content collections

- Schemas in `src/content.config.ts` exactly as `docs/SPEC.md` describes, plus `settings.json`.
- Seed entries: three sites, one done planting (Silukhanyo Primary, 29 August 2026), six programmes, settings with the bank details and `TODO:` values. Every unknown is a `TODO:`.
- Helpers in `src/lib/content.ts`: `getUpcomingPlantings()`, `getNextPlanting()`, `getPastPlantings()`, `getImpactFigures()` (returns `null` for any figure with unconfirmed inputs).
- Unit tests for the helpers, including "no upcoming plantings" and "past date still marked upcoming" (treat it as done and warn in the build log).

**Done when:** `pnpm todos` lists every placeholder and the helper tests pass.

## Phase 3: The eight designed pages

Build in this order, matching `design/pages/`: Home, Plantings, Planting detail, Get involved, Dedicate a tree, Donate. Use the mobile designs for Home and Planting detail, and follow the same single-column pattern for the others on mobile.

- Recreate each design's bands, hierarchy, spacing and copy with the Phase 1 components. Fixed pixel heights in the designs are not layout rules; let content set the height.
- Breakpoints: single column under 768px, the design's grid from 1024px up, a sensible in-between.
- Forms render with their full markup and client-side validation, but submit to a stub endpoint that returns success (wired up in Phase 5).
- Dedicate a tree: the tree counter (1–50) and the live total from `settings.treePrice`. Donate: the once-off/monthly toggle, amount choice and live summary. Both must work without JavaScript as plain forms.
- Home: the fact band renders only if a `facts` entry has a `sourceUrl`; the impact strip renders only when `getImpactFigures()` has real values.
- Playwright smoke test per page at 390px and 1440px, with axe.

**Done when:** each page matches its design at 390px and 1440px (attach screenshots to the PR), axe is clean, and every link resolves.

## Phase 4: Pages without designs

Our work, Site detail (three sites), About, Journal list and post, Propose a site form, Partner enquiry form, Privacy, 404, following `docs/SPEC.md` ("Pages without designs"). Content stays `TODO:` where unknown.

**Done when:** every route in the sitemap renders, the nav points at real routes, and axe is clean.

## Phase 5: Forms, email and Sheets

- `src/lib/sheets.ts`: append rows through a Google service account. One tab per form, header row created on first write.
- `src/lib/email.ts`: send through the club's Google Workspace (service account with domain-wide delegation for `GMAIL_DELEGATED_USER`), or a transactional provider if that proves impractical: log the choice in DECISIONS.md.
- `src/lib/calendar.ts`: build `.ics` files for planting confirmations.
- Endpoints for every form in `docs/SPEC.md`, with Zod validation, honeypot, Turnstile verification, and the no-JavaScript redirect to `/thank-you/[type]`.
- Email templates: planting confirmation (with the rain-notice line), partner and site notifications to info@. Copy in `src/content/emails/` so it can be edited.
- Unit tests with the Sheets and email clients mocked; one Playwright happy path per form against a test Sheet.

**Done when:** each form, submitted on the preview URL, adds a row to the test Sheet and sends the right emails, and invalid input shows the right written error.

## Phase 6: Payments (PayFast sandbox)

- `src/lib/payments/payfast.ts`: build signed payment requests (once-off and subscription), validate ITNs (signature, source IP, amount, server-side confirmation).
- Dedicate a tree and Donate: pending row → PayFast sandbox → ITN endpoint marks the row paid → confirmation or thank-you email → `/thank-you/[type]`.
- Section 18A request captured, but certificates are issued manually until the club confirms its status.
- Unit tests for signature generation and ITN validation, using PayFast's documented examples.

**Done when:** sandbox once-off and monthly payments complete end to end on the preview URL, a forged ITN is rejected, and nothing can switch to live without `PAYFAST_SANDBOX=false`.

## Phase 7: SEO, analytics, performance, accessibility

- Per-page titles and descriptions from content, Open Graph images (a default using the logo on night, plus planting-specific ones), `sitemap.xml`, `robots.txt`, canonical URLs, JSON-LD (`NGO` site-wide, `Event` for each upcoming planting).
- Plausible with the goals in `docs/SPEC.md`.
- Performance pass: image sizes, font subsetting, no unused JavaScript.
- Full axe and keyboard pass on every route; screen-reader check of the forms and the mobile menu.

**Done when:** Lighthouse mobile ≥ 95 in all four categories on Home, Plantings, a planting page and Donate; first load under 1 MB; axe is clean on every route.

## Phase 8: Launch readiness

- `pnpm todos` must be empty for every page marked `publish: true`. Pages still waiting on content stay unpublished; they're left out of the nav and sitemap.
- Redirects for any old Framer URLs (check the live site's pages).
- A short `docs/EDITING.md` for Pierre: how to add a planting, record a recap, add a journal post, and change settings, with one example of each.

**Done when:** Pierre signs off the production build on the preview URL.

### Cutover checklist (Pierre does this, not Claude Code)

1. Add `dandelionclub.co.za` and `www.dandelionclub.co.za` to the Vercel project.
2. In GoDaddy DNS, change **only** the apex A record and the `www` CNAME to the values Vercel gives. Leave every MX, TXT (SPF, DKIM, DMARC, Google verification) and other record exactly as it is.
3. Wait for Vercel to issue the certificate; check both hostnames load over HTTPS.
4. Send a test email to and from info@ to confirm mail still works.
5. Switch PayFast to live credentials and `PAYFAST_SANDBOX=false`; make a real R10 test donation and refund it.
6. Submit the sitemap in Google Search Console.
7. Unpublish the Framer site but keep the project until its renewal date as a fallback.

# Dandelion Club website

The public site for Dandelion Club, a food forest initiative run by Business Building Institute NPC in the Western Cape, South Africa. It replaces a one-page Framer site at dandelionclub.co.za. The Framer site stays live until this build is signed off; nothing here touches the live domain until the cutover phase.

The site's one job: turn a visitor into a planter, a tree dedicator, a donor or a partner.

Work through `docs/BUILD_PLAN.md` one phase at a time. Read this file, `design/BRAND.md` and the phase's section of the plan before starting a phase.

## Sources of truth

| What | Where | Rule |
| --- | --- | --- |
| Tokens (colour, type, spacing, radius, borders) | `design/tokens.json` | The only source of values. Generate CSS custom properties from it; never hand-type a hex value, font size or spacing value in a component. |
| Brand rules and voice | `design/BRAND.md` | Follow it for every visual and copy decision. |
| Component guidelines | `design/components/*.md` | Each component in `src/components/` matches its guideline: variants, states, what the consumer provides. |
| Reference CSS | `design/components.reference.css`, `design/tokens.reference.css` | How the components looked in the design system. Port to Astro components; don't import these files wholesale. |
| Page designs | `design/pages/*.dc.html` | Approved layouts at 1440px desktop and 390px mobile. They are HTML mockups from a design canvas: fixed pixel heights, inline styles, links between `.dc.html` files. Recreate the layout, hierarchy, spacing and copy responsively; don't copy the fixed heights, `<x-dc>` wrappers, `support.js` or `/_blob/` URLs. |
| Logo and motif | `design/brand/*.svg` | Copy into `public/brand/`. Never redraw or recolour beyond the two supplied inks. |
| Site spec | `docs/SPEC.md` | Sitemap, page contents, content model, forms, quality bar. |
| Content | `src/content/` | All copy that changes lives in content collections. The club is still confirming facts: see Placeholders below. |

## Stack

- **Astro** (latest stable) with **TypeScript** in strict mode. Static output by default; server endpoints only where forms and payments need them.
- **Styling:** plain CSS with custom properties generated from `design/tokens.json` by a small build script (`scripts/tokens.ts` → `src/styles/tokens.css`). Scoped `<style>` in Astro components. No Tailwind, no CSS-in-JS, no UI kit.
- **Fonts:** Unbounded (display: 300, 900) and Geist (text: 400, 700, 900), self-hosted through Fontsource packages or the `geist` npm package (check the current package names), `font-display: swap`, preload the two most-used weights.
- **Content:** Astro content collections with Zod schemas (see `docs/SPEC.md`, Content model).
- **Images:** `astro:assets` (`<Image />`), AVIF/WebP, responsive `sizes`. Source photos go in `src/assets/photos/`.
- **Motion:** CSS only for now. Leave a `RiveSlot` component (static seed image, lazy-loads a `.riv` later) where the seed band sits.
- **Hosting:** Vercel with the `@astrojs/vercel` adapter. Every branch gets a preview URL.
- **Forms:** Astro server endpoints → Google Sheets API (service account) plus a notification email to info@dandelionclub.co.za via the club's Google Workspace. Spam protection: honeypot field plus Cloudflare Turnstile.
- **Payments:** PayFast (once-off and subscriptions), sandbox first. Provider not final; keep it behind `src/lib/payments/` so it can be swapped.
- **Analytics:** Plausible (cookie-free, no consent banner needed).
- **Package manager:** pnpm.

## Commands

```
pnpm install
pnpm dev          # local dev server
pnpm tokens       # regenerate src/styles/tokens.css from design/tokens.json
pnpm build        # production build (runs tokens first)
pnpm check        # astro check + tsc
pnpm lint         # eslint + prettier --check
pnpm test         # vitest (content schemas, form handlers, payment signature)
pnpm test:e2e     # playwright: page smoke tests, form happy paths, axe accessibility scan
```

Add these scripts in Phase 0. Every phase ends with `pnpm build`, `pnpm check`, `pnpm lint` and `pnpm test` passing.

## Project structure

```
design/                 read-only references (do not edit)
docs/                   SPEC.md, BUILD_PLAN.md, DECISIONS.md (log decisions here)
public/brand/           logo and seed SVGs
scripts/tokens.ts       tokens.json → src/styles/tokens.css
src/
  assets/photos/        source photographs
  components/           one folder or file per design-system component
  content/              plantings/, sites/, programmes/, journal/, partners/, facts/, settings.json
  content.config.ts     collection schemas
  layouts/BaseLayout.astro
  lib/                  forms/, payments/, sheets.ts, email.ts, calendar.ts (ICS)
  pages/                routes (see docs/SPEC.md sitemap)
  styles/               tokens.css (generated), global.css
tests/                  unit and e2e
```

## Design rules (non-negotiable)

- Three brand colours carry the site: `night` #1E122B, `dandelion` #FFCD19, `paper` #FCFAF2. Pages run in full-bleed horizontal bands: night header and hero, paper content, at most one dandelion seed band, night close.
- **Never dandelion text on paper** (1.4:1 contrast). Dandelion on night, night on paper, and night on dandelion all pass.
- Square corners everywhere (`radius-none`). 2px outlines, no shadows.
- Headlines, eyebrows, buttons and nav are uppercase **via CSS** (`text-transform`); write them in sentence case in content and markup.
- Photos fade into night at the bottom (transparent at 42% → `night` at 100%). Text never sits on top of a photo.
- The seed is the only illustration. No icon fonts or emoji; use text labels and `→`.
- Mobile first. Most visitors are on phones over mobile data.

## Content and copy rules

- British English (organise, colour, programme). Dates as "29 August 2026", times as "09:00".
- Never invent facts, numbers, prices, dates, names or quotes. The club is still confirming many of them.
- **Placeholders:** where a fact is unknown, the content entry holds a `TODO:` string (for example `price: "TODO: price per tree"`). Components render any value starting with `TODO:` as a visible, dashed-outline placeholder in dev and preview, and the production build fails if any `TODO:` remains on a page that is marked `publish: true`. List open TODOs with `pnpm todos`.
- Copy in the designs is the approved draft. Anything in [brackets] in a design is a placeholder, not copy.
- Impact numbers (trees planted, plantings held, schools, volunteers) are computed from the Plantings and Sites collections, never typed by hand. Hide a figure until its inputs are real.

## Accessibility and quality bar

- WCAG 2.1 AA: semantic landmarks, one `h1` per page, visible focus (2px solid ring, offset 3px: `night` on paper and dandelion, `dandelion` on night), labels on every input, errors written out and linked with `aria-describedby`, `prefers-reduced-motion` respected.
- Lighthouse mobile ≥ 95 in all four categories on Home, Plantings, a planting page, Donate.
- First-load page weight under 1 MB excluding the Rive file.
- SEO: unique title and description per page, Open Graph image, `sitemap.xml`, `robots.txt`, JSON-LD (`NGO` for the organisation, `Event` for each upcoming planting).
- No console errors. No layout shift from fonts or images (set dimensions).

## Guardrails

- Never commit secrets. All keys live in Vercel environment variables and `.env.local` (git-ignored). Keep `.env.example` current.
- Don't change DNS, domain settings or email records. Cutover is done by Pierre with the checklist in `docs/BUILD_PLAN.md`. The domain's Google Workspace MX, SPF, DKIM and DMARC records must never be touched.
- Payments stay in PayFast sandbox until Pierre switches them live.
- Work on a branch per phase (`phase-1-components` and so on) and open a pull request with a preview link and a short checklist of what was built and what's left.
- Log any decision that isn't in these docs in `docs/DECISIONS.md` (date, decision, reason). When the docs don't answer something and it can't easily be undone, ask instead of guessing.

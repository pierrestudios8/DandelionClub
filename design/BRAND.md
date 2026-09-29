Dandelion Club plants food forests with schools and communities in the Western Cape. The brand is a night sky with one bright seed in it: deep aubergine, dandelion yellow and warm paper, heavy wide capitals, and a single dandelion seed as the mark. It should feel like an invitation to turn up and dig, not like a charity appeal.

## Content fundamentals

- **Voice:** warm, direct, first person plural ("we're meeting", "we'll bring everything else"). Short sentences. Concrete over abstract: a date, a school, a tree, a pair of gloves.
- **Two registers, one voice.** Community pages (plantings, get involved) are warm and chatty. Funder pages (about, governance, donate, partners) are plain and evidenced: numbers, names, registration details. Every page picks one.
- **Real examples from the live site:** "Plant it forward." · "Bring gloves if you've got them. We'll bring everything else." · "Come join our food forest planting."
- **Casing:** headlines, eyebrows, buttons and nav are set in capitals by CSS (`text-transform`), but written in sentence case in the content so screen readers and editors read them normally. Body copy is sentence case.
- **Spelling:** British English (organise, colour, programme). Dates are written "29 August 2026", times "09:00".
- **Avoid:** "grow" and its forms more than once per page, the rule of three, exclamation marks, emoji, and vision-statement abstractions ("cultivating possibility"). Every number printed large must be verified.

## Colour

Three brand colours carry everything. Use `night`, `dandelion` and `paper` as full-bleed grounds; the rest are support.

| Ground | Text | Accents | Contrast |
| --- | --- | --- | --- |
| `night` | `paper` for reading, `dandelion` for headlines and actions | `hairline-on-night` | dandelion 11.9:1, paper 17.1:1 |
| `paper` | `night` for everything, `ink-muted` for secondary | `hairline` | night 17.1:1, ink-muted 7.0:1 |
| `dandelion` | `night` only | seed pattern in `paper` | night 11.9:1 |

- **Never set `dandelion` text on `paper`** (1.4:1). On paper, yellow appears only as a filled button border or a full `dandelion` band.
- Pages alternate grounds in bands: night header and hero, paper content, one dandelion seed band, night close. Don't put two dandelion bands on one page.
- Don't pair yellow with a mid green; green next to yellow reads as generic charity. `success` stays small and sits only in forms on paper.
- `wheat` exists only inside photo fades.

## Type

Two families, both hosted on Google Fonts: **Unbounded** (`--font-display`) for display, eyebrows, buttons and nav, and **Geist** (`--font-text`) for everything you read.

- Body paragraphs (`lead`, `body`, `small-lg`, `small`) run at 100% line height, tight like the headlines. Headings keep their own leading.
- `display` (Unbounded 900, 40/36) for section headlines in capitals; `display-xl` (72, leading 0.9) for the desktop hero only.
- `eyebrow` (Unbounded 900, 18) sits directly above a display headline with no gap.
- `title` 32 and `subtitle` 24 (Geist 700) for names, places and dates.
- `lead` (Geist 700, 18/19.8) is the live site's short-line voice. Use it for one to three lines only. Anything longer is `body` (Geist 400, 18/28, max `measure-text`).
- `detail` (Unbounded 300) is for reference lines such as bank and registration details.

## Layout and shape

- **Square corners everywhere** (`radius-none`). There is no rounded variant.
- Outlines, not shadows: controls and cards take a 2px (`border-strong`) outline in `night` on paper or `dandelion` on night. No drop shadows.
- Page gutter is `space-7` (32px), or `space-4` under 600px. Section padding is `space-9` on mobile and `space-10` on desktop. The content column is capped at `measure-content`; bands run full-bleed.
- Mobile first: most visitors arrive on a phone over mobile data. Keep images compressed, one hero photograph per page.

## Imagery

- Real photographs of real sites, people and plantings in the Western Cape, taken on the day. No stock, no generic global-NGO imagery. Get consent before showing children's faces.
- Photographs fade into `night` at their lower edge (transparent at 42% to `night` at 100%), so text always sits on solid night, never on the photo.
- Illustration is the seed: flat, single-colour, line-based. No other illustration style.

## Motif and iconography

- The mark is a single dandelion seed: nine fine rays, a stem, and a dark seed. It appears as the logo, as a large seed on the seed band, and as a tiled pattern (`seed-pattern-paper.svg`).
- The seed is the Rive animation slot (the taproot story, a later phase). Keep its proportions when animating.
- There is no icon set yet. Use text labels and the `→` arrow in Unbounded 900. If icons are needed, pick one outline set with 2px strokes and square ends, and add it here.

## Motion

- 150ms ease-out for hover colour swaps; up to 600ms for scroll reveals. Nothing bounces.
- All motion is switched off under `prefers-reduced-motion`.

## Accessibility

- Focus: a solid 2px ring offset 3px, `focus-on-paper` (night) on paper and dandelion grounds, `focus-on-night` (dandelion) on night.
- Every text pair above passes WCAG AA. Errors are always written out, never colour alone.
- Headlines are written in sentence case in the markup; capitals come from CSS.

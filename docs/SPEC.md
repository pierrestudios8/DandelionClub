# Site spec

## Audiences

| Audience | Needs to see | Primary action | Register |
| --- | --- | --- | --- |
| Volunteers and neighbours | Next planting, where, what to bring | Join a planting | Warm |
| Schools and community groups | What a food forest gives a school | Propose a site | Warm |
| Individual donors | What their money buys, proof it's real | Dedicate a tree / donate | Warm, with numbers |
| Funders and businesses | Programmes, governance, NPC status | Partner enquiry | Plain, evidenced |

## Sitemap and routes

| Route | Page | Design | Phase |
| --- | --- | --- | --- |
| `/` | Home | `Home.dc.html`, `HomeMobile.dc.html` | 3 |
| `/plantings` | Active projects, then Upcoming plantings (see HANDOFF-2026-09-27) | `Plantings.dc.html`, since changed | 3 |
| `/plantings/[slug]` | Planting detail and sign-up | `PlantingDetail.dc.html`, `PlantingDetailMobile.dc.html` | 3 |
| `/get-involved` | Get involved hub | `GetInvolved.dc.html` | 3 |
| `/dedicate-a-tree` | Dedicate a tree | `DedicateTree.dc.html` | 3 |
| `/donate` | Donate | `Donate.dc.html` | 3 |
| `/get-involved/propose-a-site` | Propose a site form | none: build from FormField pattern | 4 |
| `/get-involved/partner` | Partner enquiry form | none: build from FormField pattern | 4 |
| `/our-work` | Approach and programmes | none: follow the system | 4 |
| `/sites/[slug]` | Site detail | none: follow the system | 4 |
| `/about` | Story, people, governance | none: follow the system | 4 |
| `/journal`, `/journal/[slug]` | Journal list and post | none: follow the system | 4 |
| `/privacy` | POPIA notice | none | 4 |
| `/thank-you/[type]` | Confirmation after forms and payment | none | 5 |
| `404` | "This page blew away." with the seed | none | 4 |

In the designs, the nav's "Our work", "About" and "Journal" link to anchors on the Home page because those pages weren't designed yet. In the build they link to their own routes.

**Header nav:** Plantings · Our work · About · Journal · Get involved (button). Mobile: logo plus a menu button that opens a full-screen night panel with the same links as large eyebrows.

**Announcement bar:** shows the next upcoming planting (`Next planting: [date], [site] · Join us`), links to it, and is not rendered when no planting is upcoming.

**Footer:** logo, Visit and Take part link columns, newsletter sign-up, contact, NPC name and registration number, Privacy.

## Pages without designs (Phase 4)

Build these from existing components and the same band rhythm. Keep them simple and leave `TODO:` placeholders for content.

- **Our work:** night header ("Our work"), a paper section explaining the food forest layers (canopy, shrubs, ground cover, roots) as a simple typographic list, one section per programme from the Programmes collection, then the site cards.
- **Site detail:** photo header fading into night, the site story (body text), partners at the site, plantings held there (PlantingCard list), trees dedicated there (names and messages where `public: true`), gallery, "what's next", donate CTA.
- **About:** origin story (warm register), approach principles, people (portrait, name, one line), governance block (plain register: NPC name, registration number, board, annual reports when they exist).
- **Journal:** list of cards (tag, title, date, author, image); post page with `body` measure text, hero image, related site or planting links.

## Content model (Astro content collections)

Use Zod schemas in `src/content.config.ts`. Any string field may hold a `TODO:` placeholder (see CLAUDE.md).

**plantings** (one Markdown file per planting; body = about this planting)
- `title`, `site` (reference to sites), `date` (date), `start`, `end` (HH:MM strings), `status`: `upcoming` | `done` | `cancelled`
- `summary` (one line for cards), `bring` (string, default "Gloves if you've got them, a hat, water. We'll bring everything else.")
- `kids`, `access` (strings), `schedule` (array of `{ time, text }`)
- `capacity` (number, optional; the "[N] spots left" counter appears only when set)
- `heroImage` (image, optional), `publish` (boolean)
- After the day: `treesPlanted` (number), `volunteers` (number), `recap` (string), `gallery` (images)

**sites**
- `name`, `slug`, `area`, `address`, `mapUrl`, `location` (`{ lat, lng }`), `summary` (one line), `story` (Markdown body), `partners` (references), `heroImage`, `gallery`, `publish`
- `project` (optional): the site's food forest as a project. `active`, `order`, `treesTarget`, and either `treesPlanted` or `phases` (`[{ name, treesPlanted }]`, summed). Active projects lead the Plantings page.

**programmes**
- `title`, `summary` (one line), `body`, `order`

**journal**
- `title`, `date`, `author`, `tags` (`Plantings` | `Learning` | `Partners` | `Field notes`), `heroImage`, `related` (site or planting references), body

**partners**
- `name`, `logo`, `url`, `site` (optional reference), `publish`

**facts** (fact band)
- `text`, `sourceUrl` (required: a fact without a source doesn't render)

**settings.json** (single file)
- `npcName` ("Business Building Institute NPC"), `npcRegistration`, `section18a` (boolean or `TODO:`), `email` ("info@dandelionclub.co.za"), `social` (`{ instagram, linkedin }`), `treePrice` (number or `TODO:`), `treeIncludes` (array), `donationAmounts` (array of `{ amount, note }`, default 100 / 350 / 1000 with `TODO:` notes), `bank` (`{ accountName, bank, account, branch, swift }`: values from the live site are Business Building Institute NPC, FNB, 63122832446, 200912, FIRNZAJJ)

Seed the collections with the three known sites (Silukhanyo Primary, Mhani Gingi Centre of Excellence, Genadendal), one `done` planting (Silukhanyo Primary, 29 August 2026, counts as `TODO:`), the six draft programmes from the Home design, and `TODO:` for everything else.

Derived figures: trees planted = sum of `treesPlanted`; plantings held = count of `done`; schools = count of sites with at least one `done` planting. Hide any figure whose inputs contain a `TODO:` or `undefined`.

## Forms and integrations

All forms: server-side validation (Zod), honeypot plus Turnstile, POPIA consent checkbox (required), inline errors written as fixes ("Enter a full email address"), a success state, and a no-JavaScript fallback that posts and redirects to `/thank-you/[type]`.

| Form | Fields | On submit |
| --- | --- | --- |
| Join a planting | name, email, phone (optional), adults, children, how heard (optional), consent | Append to Sheet tab `Plantings`; email the person a confirmation with an `.ics` attachment; notify info@ |
| Newsletter | email, consent | Provider not chosen (Brevo or Mailchimp). Until then, append to Sheet tab `Newsletter` behind a `NewsletterProvider` interface. |
| Dedicate a tree | trees, dedicated to, message (≤80 characters), site, show on register, name, email, consent | Create a pending row in Sheet tab `Trees`, redirect to PayFast; on the payment notification (ITN), mark it paid and email a confirmation |
| Donate | once-off or monthly, amount (preset or other), name, email, 18A certificate request, consent | Pending row in Sheet tab `Donations`, redirect to PayFast (subscription for monthly); on ITN mark it paid and send a thank-you |
| Propose a site | organisation, contact name, email, phone, location, what's there now, who will look after it, consent | Sheet tab `Sites pipeline`; notify info@ |
| Partner enquiry | name, organisation, email, interest (site, school, programme, other), message, consent | Sheet tab `Partners`; notify info@ |

PayFast: validate every ITN (signature, source IP, amount match, server confirmation) before marking anything paid. Unit-test the signature code. Amounts in ZAR.

### Environment variables (`.env.example`)

```
PUBLIC_SITE_URL=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
MAIL_FROM=info@dandelionclub.co.za
MAIL_NOTIFY=info@dandelionclub.co.za
GMAIL_DELEGATED_USER=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_SANDBOX=true
PLAUSIBLE_DOMAIN=dandelionclub.co.za
```

## Analytics goals (Plausible)

`Planting sign-up`, `Tree dedicated`, `Donation`, `Partner enquiry`, `Site proposed`, `Newsletter sign-up`.

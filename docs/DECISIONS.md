# Decisions

Newest first. Add a line for every decision that isn't already in CLAUDE.md or SPEC.md.

| Date | Decision | Reason |
| --- | --- | --- |
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

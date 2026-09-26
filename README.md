# Dandelion Club website: build brief

Everything Claude Code needs to build the new dandelionclub.co.za. Nothing is built yet: this folder is the brief.

## What's here

| Path | What |
| --- | --- |
| `CLAUDE.md` | The rules Claude Code reads first: stack, sources of truth, design and copy rules, guardrails |
| `docs/SPEC.md` | Sitemap, page contents, content model, forms and integrations |
| `docs/BUILD_PLAN.md` | Nine phases, each with a "done when" checklist, plus your cutover checklist |
| `docs/DECISIONS.md` | Decisions so far; Claude Code adds to it |
| `design/tokens.json` | Design tokens from the Dandelion Club Design System |
| `design/BRAND.md`, `design/components/` | Brand book and component guidelines |
| `design/pages/` | The eight approved page designs (open any `.dc.html` in a browser for a rough view; the canvas is the proper preview) |
| `design/brand/` | Logo and seed SVGs |

## How to start

1. Create an empty GitHub repo (for example `dandelion-club-site`) and put the contents of this folder in its root.
2. Open it in Claude Code and paste:

   > Read CLAUDE.md, docs/SPEC.md and docs/BUILD_PLAN.md. Then do Phase 0 on a branch called `phase-0-setup`, open a pull request with the preview link, and stop for my review.

3. After each phase, review the preview link and the PR checklist, merge, then ask for the next phase.
4. As facts come in from the Website Content doc, give them to Claude Code ("the tree price is R…", "the next planting is…"). It updates `src/content/` and the `TODO:` count goes down.

## Linked work

- Dandelion Club Design System: tokens, components, brand book (claude.ai artifact)
- Dandelion Club Website Pages: the design canvas (claude.ai artifact)
- Website Spec Sheet and Website Content docs (claude.ai docs)

If the designs or tokens change on claude.ai, re-export them into `design/` before the next phase.

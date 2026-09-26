# Button

A square, outlined call to action: night fill, a 2px dandelion border and a dandelion label set in `button` (Unbounded 900, capitals). It is the live site's only button, used on every ground.

**Consumer provides:** a label (two to four words, a verb first: "Join now", "Dedicate a tree") and an `href`, or a `<button>` inside a form.

| Class | Use |
| --- | --- |
| `dc-btn` | The primary action. Same look on paper, night and dandelion grounds. |
| `dc-btn dc-btn--ghost` | Secondary action: transparent, outlined in night on paper, in dandelion on night. |
| `dc-btn--quiet` | Adds sentence case, as on the live "Contribute" button. Use it only for single-word secondary actions. |

- Padding is `space-5` × `space-6` (20 × 30, as on the live site); `radius-none` always.
- Hover swaps fill and label (dandelion fill, night label). Focus: a 2px ring, `focus-on-paper` or `focus-on-night`, offset 3px.
- Stack two actions with `dc-btn-stack` (live Next planting layout) or run them side by side in `dc-btn-row`.
- Don't: round the corners, put two primary buttons with different wording for the same destination, or write labels longer than one line on mobile.

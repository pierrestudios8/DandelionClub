# FormField

Intentional addition: the live site sends people to Google Forms, and these native fields replace them in the brand.

**Consumer provides:** a label, the input type, an optional hint, and an error message written as a fix ("Enter a full email address"), never just "Invalid".

- Label in `lead` weight above the field, never placeholder-only. The input has a 2px `night` border, `paper` fill and square corners. Focus uses a 2px `focus-on-paper` ring.
- Error: `error` border plus a bold `error` message tied with `aria-describedby`; the field gets `aria-invalid="true"`.
- Every form ends with the POPIA consent checkbox (`dc-check`) and one `dc-btn` whose label says what happens ("Save my spot", not "Submit").
- Forms live on paper grounds. On night, move the form into a `paper` panel.

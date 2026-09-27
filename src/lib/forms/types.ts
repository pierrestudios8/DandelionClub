/** Each form's endpoint name and the /thank-you/[type] page it lands on without JavaScript. */
export const FORMS = {
  newsletter: 'newsletter',
  'planting-signup': 'planting',
  dedicate: 'dedication',
  donate: 'donation',
  'propose-a-site': 'site',
  partner: 'partner',
} as const;

export type FormName = keyof typeof FORMS;
export type ThankYouType = (typeof FORMS)[FormName];

export const THANK_YOU: Record<ThankYouType, { title: string; line: string }> = {
  planting: {
    title: 'See you in the soil.',
    line: "Your spot is saved. We'll email you the details.",
  },
  newsletter: {
    title: "You're on the list.",
    line: "We'll email you when the next planting date is set.",
  },
  dedication: {
    title: 'Thank you.',
    line: 'TODO: what happens after a tree dedication (payment is wired up in Phase 6)',
  },
  donation: {
    title: 'Thank you.',
    line: 'TODO: what happens after a donation (payment is wired up in Phase 6)',
  },
  site: { title: 'Thank you.', line: "We've got your details and we'll be in touch." },
  partner: { title: 'Thank you.', line: "We've got your details and we'll be in touch." },
};

export function isFormName(value: string | undefined): value is FormName {
  return !!value && Object.hasOwn(FORMS, value);
}

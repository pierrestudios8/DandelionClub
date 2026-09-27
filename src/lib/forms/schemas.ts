/**
 * Server-side validation for every form (docs/SPEC.md, Forms). Messages are
 * written as fixes and match the client-side ones on each FormField.
 */
import { z } from 'astro/zod';
import type { FormName } from './types';

const text = (message: string, max = 500) =>
  z.string({ error: message }).trim().min(1, message).max(max, `Keep this to ${max} characters.`);

const optionalText = (max = 500) =>
  z.string().trim().max(max, `Keep this to ${max} characters.`).optional().default('');

const email = z
  .string({ error: 'Enter your email address.' })
  .trim()
  .min(1, 'Enter your email address.')
  .pipe(z.email('Enter a full email address, like name@example.com.'));

const consent = (message: string) => z.literal('yes', { error: message });

const checkbox = z
  .literal('yes')
  .optional()
  .transform((v) => v === 'yes');

const wholeNumber = (message: string, min: number, max: number) =>
  z.coerce.number({ error: message }).int(message).min(min, message).max(max, message);

const phone = (message: string) =>
  z
    .string({ error: message })
    .trim()
    .regex(/^[+\d][\d\s()-]{6,19}$/, message);

export const schemas = {
  newsletter: z.object({
    email,
    consent: consent('Tick this box so we can email you.'),
  }),

  'planting-signup': z.object({
    planting: text('Choose a planting.', 200),
    name: text('Enter your name.', 120),
    email,
    phone: z
      .union([z.literal(''), phone('Enter a mobile number, like 082 123 4567.')])
      .optional()
      .default(''),
    adults: wholeNumber('Enter at least 1 adult.', 1, 50),
    children: wholeNumber('Enter 0 or more children.', 0, 50),
    heard: z.enum(['', 'friend', 'school', 'instagram', 'other']).optional().default(''),
    consent: consent('Tick this box so we can save your spot.'),
  }),

  dedicate: z.object({
    trees: wholeNumber('Choose between 1 and 50 trees.', 1, 50),
    dedicatedTo: text('Enter who the tree is for.', 120),
    message: optionalText(80).refine((v) => v.length <= 80, 'Keep the message to 80 characters.'),
    site: text('Choose a site.', 200),
    showOnRegister: checkbox,
    name: text('Enter your name.', 120),
    email,
    consent: consent('Tick this box so we can process your dedication.'),
  }),

  donate: z
    .object({
      frequency: z.enum(['once', 'monthly'], { error: 'Choose once-off or monthly.' }),
      amount: z.coerce.number().int().positive().optional(),
      otherAmount: z
        .union([
          z.literal(''),
          wholeNumber('Enter a whole number of rand, R5 or more.', 5, 1_000_000),
        ])
        .optional(),
      name: text('Enter your name.', 120),
      email,
      section18a: checkbox,
      consent: consent('Tick this box so we can process your donation.'),
    })
    .transform(({ amount, otherAmount, ...rest }) => ({
      ...rest,
      amount: typeof otherAmount === 'number' ? otherAmount : amount,
    }))
    .refine((d) => typeof d.amount === 'number', {
      message: 'Choose an amount, or enter another amount.',
      path: ['otherAmount'],
    }),

  'propose-a-site': z.object({
    organisation: text('Enter the name of the school or organisation.', 200),
    contactName: text('Enter your name.', 120),
    phone: phone('Enter a phone number we can reach you on.'),
    email,
    location: text('Tell us where the site is.', 300),
    whatsThere: text('Tell us a little about the ground.', 2000),
    caretakers: text('Tell us who will look after the food forest.', 2000),
    consent: consent('Tick this box so we can contact you about the site.'),
  }),

  partner: z.object({
    name: text('Enter your name.', 120),
    organisation: text("Enter your organisation's name.", 200),
    email,
    interest: z.enum(['site', 'school', 'programme', 'other'], {
      error: "Choose what you're interested in.",
    }),
    message: text('Tell us a little about what you have in mind.', 4000),
    consent: consent('Tick this box so we can reply to you.'),
  }),
} satisfies Record<FormName, z.ZodType>;

export type FormData_<F extends FormName> = z.output<(typeof schemas)[F]>;

/** FormData → plain object: repeated names keep the last value, files are ignored. */
export function formToObject(data: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of data.entries()) if (typeof value === 'string') out[key] = value;
  return out;
}

export type FieldErrors = Record<string, string>;

/** Validates one form's fields; on failure, one written message per field. */
export function validate<F extends FormName>(
  form: F,
  fields: Record<string, string>,
): { ok: true; data: FormData_<F> } | { ok: false; errors: FieldErrors } {
  const result = schemas[form].safeParse(fields);
  if (result.success) return { ok: true, data: result.data as FormData_<F> };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'form');
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}

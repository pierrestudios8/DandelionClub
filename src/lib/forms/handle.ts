/**
 * What happens when a form is posted: honeypot, Turnstile, validation, a Sheet
 * row, and the emails (docs/SPEC.md, Forms). Everything outside is injected, so
 * tests can run it with fake Sheets and email.
 *
 * Posts without a Turnstile token (no JavaScript) are saved, marked unverified,
 * and never trigger an email to the address typed in, so the forms can't be
 * used to send mail to strangers. See docs/DECISIONS.md.
 */
import type { Mailer, Message } from '../email';
import type { Row, RowWriter } from '../sheets';
import { buildIcs, atClubTime } from '../calendar';
import { fill } from '../templates';
import { isTodo } from '../todo';
import { validate, type FieldErrors, type FormData_ } from './schemas';
import type { FormName } from './types';

export const TABS: Record<FormName, string> = {
  'planting-signup': 'Plantings',
  newsletter: 'Newsletter',
  dedicate: 'Trees',
  donate: 'Donations',
  'propose-a-site': 'Sites pipeline',
  partner: 'Partners',
};

export interface PlantingInfo {
  id: string;
  site: string;
  address: string;
  date: Date;
  dateLabel: string;
  start: string;
  end: string;
  bring: string;
  url: string;
}

export interface Template {
  subject: string;
  body: string;
}

export interface Deps {
  rows: RowWriter;
  mailer: Mailer;
  notify: string;
  /** Verifies a Turnstile token; undefined when Turnstile isn't configured (dev). */
  verifyTurnstile?: (token: string) => Promise<boolean>;
  template: (name: string) => Promise<Template>;
  /** An upcoming planting by id, or null. */
  planting: (id: string) => Promise<PlantingInfo | null>;
  /** Site ids a tree can be dedicated to (plus "anywhere"). */
  siteIds: () => Promise<string[]>;
  siteUrl: string;
  now?: Date;
  warn?: (message: string) => void;
}

export type Result =
  | { status: 'ok' }
  | { status: 'invalid'; errors: FieldErrors }
  | { status: 'rejected'; message: string };

type Verified = 'yes' | 'no (no JavaScript)' | 'not checked (dev)';

/** "2026-09-27 10:31" in Cape Town. */
function submittedAt(now: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);
}

/** Drops unfinished `TODO:` lines so a placeholder never reaches someone's inbox. */
function withoutTodos(text: string, warn: (m: string) => void, name: string): string {
  const lines = text.split('\n');
  const kept = lines.filter((l) => !l.trim().startsWith('TODO:'));
  if (kept.length !== lines.length)
    warn(`Email template "${name}" still has TODO lines; they were left out.`);
  return (
    kept
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}

async function compose(
  deps: Deps,
  name: string,
  values: Record<string, string | number>,
): Promise<Pick<Message, 'subject' | 'text'>> {
  const t = await deps.template(name);
  const warn = deps.warn ?? console.warn;
  return { subject: fill(t.subject, values), text: withoutTodos(fill(t.body, values), warn, name) };
}

const label = (value: string, fallback = 'not given') => value || fallback;

export async function handleForm(
  form: FormName,
  fields: Record<string, string>,
  deps: Deps,
): Promise<Result> {
  const now = deps.now ?? new Date();

  // Honeypot filled in: say thanks, keep nothing.
  if ((fields.website ?? '') !== '') return { status: 'ok' };

  let verified: Verified = 'not checked (dev)';
  if (deps.verifyTurnstile) {
    const token = fields['cf-turnstile-response'] ?? '';
    if (!token) verified = 'no (no JavaScript)';
    else if (await deps.verifyTurnstile(token)) verified = 'yes';
    else
      return {
        status: 'rejected',
        message: "We couldn't confirm you're not a robot. Please try again.",
      };
  }

  const result = validate(form, fields);
  if (!result.ok) return { status: 'invalid', errors: result.errors };
  const base: Row = { Submitted: submittedAt(now), Verified: verified };
  const mayEmailSender = verified !== 'no (no JavaScript)';

  switch (form) {
    case 'newsletter': {
      const d = result.data as FormData_<'newsletter'>;
      await deps.rows.append(TABS.newsletter, { ...base, Email: d.email, Consent: 'yes' });
      return { status: 'ok' };
    }

    case 'planting-signup': {
      const d = result.data as FormData_<'planting-signup'>;
      const planting = await deps.planting(d.planting);
      if (!planting) {
        return {
          status: 'invalid',
          errors: { planting: 'That planting is no longer taking sign-ups.' },
        };
      }
      await deps.rows.append(TABS['planting-signup'], {
        ...base,
        Planting: planting.id,
        Site: planting.site,
        Date: planting.dateLabel,
        Name: d.name,
        Email: d.email,
        Mobile: d.phone,
        Adults: d.adults,
        Children: d.children,
        'Heard about us': d.heard,
        Consent: 'yes',
      });

      const times =
        isTodo(planting.start) || isTodo(planting.end)
          ? null
          : { start: planting.start, end: planting.end };
      const values = {
        name: d.name,
        email: d.email,
        phone: label(d.phone),
        adults: d.adults,
        children: d.children,
        heard: label(d.heard),
        site: planting.site,
        address: isTodo(planting.address) ? 'address to follow' : planting.address,
        date: planting.dateLabel,
        time: times ? `${times.start} to ${times.end}` : 'times to follow',
        bring: planting.bring,
        siteUrl: planting.url,
        verified,
      };

      if (mayEmailSender) {
        const ics = times
          ? buildIcs(
              {
                uid: `${planting.id}@dandelionclub.co.za`,
                start: atClubTime(planting.date, times.start),
                end: atClubTime(planting.date, times.end),
                summary: `Food forest planting: ${planting.site}`,
                description: `Bring: ${planting.bring}\n${planting.url}`,
                location: isTodo(planting.address)
                  ? planting.site
                  : `${planting.site}, ${planting.address}`,
                url: planting.url,
              },
              now,
            )
          : undefined;
        await deps.mailer.send({
          to: d.email,
          replyTo: deps.notify,
          ...(await compose(deps, 'planting-confirmation', values)),
          attachments: ics
            ? [
                {
                  filename: 'planting.ics',
                  contentType: 'text/calendar; method=PUBLISH',
                  content: ics,
                },
              ]
            : [],
        });
      }
      await deps.mailer.send({
        to: deps.notify,
        replyTo: d.email,
        ...(await compose(deps, 'planting-notification', values)),
      });
      return { status: 'ok' };
    }

    case 'dedicate': {
      const d = result.data as FormData_<'dedicate'>;
      const sites = await deps.siteIds();
      if (d.site !== 'anywhere' && !sites.includes(d.site)) {
        return { status: 'invalid', errors: { site: 'Choose one of our sites.' } };
      }
      // Payment follows in Phase 6; the row waits as pending until PayFast confirms it.
      await deps.rows.append(TABS.dedicate, {
        ...base,
        Status: 'pending',
        Trees: d.trees,
        'Dedicated to': d.dedicatedTo,
        Message: d.message,
        Site: d.site,
        'Show on register': d.showOnRegister ? 'yes' : 'no',
        Name: d.name,
        Email: d.email,
        Consent: 'yes',
      });
      return { status: 'ok' };
    }

    case 'donate': {
      const d = result.data as FormData_<'donate'>;
      await deps.rows.append(TABS.donate, {
        ...base,
        Status: 'pending',
        Frequency: d.frequency,
        Amount: d.amount as number,
        Name: d.name,
        Email: d.email,
        'Section 18A': d.section18a ? 'requested' : 'no',
        Consent: 'yes',
      });
      return { status: 'ok' };
    }

    case 'propose-a-site': {
      const d = result.data as FormData_<'propose-a-site'>;
      await deps.rows.append(TABS['propose-a-site'], {
        ...base,
        Organisation: d.organisation,
        Contact: d.contactName,
        Email: d.email,
        Phone: d.phone,
        Location: d.location,
        "What's there now": d.whatsThere,
        'Who will look after it': d.caretakers,
        Consent: 'yes',
      });
      await deps.mailer.send({
        to: deps.notify,
        replyTo: d.email,
        ...(await compose(deps, 'site-notification', { ...d, verified })),
      });
      return { status: 'ok' };
    }

    case 'partner': {
      const d = result.data as FormData_<'partner'>;
      const interest = {
        site: 'Funding a site',
        school: 'Supporting a school',
        programme: 'Funding a programme',
        other: 'Something else',
      }[d.interest];
      await deps.rows.append(TABS.partner, {
        ...base,
        Name: d.name,
        Organisation: d.organisation,
        Email: d.email,
        Interest: interest,
        Message: d.message,
        Consent: 'yes',
      });
      await deps.mailer.send({
        to: deps.notify,
        replyTo: d.email,
        ...(await compose(deps, 'partner-notification', { ...d, interest, verified })),
      });
      return { status: 'ok' };
    }
  }
}

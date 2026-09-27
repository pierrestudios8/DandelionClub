import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { LogMailer } from '../../src/lib/email';
import { handleForm, type Deps, type PlantingInfo } from '../../src/lib/forms/handle';
import { LogWriter } from '../../src/lib/sheets';

/** The real templates from src/content/emails, front matter split off. */
function template(name: string) {
  const raw = readFileSync(new URL(`../../src/content/emails/${name}.md`, import.meta.url), 'utf8');
  const [, front = '', body = ''] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  const subject = front.match(/subject:\s*['"](.*)['"]/)?.[1] ?? '';
  return { subject, body: body.trim() };
}

const upcoming: PlantingInfo = {
  id: 'silukhanyo-2026-10-24',
  site: 'Silukhanyo Primary',
  address: '1 School Road, Cape Town',
  date: new Date('2026-10-24T00:00:00Z'),
  dateLabel: 'Saturday, 24 October 2026',
  start: '09:00',
  end: '12:30',
  bring: "Gloves if you've got them, a hat, water. We'll bring everything else.",
  url: 'https://dandelionclub.co.za/plantings/silukhanyo-2026-10-24',
};

function setup(over: Partial<Deps> = {}) {
  const rows = new LogWriter();
  const mailer = new LogMailer();
  const warn = vi.fn();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  const deps: Deps = {
    rows,
    mailer,
    notify: 'info@dandelionclub.co.za',
    template: async (name) => template(name),
    planting: async (id) => (id === upcoming.id ? upcoming : null),
    siteIds: async () => ['silukhanyo-primary', 'genadendal'],
    siteUrl: 'https://dandelionclub.co.za',
    now: new Date('2026-09-27T08:31:00Z'),
    warn,
    ...over,
  };
  return { rows, mailer, warn, deps };
}

const signup = {
  planting: upcoming.id,
  name: 'Thandi',
  email: 'thandi@example.com',
  phone: '',
  adults: '2',
  children: '1',
  heard: 'school',
  consent: 'yes',
  website: '',
};

describe('handleForm', () => {
  it('keeps nothing when the honeypot is filled, but says thanks', async () => {
    const { rows, mailer, deps } = setup();
    expect(
      await handleForm(
        'newsletter',
        { email: 'bot@example.com', consent: 'yes', website: 'spam' },
        deps,
      ),
    ).toEqual({
      status: 'ok',
    });
    expect(rows.rows).toEqual([]);
    expect(mailer.sent).toEqual([]);
  });

  it('returns written fixes for invalid fields', async () => {
    const { rows, deps } = setup();
    const result = await handleForm(
      'planting-signup',
      { ...signup, name: '', email: 'thandi@', consent: '' },
      deps,
    );
    expect(result).toEqual({
      status: 'invalid',
      errors: {
        name: 'Enter your name.',
        email: 'Enter a full email address, like name@example.com.',
        consent: 'Tick this box so we can save your spot.',
      },
    });
    expect(rows.rows).toEqual([]);
  });

  it('newsletter: one row in the Newsletter tab, no email', async () => {
    const { rows, mailer, deps } = setup();
    await handleForm('newsletter', { email: ' ana@example.com ', consent: 'yes' }, deps);
    expect(rows.rows).toEqual([
      {
        tab: 'Newsletter',
        row: {
          Submitted: '2026-09-27 10:31',
          Verified: 'not checked (dev)',
          Email: 'ana@example.com',
          Consent: 'yes',
        },
      },
    ]);
    expect(mailer.sent).toEqual([]);
  });

  it('planting sign-up: row, confirmation with calendar invite, and a note to info@', async () => {
    const { rows, mailer, warn, deps } = setup();
    expect(await handleForm('planting-signup', signup, deps)).toEqual({ status: 'ok' });

    expect(rows.rows[0].tab).toBe('Plantings');
    expect(rows.rows[0].row).toMatchObject({
      Name: 'Thandi',
      Adults: 2,
      Children: 1,
      Site: 'Silukhanyo Primary',
    });

    const [confirmation, notification] = mailer.sent;
    expect(confirmation.to).toBe('thandi@example.com');
    expect(confirmation.subject).toBe(
      "You're booked: Silukhanyo Primary, Saturday, 24 October 2026",
    );
    expect(confirmation.text).toContain('09:00 to 12:30');
    expect(confirmation.text).toContain('1 School Road, Cape Town');
    expect(confirmation.attachments?.[0].filename).toBe('planting.ics');
    expect(confirmation.attachments?.[0].content).toContain('DTSTART:20261024T070000Z');

    // The unfinished rain-notice line never reaches the volunteer.
    expect(confirmation.text).not.toContain('TODO');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('planting-confirmation'));

    expect(notification.to).toBe('info@dandelionclub.co.za');
    expect(notification.replyTo).toBe('thandi@example.com');
    expect(notification.text).toContain('Adults: 2');
  });

  it('planting sign-up without confirmed times: no invite, "times to follow"', async () => {
    const { mailer, deps } = setup({
      planting: async () => ({
        ...upcoming,
        start: 'TODO: start time',
        address: 'TODO: street address',
      }),
    });
    await handleForm('planting-signup', signup, deps);
    expect(mailer.sent[0].attachments).toEqual([]);
    expect(mailer.sent[0].text).toContain('times to follow');
    expect(mailer.sent[0].text).toContain('address to follow');
  });

  it('refuses a planting that is past or unknown', async () => {
    const { rows, deps } = setup();
    const result = await handleForm('planting-signup', { ...signup, planting: 'old-one' }, deps);
    expect(result).toEqual({
      status: 'invalid',
      errors: { planting: 'That planting is no longer taking sign-ups.' },
    });
    expect(rows.rows).toEqual([]);
  });

  describe('with Turnstile configured', () => {
    it('rejects a token that fails the check', async () => {
      const { rows, deps } = setup({ verifyTurnstile: async () => false });
      const result = await handleForm(
        'newsletter',
        { email: 'a@example.com', consent: 'yes', 'cf-turnstile-response': 'bad' },
        deps,
      );
      expect(result.status).toBe('rejected');
      expect(rows.rows).toEqual([]);
    });

    it('marks a verified post as verified', async () => {
      const { rows, deps } = setup({ verifyTurnstile: async (t) => t === 'good' });
      await handleForm(
        'newsletter',
        { email: 'a@example.com', consent: 'yes', 'cf-turnstile-response': 'good' },
        deps,
      );
      expect(rows.rows[0].row.Verified).toBe('yes');
    });

    it('saves a no-JavaScript post as unverified and never emails the address typed in', async () => {
      const { rows, mailer, deps } = setup({ verifyTurnstile: async () => true });
      await handleForm('planting-signup', signup, deps);
      expect(rows.rows[0].row.Verified).toBe('no (no JavaScript)');
      expect(mailer.sent.map((m) => m.to)).toEqual(['info@dandelionclub.co.za']);
      expect(mailer.sent[0].text).toContain('Spam check: no (no JavaScript)');
    });
  });

  it('dedicate: a pending row; an unknown site is refused', async () => {
    const { rows, deps } = setup();
    const fields = {
      trees: '3',
      dedicatedTo: 'Gogo',
      message: 'For every Sunday lunch',
      site: 'genadendal',
      showOnRegister: 'yes',
      name: 'Sipho',
      email: 'sipho@example.com',
      consent: 'yes',
    };
    expect(await handleForm('dedicate', fields, deps)).toEqual({ status: 'ok' });
    expect(rows.rows[0]).toMatchObject({
      tab: 'Trees',
      row: { Status: 'pending', Trees: 3, 'Show on register': 'yes' },
    });

    expect(await handleForm('dedicate', { ...fields, site: 'mars' }, deps)).toEqual({
      status: 'invalid',
      errors: { site: 'Choose one of our sites.' },
    });
    expect(
      await handleForm('dedicate', { ...fields, message: 'x'.repeat(81) }, deps),
    ).toMatchObject({
      status: 'invalid',
      errors: { message: expect.stringContaining('80 characters') },
    });
  });

  it('donate: another amount wins over the preset; one of them is required', async () => {
    const { rows, deps } = setup();
    const base = { frequency: 'monthly', name: 'Lee', email: 'lee@example.com', consent: 'yes' };
    await handleForm('donate', { ...base, amount: '350', otherAmount: '500' }, deps);
    expect(rows.rows[0]).toMatchObject({
      tab: 'Donations',
      row: { Amount: 500, Frequency: 'monthly', Status: 'pending' },
    });

    await handleForm('donate', { ...base, amount: '100', otherAmount: '' }, deps);
    expect(rows.rows[1].row.Amount).toBe(100);

    expect(await handleForm('donate', { ...base, otherAmount: '' }, deps)).toEqual({
      status: 'invalid',
      errors: { otherAmount: 'Choose an amount, or enter another amount.' },
    });
    expect(await handleForm('donate', { ...base, otherAmount: '2' }, deps)).toMatchObject({
      errors: { otherAmount: 'Enter a whole number of rand, R5 or more.' },
    });
  });

  it('propose a site and partner: a row and a note to info@ with reply-to set', async () => {
    const { rows, mailer, deps } = setup();
    await handleForm(
      'propose-a-site',
      {
        organisation: 'Test Primary',
        contactName: 'Ms Dlamini',
        phone: '021 000 0000',
        email: 'dlamini@example.com',
        location: 'Khayelitsha',
        whatsThere: 'A bare field with a tap.',
        caretakers: 'The eco club.',
        consent: 'yes',
      },
      deps,
    );
    await handleForm(
      'partner',
      {
        name: 'Jo',
        organisation: 'Acme',
        email: 'jo@acme.example',
        interest: 'programme',
        message: 'Outdoor learning, please.',
        consent: 'yes',
      },
      deps,
    );
    expect(rows.rows.map((r) => r.tab)).toEqual(['Sites pipeline', 'Partners']);
    expect(mailer.sent.map((m) => [m.to, m.replyTo, m.subject])).toEqual([
      ['info@dandelionclub.co.za', 'dlamini@example.com', 'Site proposed: Test Primary'],
      ['info@dandelionclub.co.za', 'jo@acme.example', 'Partner enquiry: Acme'],
    ]);
    expect(mailer.sent[1].text).toContain('Interested in: Funding a programme');
  });
});

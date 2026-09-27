import { describe, expect, it } from 'vitest';
import { atClubTime, buildIcs } from '../../src/lib/calendar';
import { buildMime } from '../../src/lib/email';
import { fill } from '../../src/lib/templates';

const decode = (mime: string, marker: string) => {
  const part = mime
    .split(marker)[1]
    .split(/\r\n\r\n/)[1]
    .split(/\r\n--/)[0];
  return Buffer.from(part.replace(/\r\n/g, ''), 'base64').toString('utf8');
};

describe('buildMime', () => {
  it('writes a plain-text message with UTF-8 body', () => {
    const mime = buildMime('info@dandelionclub.co.za', {
      to: 'a@example.com',
      subject: 'Hello',
      text: 'Sien jou Saterdag — bring gloves.',
      replyTo: 'info@dandelionclub.co.za',
    });
    expect(mime).toContain('From: Dandelion Club <info@dandelionclub.co.za>');
    expect(mime).toContain('Reply-To: info@dandelionclub.co.za');
    expect(mime).toContain('Subject: Hello');
    expect(decode(mime, 'Content-Type: text/plain')).toBe('Sien jou Saterdag — bring gloves.');
  });

  it('encodes a non-ASCII subject', () => {
    const mime = buildMime('info@x.za', {
      to: 'a@x.za',
      subject: "You're booked: Genadendal — Saturday",
      text: 'x',
    });
    expect(mime).toMatch(/Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=/);
  });

  it('never lets a line break into a header', () => {
    const mime = buildMime('info@x.za', {
      to: 'a@x.za\r\nBcc: victim@x.za',
      subject: 'Hi\nBcc: v@x.za',
      text: 'x',
    });
    expect(mime).not.toMatch(/^Bcc:/m);
  });

  it('adds attachments as a multipart message', () => {
    const mime = buildMime(
      'info@x.za',
      {
        to: 'a@x.za',
        subject: 'Hi',
        text: 'See attached.',
        attachments: [
          { filename: 'planting.ics', contentType: 'text/calendar', content: 'BEGIN:VCALENDAR' },
        ],
      },
      'BOUNDARY',
    );
    expect(mime).toContain('Content-Type: multipart/mixed; boundary="BOUNDARY"');
    expect(mime).toContain('Content-Disposition: attachment; filename="planting.ics"');
    expect(mime.trimEnd().endsWith('--BOUNDARY--')).toBe(true);
  });
});

describe('calendar', () => {
  it('reads club times as South African time', () => {
    expect(atClubTime(new Date('2026-10-24T00:00:00Z'), '09:00').toISOString()).toBe(
      '2026-10-24T07:00:00.000Z',
    );
  });

  it('writes a valid event, escaping text and folding long lines', () => {
    const ics = buildIcs(
      {
        uid: 'p1@dandelionclub.co.za',
        start: new Date('2026-10-24T07:00:00Z'),
        end: new Date('2026-10-24T10:30:00Z'),
        summary: 'Food forest planting: Silukhanyo Primary',
        description: `Bring: gloves, a hat; water\n${'long line '.repeat(12)}`,
        location: 'Silukhanyo Primary, Cape Town',
      },
      new Date('2026-09-27T08:00:00Z'),
    );
    const lines = ics.split('\r\n');
    expect(lines).toContain('DTSTART:20261024T070000Z');
    expect(lines).toContain('DTEND:20261024T103000Z');
    expect(lines).toContain('LOCATION:Silukhanyo Primary\\, Cape Town');
    expect(ics).toContain('Bring: gloves\\, a hat\\; water\\n');
    expect(lines.every((l) => Buffer.byteLength(l) <= 75)).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});

describe('fill', () => {
  it('fills placeholders and refuses to leave one blank', () => {
    expect(
      fill('Hi {{name}}, see you at {{ site }}.', { name: 'Thandi', site: 'Genadendal' }),
    ).toBe('Hi Thandi, see you at Genadendal.');
    expect(() => fill('Hi {{name}}', {})).toThrow('{{name}}');
  });
});

import { expect, test, type APIRequestContext } from '@playwright/test';

// Browsers send Origin with every form post; Astro refuses cross-site posts without it.
const ORIGIN = 'http://localhost:4321';

function post(
  request: APIRequestContext,
  path: string,
  fields: Record<string, string>,
  headers: Record<string, string> = {},
) {
  return request.post(path, {
    data: new URLSearchParams(fields).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: ORIGIN, ...headers },
    maxRedirects: 0,
  });
}

const json = { Accept: 'application/json' };

test.describe('form endpoint', () => {
  // Playwright reads fixtures from a destructuring pattern, even an empty one.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'desktop', 'Server behaviour is the same at every width');
  });

  test('returns written fixes as JSON when fields are invalid', async ({ request }) => {
    const response = await post(
      request,
      '/api/partner',
      {
        name: '',
        organisation: 'Acme',
        email: 'nope',
        interest: 'nothing',
        message: '',
        consent: '',
      },
      json,
    );
    expect(response.status()).toBe(422);
    expect((await response.json()).errors).toEqual({
      name: 'Enter your name.',
      email: 'Enter a full email address, like name@example.com.',
      interest: "Choose what you're interested in.",
      message: 'Tell us a little about what you have in mind.',
      consent: 'Tick this box so we can reply to you.',
    });
  });

  test('without JavaScript, shows a page listing what to fix with a way back', async ({
    request,
  }) => {
    const response = await post(
      request,
      '/api/newsletter',
      { email: 'nope', consent: 'yes' },
      { Referer: `${ORIGIN}/plantings` },
    );
    expect(response.status()).toBe(400);
    const html = await response.text();
    expect(html).toContain('Enter a full email address, like name@example.com.');
    expect(html).toContain('href="/plantings"');
  });

  test('accepts a valid post and redirects without JavaScript', async ({ request }) => {
    const response = await post(request, '/api/newsletter', {
      email: 'test@example.com',
      consent: 'yes',
    });
    expect(response.status()).toBe(303);
    expect(response.headers().location).toBe('/thank-you/newsletter');
  });

  test('a filled honeypot looks like success', async ({ request }) => {
    const response = await post(
      request,
      '/api/newsletter',
      { email: 'bot@example.com', consent: 'yes', website: 'http://spam' },
      json,
    );
    expect(await response.json()).toEqual({ ok: true });
  });

  test('refuses a sign-up for a planting that is not upcoming', async ({ request }) => {
    const response = await post(
      request,
      '/api/planting-signup',
      {
        planting: 'silukhanyo-primary-2026-08-29',
        name: 'Test',
        email: 'test@example.com',
        adults: '1',
        children: '0',
        consent: 'yes',
      },
      json,
    );
    expect(response.status()).toBe(422);
    expect((await response.json()).errors.planting).toBe(
      'That planting is no longer taking sign-ups.',
    );
  });

  test('refuses a post from another site', async ({ request }) => {
    const response = await post(
      request,
      '/api/newsletter',
      { email: 'a@example.com', consent: 'yes' },
      { Origin: 'https://evil.example' },
    );
    expect(response.status()).toBe(403);
  });

  test('unknown forms are not found', async ({ request }) => {
    expect((await post(request, '/api/nope', {})).status()).toBe(404);
  });
});

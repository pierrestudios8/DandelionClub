import { createVerify, generateKeyPairSync } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfig, ConfigError } from '../../src/lib/env';
import { clearTokenCache, getAccessToken, signJwt } from '../../src/lib/google';
import { GoogleSheetsWriter } from '../../src/lib/sheets';
import { verifyTurnstile } from '../../src/lib/turnstile';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});
const auth = { clientEmail: 'forms@club.iam.gserviceaccount.com', privateKey };

beforeEach(() => clearTokenCache());

describe('signJwt', () => {
  it('signs an RS256 assertion Google can verify', () => {
    const jwt = signJwt(
      { ...auth, scopes: ['a', 'b'], subject: 'info@x.za' },
      Date.UTC(2026, 8, 27),
    );
    const [header, claims, signature] = jwt.split('.');
    const ok = createVerify('RSA-SHA256')
      .update(`${header}.${claims}`)
      .verify(publicKey, Buffer.from(signature, 'base64url'));
    expect(ok).toBe(true);
    expect(JSON.parse(Buffer.from(claims, 'base64url').toString())).toMatchObject({
      iss: auth.clientEmail,
      scope: 'a b',
      sub: 'info@x.za',
      aud: 'https://oauth2.googleapis.com/token',
    });
  });
});

/** A fake Google: token endpoint plus a Sheets API with one existing tab. */
function fakeGoogle(tabs: Record<string, string[][]>) {
  const calls: { method: string; url: string; body?: unknown }[] = [];
  const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ method, url, body });
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      return Response.json({ access_token: 'tok', expires_in: 3600 });
    }
    if (url.includes('?fields=sheets.properties.title')) {
      return Response.json({
        sheets: Object.keys(tabs).map((title) => ({ properties: { title } })),
      });
    }
    if (url.includes(':batchUpdate')) {
      const title = (body as { requests: { addSheet: { properties: { title: string } } }[] })
        .requests[0].addSheet.properties.title;
      tabs[title] = [];
      return Response.json({});
    }
    const tab = decodeURIComponent(url).match(/values\/'(.+?)'!/)?.[1] ?? '';
    if (method === 'GET') return Response.json({ values: tabs[tab]?.slice(0, 1) ?? [] });
    if (method === 'PUT') {
      tabs[tab][0] = (body as { values: string[][] }).values[0];
      return Response.json({});
    }
    tabs[tab].push((body as { values: string[][] }).values[0]);
    return Response.json({});
  });
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch };
}

describe('GoogleSheetsWriter', () => {
  it('creates a missing tab and its header row on first write, then appends in header order', async () => {
    const tabs: Record<string, string[][]> = { Plantings: [['Submitted', 'Name']] };
    const { calls, fetchImpl } = fakeGoogle(tabs);
    const writer = new GoogleSheetsWriter('sheet-1', auth, fetchImpl);

    await writer.append('Sites pipeline', {
      Submitted: '2026-09-27 10:31',
      Organisation: 'Test Primary',
    });
    await writer.append('Sites pipeline', {
      Submitted: '2026-09-27 10:32',
      Organisation: 'Second',
    });
    expect(tabs['Sites pipeline']).toEqual([
      ['Submitted', 'Organisation'],
      ['2026-09-27 10:31', 'Test Primary'],
      ['2026-09-27 10:32', 'Second'],
    ]);
    expect(calls.filter((c) => c.url.includes(':batchUpdate'))).toHaveLength(1);
    expect(
      calls.every((c) => c.url.startsWith('https://oauth2') || c.url.includes('/sheet-1')),
    ).toBe(true);
  });

  it('keeps existing column order and adds new columns at the end', async () => {
    const tabs: Record<string, string[][]> = { Plantings: [['Name', 'Submitted']] };
    const { fetchImpl } = fakeGoogle(tabs);
    await new GoogleSheetsWriter('s', auth, fetchImpl).append('Plantings', {
      Submitted: 't',
      Name: 'Thandi',
      Adults: 2,
    });
    expect(tabs.Plantings).toEqual([
      ['Name', 'Submitted', 'Adults'],
      ['Thandi', 't', 2],
    ]);
  });

  it('reuses the access token', async () => {
    const { calls, fetchImpl } = fakeGoogle({ Newsletter: [['Email']] });
    const writer = new GoogleSheetsWriter('s', auth, fetchImpl);
    await writer.append('Newsletter', { Email: 'a@x.za' });
    await writer.append('Newsletter', { Email: 'b@x.za' });
    expect(calls.filter((c) => c.url.startsWith('https://oauth2'))).toHaveLength(1);
    await expect(
      getAccessToken(
        { ...auth, scopes: ['https://www.googleapis.com/auth/spreadsheets'] },
        fetchImpl,
      ),
    ).resolves.toBe('tok');
  });
});

describe('verifyTurnstile', () => {
  const reply = (body: unknown, ok = true) =>
    vi.fn(async () =>
      ok ? Response.json(body) : new Response('', { status: 500 }),
    ) as unknown as typeof fetch;

  it('passes only on success: true', async () => {
    expect(await verifyTurnstile('t', 's', '1.2.3.4', reply({ success: true }))).toBe(true);
    expect(await verifyTurnstile('t', 's', undefined, reply({ success: false }))).toBe(false);
    expect(await verifyTurnstile('t', 's', undefined, reply({}, false))).toBe(false);
    expect(await verifyTurnstile('', 's', undefined, reply({ success: true }))).toBe(false);
  });
});

describe('loadConfig', () => {
  const google = {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: 'a@b',
    GOOGLE_PRIVATE_KEY: 'line1\\nline2',
    GOOGLE_SHEET_ID: 'id',
  };

  it('logs instead of writing when Google is not configured, outside production', () => {
    expect(loadConfig({}).mode).toBe('log');
    expect(loadConfig({ VERCEL_ENV: 'preview' }).mode).toBe('log');
  });

  it('goes live with the Google variables, unescaping the key', () => {
    const config = loadConfig(google);
    expect(config.mode).toBe('live');
    expect(config.google?.privateKey).toBe('line1\nline2');
  });

  it('refuses to run production without Google, Gmail delegation or Turnstile', () => {
    const mail = { GMAIL_DELEGATED_USER: 'info@dandelionclub.co.za' };
    expect(() => loadConfig({ VERCEL_ENV: 'production' })).toThrow(ConfigError);
    expect(() => loadConfig({ VERCEL_ENV: 'production', ...google })).toThrow(
      'GMAIL_DELEGATED_USER',
    );
    expect(() => loadConfig({ VERCEL_ENV: 'production', ...google, ...mail })).toThrow(
      'TURNSTILE_SECRET_KEY',
    );
    expect(
      loadConfig({ VERCEL_ENV: 'production', ...google, ...mail, TURNSTILE_SECRET_KEY: 's' }).mode,
    ).toBe('live');
  });
});

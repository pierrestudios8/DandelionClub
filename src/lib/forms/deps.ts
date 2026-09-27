/** Real dependencies for the form handler, from the environment and content. */
import { getEntry } from 'astro:content';
import { GmailMailer, LogMailer, type Mailer } from '../email';
import { loadConfig, type ServerConfig } from '../env';
import { GoogleSheetsWriter, LogWriter, type RowWriter } from '../sheets';
import { verifyTurnstile } from '../turnstile';
import { getSites, getUpcomingPlantings } from '../content';
import { formatDate } from '../format';
import type { Deps } from './handle';

export function buildDeps(site: URL, remoteIp?: string, config: ServerConfig = loadConfig()): Deps {
  let rows: RowWriter;
  let mailer: Mailer;
  if (config.mode === 'live' && config.google) {
    const auth = { clientEmail: config.google.clientEmail, privateKey: config.google.privateKey };
    rows = new GoogleSheetsWriter(config.google.sheetId, auth);
    mailer = config.google.delegatedUser
      ? new GmailMailer(config.mailFrom, { ...auth, subject: config.google.delegatedUser })
      : new LogMailer();
  } else {
    rows = new LogWriter();
    mailer = new LogMailer();
  }

  const secret = config.turnstileSecret;
  return {
    rows,
    mailer,
    notify: config.mailNotify,
    verifyTurnstile: secret ? (token) => verifyTurnstile(token, secret, remoteIp) : undefined,
    siteUrl: site.origin,
    template: async (name) => {
      const entry = await getEntry('emails', name);
      if (!entry?.body) throw new Error(`Missing email template src/content/emails/${name}.md`);
      return { subject: entry.data.subject, body: entry.body };
    },
    planting: async (id) => {
      const planting = (await getUpcomingPlantings()).find((p) => p.id === id);
      if (!planting) return null;
      const siteEntry = await getEntry(planting.data.site);
      return {
        id: planting.id,
        site: siteEntry?.data.name ?? planting.data.site.id,
        address: siteEntry?.data.address ?? '',
        date: planting.data.date,
        dateLabel: formatDate(planting.data.date, { weekday: true }),
        start: planting.data.start,
        end: planting.data.end,
        bring: planting.data.bring,
        url: new URL(`/plantings/${planting.id}`, site).href,
      };
    },
    siteIds: async () => (await getSites()).map((s) => s.id),
  };
}

/**
 * Server configuration for forms, from environment variables (see .env.example).
 *
 * "live" when the Google variables are set: rows go to the Sheet and email is sent.
 * "log" otherwise, outside production only: rows and emails are printed to the
 * server log, so forms work in dev, tests and unconfigured previews.
 * Production without the Google variables is an error, never a silent log.
 */
export interface GoogleConfig {
  clientEmail: string;
  privateKey: string;
  sheetId: string;
  delegatedUser?: string;
}

export interface ServerConfig {
  mode: 'live' | 'log';
  production: boolean;
  google?: GoogleConfig;
  mailFrom: string;
  mailNotify: string;
  turnstileSecret?: string;
}

type Env = Record<string, string | undefined>;

export class ConfigError extends Error {}

export function loadConfig(env: Env = process.env): ServerConfig {
  const production = env.VERCEL_ENV === 'production';
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = env.GOOGLE_SHEET_ID;
  const google =
    clientEmail && privateKey && sheetId
      ? { clientEmail, privateKey, sheetId, delegatedUser: env.GMAIL_DELEGATED_USER || undefined }
      : undefined;

  if (production && !google) {
    throw new ConfigError(
      'Forms need GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY and GOOGLE_SHEET_ID in production.',
    );
  }
  if (production && !env.GMAIL_DELEGATED_USER) {
    throw new ConfigError('Forms need GMAIL_DELEGATED_USER in production, or no email is sent.');
  }
  if (production && !env.TURNSTILE_SECRET_KEY) {
    throw new ConfigError('Forms need TURNSTILE_SECRET_KEY in production.');
  }

  return {
    mode: google ? 'live' : 'log',
    production,
    google,
    mailFrom: env.MAIL_FROM || 'info@dandelionclub.co.za',
    mailNotify: env.MAIL_NOTIFY || 'info@dandelionclub.co.za',
    turnstileSecret: env.TURNSTILE_SECRET_KEY || undefined,
  };
}

/**
 * Email through the club's Google Workspace: the Gmail API, sending as
 * GMAIL_DELEGATED_USER via the service account's domain-wide delegation.
 * Plain-text messages, optionally with attachments (the planting .ics).
 */
import { getAccessToken, type TokenRequest } from './google';

export interface Attachment {
  filename: string;
  contentType: string;
  content: string;
}

export interface Message {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: Attachment[];
}

export interface Mailer {
  send(message: Message): Promise<void>;
}

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
/** Base64 wrapped at 76 characters, as MIME expects. */
const b64Lines = (s: string) => b64(s).replace(/.{76}/g, '$&\r\n');
/** RFC 2047 encoded word, for non-ASCII subjects. */
const header = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
/** A header value may never carry a line break (header injection). */
const clean = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

export function buildMime(
  from: string,
  message: Message,
  boundary = `dc-${Date.now().toString(36)}`,
): string {
  const lines = [
    `From: Dandelion Club <${clean(from)}>`,
    `To: ${clean(message.to)}`,
    ...(message.replyTo ? [`Reply-To: ${clean(message.replyTo)}`] : []),
    `Subject: ${header(clean(message.subject))}`,
    'MIME-Version: 1.0',
  ];
  const textPart = [
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    b64Lines(message.text),
  ];
  if (!message.attachments?.length) return [...lines, ...textPart].join('\r\n');

  return [
    ...lines,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    ...textPart,
    ...message.attachments.flatMap((a) => [
      `--${boundary}`,
      `Content-Type: ${a.contentType}; name="${clean(a.filename)}"`,
      `Content-Disposition: attachment; filename="${clean(a.filename)}"`,
      'Content-Transfer-Encoding: base64',
      '',
      b64Lines(a.content),
    ]),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

export class GmailMailer implements Mailer {
  constructor(
    private readonly from: string,
    private readonly auth: Omit<TokenRequest, 'scopes'> & { subject: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(message: Message): Promise<void> {
    const token = await getAccessToken(
      { ...this.auth, scopes: ['https://www.googleapis.com/auth/gmail.send'] },
      this.fetchImpl,
    );
    const response = await this.fetchImpl(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw: Buffer.from(buildMime(this.from, message)).toString('base64url'),
        }),
      },
    );
    if (!response.ok)
      throw new Error(`Gmail send failed: ${response.status} ${await response.text()}`);
  }
}

/** Dev, tests and unconfigured previews: prints the email instead of sending it. */
export class LogMailer implements Mailer {
  readonly sent: Message[] = [];

  async send(message: Message): Promise<void> {
    this.sent.push(message);
    const files = message.attachments?.map((a) => a.filename).join(', ');
    console.info(`[email:log] to ${message.to}: ${message.subject}${files ? ` (+ ${files})` : ''}`);
  }
}

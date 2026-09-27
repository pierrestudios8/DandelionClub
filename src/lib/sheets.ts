/**
 * Appends form rows to the club's Google Sheet through the Sheets REST API.
 * One tab per form; the tab and its header row are created on first write.
 */
import { getAccessToken, type TokenRequest } from './google';

export type Row = Record<string, string | number | boolean>;

export interface RowWriter {
  append(tab: string, row: Row): Promise<void>;
}

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/** Sheet ranges quote tab names that contain spaces, e.g. 'Sites pipeline'!1:1. */
const range = (tab: string, cells: string) => `'${tab.replace(/'/g, "''")}'!${cells}`;

export class GoogleSheetsWriter implements RowWriter {
  private readonly ready = new Map<string, Promise<string[]>>();

  constructor(
    private readonly sheetId: string,
    private readonly auth: Omit<TokenRequest, 'scopes' | 'subject'>,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request(path: string, init: RequestInit = {}) {
    const token = await getAccessToken({ ...this.auth, scopes: [SCOPE] }, this.fetchImpl);
    const response = await this.fetchImpl(`${API}/${this.sheetId}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!response.ok)
      throw new Error(
        `Sheets ${init.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`,
      );
    return response.json() as Promise<Record<string, unknown>>;
  }

  /** Makes sure the tab exists and has a header row; returns the header. */
  private headers(tab: string, columns: string[]): Promise<string[]> {
    let pending = this.ready.get(tab);
    if (!pending) {
      pending = (async () => {
        const meta = (await this.request('?fields=sheets.properties.title')) as {
          sheets?: { properties: { title: string } }[];
        };
        if (!meta.sheets?.some((s) => s.properties.title === tab)) {
          await this.request(':batchUpdate', {
            method: 'POST',
            body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }),
          });
        }
        const existing = (await this.request(
          `/values/${encodeURIComponent(range(tab, '1:1'))}`,
        )) as {
          values?: string[][];
        };
        const header = existing.values?.[0] ?? [];
        const missing = columns.filter((c) => !header.includes(c));
        if (missing.length) {
          const full = [...header, ...missing];
          await this.request(
            `/values/${encodeURIComponent(range(tab, '1:1'))}?valueInputOption=RAW`,
            {
              method: 'PUT',
              body: JSON.stringify({ values: [full] }),
            },
          );
          return full;
        }
        return header;
      })();
      pending.catch(() => this.ready.delete(tab));
      this.ready.set(tab, pending);
    }
    return pending;
  }

  async append(tab: string, row: Row): Promise<void> {
    let header = await this.headers(tab, Object.keys(row));
    if (Object.keys(row).some((c) => !header.includes(c))) {
      // A new field since the header was written: extend it.
      this.ready.delete(tab);
      header = await this.headers(tab, Object.keys(row));
    }
    const values = [header.map((column) => (column in row ? row[column] : ''))];
    await this.request(
      `/values/${encodeURIComponent(range(tab, 'A1'))}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: 'POST', body: JSON.stringify({ values }) },
    );
  }
}

/** Dev, tests and unconfigured previews: prints the row instead of writing it. */
export class LogWriter implements RowWriter {
  readonly rows: { tab: string; row: Row }[] = [];

  async append(tab: string, row: Row): Promise<void> {
    this.rows.push({ tab, row });
    console.info(`[sheets:log] ${tab}`, JSON.stringify(row));
  }
}

/**
 * Google service-account access tokens (OAuth 2.0 JWT bearer flow), without the
 * googleapis package: sign a JWT with the account's key, swap it for a token.
 * `subject` impersonates a Workspace user (domain-wide delegation, for Gmail).
 */
import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface TokenRequest {
  clientEmail: string;
  privateKey: string;
  scopes: string[];
  subject?: string;
}

const base64url = (input: string | Buffer) => Buffer.from(input).toString('base64url');

/** The signed assertion Google exchanges for an access token. */
export function signJwt(req: TokenRequest, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: req.clientEmail,
      scope: req.scopes.join(' '),
      aud: TOKEN_URL,
      iat,
      exp: iat + 3600,
      ...(req.subject && { sub: req.subject }),
    }),
  );
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(req.privateKey);
  return `${header}.${claims}.${base64url(signature)}`;
}

const cache = new Map<string, { token: string; expires: number }>();

export async function getAccessToken(
  req: TokenRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const key = `${req.clientEmail}|${req.subject ?? ''}|${req.scopes.join(' ')}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now() + 60_000) return hit.token;

  const response = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signJwt(req),
    }),
  });
  if (!response.ok)
    throw new Error(`Google token request failed: ${response.status} ${await response.text()}`);
  const { access_token, expires_in } = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cache.set(key, { token: access_token, expires: Date.now() + expires_in * 1000 });
  return access_token;
}

export function clearTokenCache() {
  cache.clear();
}

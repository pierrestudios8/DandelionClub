/**
 * Every form posts here (docs/SPEC.md, Forms).
 *
 * fetch (Accept: application/json): 200 { ok }, 422 { errors } with one written
 * fix per field, 403 { error } when the spam check fails, 500 otherwise.
 * Plain post (no JavaScript): 303 to /thank-you/[type], or a short page listing
 * what to fix. Dedicate and Donate go on to PayFast in Phase 6.
 */
import type { APIRoute } from 'astro';
import { ConfigError } from '../../lib/env';
import { buildDeps } from '../../lib/forms/deps';
import { handleForm, type Result } from '../../lib/forms/handle';
import { formToObject } from '../../lib/forms/schemas';
import { FORMS, isFormName } from '../../lib/forms/types';

export const prerender = false;

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

/** The no-JavaScript error page: plain, readable, and a way back. */
function errorPage(messages: string[], status: number, back = '/'): Response {
  const items = messages.map((m) => `<li>${escape(m)}</li>`).join('');
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Please check the form · Dandelion Club</title><style>body{font:18px/1.55 system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem}</style></head><body><main><h1>Please check the form</h1><ul>${items}</ul><p><a href="${escape(back)}">Go back to the form</a></p></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export const POST: APIRoute = async ({ params, request, redirect, url, clientAddress }) => {
  const { form } = params;
  if (!isFormName(form)) return new Response('Not found', { status: 404 });
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;
  // Back to the page the form was on, if it's one of ours.
  const referer = request.headers.get('referer');
  const back =
    referer && new URL(referer, url).origin === url.origin ? new URL(referer).pathname : '/';

  let result: Result;
  try {
    const fields = formToObject(await request.formData());
    let ip: string | undefined;
    try {
      ip = clientAddress;
    } catch {
      ip = undefined;
    }
    result = await handleForm(form, fields, buildDeps(url, ip));
  } catch (error) {
    console.error(`[forms] ${form} failed`, error);
    const message =
      error instanceof ConfigError
        ? 'Forms are not set up on this server yet.'
        : "That didn't go through. Please try again, or email info@dandelionclub.co.za.";
    return wantsJson
      ? Response.json({ error: message }, { status: 500 })
      : errorPage([message], 500, back);
  }

  switch (result.status) {
    case 'ok':
      return wantsJson ? Response.json({ ok: true }) : redirect(`/thank-you/${FORMS[form]}`, 303);
    case 'invalid':
      return wantsJson
        ? Response.json({ errors: result.errors }, { status: 422 })
        : errorPage(Object.values(result.errors), 400, back);
    case 'rejected':
      return wantsJson
        ? Response.json({ error: result.message }, { status: 403 })
        : errorPage([result.message], 403, back);
  }
};

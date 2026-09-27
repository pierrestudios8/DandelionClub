/**
 * Phase 3 stub for every form: accepts the post and reports success.
 * Phase 5 replaces this with validation, Sheets, email and Turnstile;
 * Phase 6 sends Dedicate and Donate to PayFast.
 *
 * fetch (Accept: application/json) → 200 { ok: true }
 * plain form post (no JavaScript)  → 303 to /thank-you/[type]
 */
import type { APIRoute } from 'astro';
import { FORMS, isFormName } from '../../lib/forms/types';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const { form } = params;
  if (!isFormName(form)) return new Response('Not found', { status: 404 });

  // Phase 5 reads and validates the fields; drain the body for now.
  await request.formData();

  if (request.headers.get('accept')?.includes('application/json')) {
    return Response.json({ ok: true });
  }
  return redirect(`/thank-you/${FORMS[form]}`, 303);
};

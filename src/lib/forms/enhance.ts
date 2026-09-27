/**
 * Progressive enhancement for forms marked `data-enhance`:
 * written errors instead of browser bubbles, then a fetch POST with an
 * in-place success message. Without JavaScript the form posts normally and
 * the endpoint redirects to /thank-you/[type].
 *
 * Markup contract (FormField follows it): each control has an id, its wrapper
 * has `data-field`, and an error element with id `<control id>-error` exists.
 */
import { invalidMessage } from './validate';

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function setError(control: Control, message: string) {
  const error = document.getElementById(`${control.id}-error`);
  const wrapper = control.closest<HTMLElement>('[data-field]');
  const describedBy = new Set((control.getAttribute('aria-describedby') ?? '').split(' '));
  describedBy.delete('');
  if (message) {
    control.setAttribute('aria-invalid', 'true');
    wrapper?.setAttribute('data-invalid', '');
    if (error) {
      error.textContent = message;
      error.hidden = false;
      describedBy.add(error.id);
    }
  } else {
    control.removeAttribute('aria-invalid');
    wrapper?.removeAttribute('data-invalid');
    if (error) {
      error.textContent = '';
      error.hidden = true;
      describedBy.delete(error.id);
    }
  }
  if (describedBy.size) control.setAttribute('aria-describedby', [...describedBy].join(' '));
  else control.removeAttribute('aria-describedby');
}

function controls(form: HTMLFormElement): Control[] {
  return [...form.elements].filter(
    (el): el is Control =>
      (el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement) &&
      el.willValidate &&
      !!el.id &&
      !el.closest('[data-honeypot]'),
  );
}

function validate(form: HTMLFormElement): Control | null {
  let first: Control | null = null;
  for (const control of controls(form)) {
    const valid = control.checkValidity();
    setError(control, valid ? '' : invalidMessage(control));
    if (!valid && !first) first = control;
  }
  return first;
}

function enhance(form: HTMLFormElement) {
  form.noValidate = true;
  const success = form.id
    ? document.querySelector<HTMLElement>(`[data-success-for="${form.id}"]`)
    : null;
  const failure = form.querySelector<HTMLElement>('[data-form-failure]');

  // Once a field has shown an error, re-check it as the person fixes it.
  const recheck = (event: Event) => {
    const target = event.target as Control;
    if (target.getAttribute('aria-invalid') === 'true') {
      setError(target, target.checkValidity() ? '' : invalidMessage(target));
    }
  };
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const firstInvalid = validate(form);
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    const submitters = [
      ...form.querySelectorAll<HTMLButtonElement>('button[type="submit"]'),
      ...(form.id
        ? document.querySelectorAll<HTMLButtonElement>(`button[type="submit"][form="${form.id}"]`)
        : []),
    ];
    submitters.forEach((b) => (b.disabled = true));
    if (failure) failure.hidden = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (success) {
        form.hidden = true;
        form.dispatchEvent(new CustomEvent('dc:submitted', { bubbles: true }));
        success.hidden = false;
        success.focus();
      } else {
        form.reset();
      }
    } catch {
      if (failure) {
        failure.hidden = false;
        failure.focus();
      }
    } finally {
      submitters.forEach((b) => (b.disabled = false));
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-enhance]').forEach(enhance);

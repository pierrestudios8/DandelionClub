/**
 * Messages for invalid fields, written as fixes. A field's own
 * `data-invalid-message` wins; these are the fallbacks.
 */
export interface ValidityLike {
  valueMissing: boolean;
  typeMismatch: boolean;
  rangeUnderflow: boolean;
  rangeOverflow: boolean;
  tooLong: boolean;
  badInput: boolean;
  stepMismatch: boolean;
  patternMismatch: boolean;
}

export interface ControlLike {
  type: string;
  validity: ValidityLike;
  dataset: { invalidMessage?: string };
  getAttribute(name: string): string | null;
}

export function invalidMessage(control: ControlLike): string {
  if (control.dataset.invalidMessage) return control.dataset.invalidMessage;
  const v = control.validity;
  if (control.type === 'checkbox') return 'Tick this box to carry on.';
  if (v.valueMissing)
    return control.type === 'email' ? 'Enter your email address.' : 'Fill this in.';
  if (v.typeMismatch && control.type === 'email') {
    return 'Enter a full email address, like name@example.com.';
  }
  if (v.rangeUnderflow) return `Enter ${control.getAttribute('min')} or more.`;
  if (v.rangeOverflow) return `Enter ${control.getAttribute('max')} or fewer.`;
  if (v.tooLong) return `Keep this to ${control.getAttribute('maxlength')} characters.`;
  if (v.badInput || v.stepMismatch) return 'Enter a whole number.';
  return 'Check this and try again.';
}

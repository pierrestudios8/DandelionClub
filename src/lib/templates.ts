/** Fills an email template's {{placeholders}}. A missing value is an error, never a blank. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Email template needs a value for {{${key}}}`);
    return String(values[key]);
  });
}

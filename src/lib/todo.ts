/** A content value the club hasn't confirmed yet: any string starting with `TODO:`. */
export type Todo = `TODO:${string}`;

export function isTodo(value: unknown): value is Todo {
  return typeof value === 'string' && value.startsWith('TODO:');
}

/** "TODO: price per tree" → "price per tree". */
export function todoLabel(value: Todo): string {
  return value.slice('TODO:'.length).trim();
}

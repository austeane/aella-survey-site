const HIDDEN_COLUMN_NAMES = [
  "whowears",
  "ascore",
  "normalsex",
  "knowwhatarousesyou",
] as const;

export const HIDDEN_COLUMNS = new Set<string>(HIDDEN_COLUMN_NAMES);

export function isHiddenColumn(name: string): boolean {
  return HIDDEN_COLUMNS.has(name);
}

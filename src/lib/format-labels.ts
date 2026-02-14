interface ColumnWithDisplayName {
  name: string;
  displayName?: string;
}

const HASH_SUFFIX_PATTERN = /\s\(([a-z0-9]{5,8})\)$/i;

export function stripHashSuffix(value: string): string {
  return value.replace(HASH_SUFFIX_PATTERN, "");
}

export function candidateValueKeys(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [trimmed];
  }

  const candidates = new Set<string>([trimmed]);
  const numeric = Number(trimmed);

  if (Number.isFinite(numeric)) {
    candidates.add(String(numeric));
    if (Number.isInteger(numeric)) {
      candidates.add(String(Math.trunc(numeric)));
    }
  }

  if (/^-?\d+\.0+$/.test(trimmed)) {
    candidates.add(trimmed.replace(/\.0+$/, ""));
  }

  return [...candidates];
}

export function formatValueWithLabel(
  value: string,
  valueLabels?: Record<string, string>,
  includeRawValue = false,
): string {
  if (value === "NULL") {
    return "No answer";
  }
  if (!valueLabels) {
    return value;
  }

  for (const key of candidateValueKeys(value)) {
    const label = valueLabels[key];
    if (label) {
      return includeRawValue ? `${value} - ${label}` : label;
    }
  }

  return value;
}

export function getColumnDisplayName(column: ColumnWithDisplayName): string {
  return stripHashSuffix(column.displayName ?? column.name);
}

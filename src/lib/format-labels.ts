interface ColumnWithDisplayName {
  name: string;
  displayName?: string;
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

export function formatValueWithLabel(value: string, valueLabels?: Record<string, string>): string {
  if (!valueLabels || value === "NULL") {
    return value;
  }

  for (const key of candidateValueKeys(value)) {
    const label = valueLabels[key];
    if (label) {
      return `${value} - ${label}`;
    }
  }

  return value;
}

export function getColumnDisplayName(column: ColumnWithDisplayName): string {
  return column.displayName ?? column.name;
}

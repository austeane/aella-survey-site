export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function quoteLiteral(value: string | number | boolean | null): string {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${value.replaceAll("'", "''")}'`;
}

export type FilterValue = string | number | boolean | null;
export type FilterInput = FilterValue | FilterValue[];

export function buildWhereClause(filters: Record<string, FilterInput> | undefined): string {
  if (!filters || Object.keys(filters).length === 0) return "";

  const predicates: string[] = [];

  for (const [columnName, rawValue] of Object.entries(filters)) {
    const col = quoteIdentifier(columnName);

    if (Array.isArray(rawValue)) {
      const nonNull = rawValue.filter((v) => v !== null);
      const hasNull = rawValue.length !== nonNull.length;
      const inPred = nonNull.length > 0
        ? `${col} IN (${nonNull.map((v) => quoteLiteral(v)).join(", ")})`
        : "";

      if (hasNull && inPred) predicates.push(`(${inPred} OR ${col} IS NULL)`);
      else if (hasNull) predicates.push(`${col} IS NULL`);
      else if (inPred) predicates.push(inPred);
      continue;
    }

    if (rawValue === null) {
      predicates.push(`${col} IS NULL`);
      continue;
    }

    predicates.push(`${col} = ${quoteLiteral(rawValue)}`);
  }

  return predicates.length === 0 ? "" : `WHERE ${predicates.join(" AND ")}`;
}

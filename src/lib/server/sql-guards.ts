export const DEFAULT_QUERY_LIMIT = 1_000;
export const HARD_QUERY_LIMIT = 10_000;
export const DEFAULT_QUERY_TIMEOUT_MS = 5_000;

const allowedLeadingKeywords = /^(SELECT|WITH|DESCRIBE|EXPLAIN)\b/i;

const blockedTokens = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "COPY",
  "ATTACH",
  "DETACH",
  "INSTALL",
  "LOAD",
  "PRAGMA",
  "CALL",
  "EXPORT",
  "IMPORT",
  "VACUUM",
  "TRUNCATE",
  "MERGE",
  "REPLACE",
  "GRANT",
  "REVOKE",
];

const blockedRegex = new RegExp(`\\b(${blockedTokens.join("|")})\\b`, "i");

export class SqlGuardError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "SqlGuardError";
  }
}

export function normalizeSql(rawSql: string): string {
  return rawSql.trim().replace(/;+$/g, "");
}

export function ensureReadOnlySql(rawSql: string): string {
  const normalizedSql = normalizeSql(rawSql);

  if (normalizedSql.length === 0) {
    throw new SqlGuardError("EMPTY_SQL", "SQL must not be empty.");
  }

  if (normalizedSql.includes(";")) {
    throw new SqlGuardError(
      "MULTI_STATEMENT_BLOCKED",
      "Only a single read-only SQL statement is allowed.",
    );
  }

  if (!allowedLeadingKeywords.test(normalizedSql)) {
    throw new SqlGuardError(
      "READ_ONLY_REQUIRED",
      "Only SELECT/WITH/DESCRIBE/EXPLAIN statements are allowed.",
    );
  }

  if (blockedRegex.test(normalizedSql)) {
    throw new SqlGuardError(
      "MUTATING_SQL_BLOCKED",
      "Mutating SQL keywords are not allowed.",
    );
  }

  return normalizedSql;
}

export function clampLimit(limit: number | undefined, defaultLimit = DEFAULT_QUERY_LIMIT): number {
  if (limit == null || Number.isNaN(limit)) {
    return defaultLimit;
  }

  if (limit < 1) {
    return 1;
  }

  if (limit > HARD_QUERY_LIMIT) {
    return HARD_QUERY_LIMIT;
  }

  return limit;
}

export function applyLimitToQuery(sql: string, limit: number): string {
  const normalized = normalizeSql(sql);

  if (/^(DESCRIBE|EXPLAIN)\b/i.test(normalized)) {
    return normalized;
  }

  return `SELECT * FROM (${normalized}) AS bounded_query LIMIT ${limit}`;
}

export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function quoteLiteral(value: string | number | boolean | null): string {
  if (value === null) {
    return "NULL";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new SqlGuardError("INVALID_LITERAL", "Non-finite numeric values are not supported.");
    }

    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  return `'${value.replaceAll("'", "''")}'`;
}

export type FilterValue = string | number | boolean | null;
export type FilterInput = FilterValue | FilterValue[];

export function buildWhereClause(filters: Record<string, FilterInput> | undefined): string {
  if (!filters || Object.keys(filters).length === 0) {
    return "";
  }

  const predicates: string[] = [];

  for (const [columnName, rawValue] of Object.entries(filters)) {
    const columnIdentifier = quoteIdentifier(columnName);

    if (Array.isArray(rawValue)) {
      const nonNullValues = rawValue.filter((value) => value !== null);
      const hasNull = rawValue.length !== nonNullValues.length;

      const inPredicate =
        nonNullValues.length > 0
          ? `${columnIdentifier} IN (${nonNullValues.map((value) => quoteLiteral(value)).join(", ")})`
          : "";

      if (hasNull && inPredicate) {
        predicates.push(`(${inPredicate} OR ${columnIdentifier} IS NULL)`);
      } else if (hasNull) {
        predicates.push(`${columnIdentifier} IS NULL`);
      } else if (inPredicate) {
        predicates.push(inPredicate);
      }

      continue;
    }

    if (rawValue === null) {
      predicates.push(`${columnIdentifier} IS NULL`);
      continue;
    }

    predicates.push(`${columnIdentifier} = ${quoteLiteral(rawValue)}`);
  }

  if (predicates.length === 0) {
    return "";
  }

  return `WHERE ${predicates.join(" AND ")}`;
}

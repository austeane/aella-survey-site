import { describe, expect, it } from "vitest";

import {
  DEFAULT_QUERY_LIMIT,
  HARD_QUERY_LIMIT,
  SqlGuardError,
  clampLimit,
  ensureReadOnlySql,
  normalizeSql,
  quoteIdentifier,
  quoteLiteral,
  buildWhereClause,
} from "./sql-guards";

describe("normalizeSql", () => {
  it("trims whitespace", () => {
    expect(normalizeSql("  SELECT 1  ")).toBe("SELECT 1");
  });

  it("strips trailing semicolons", () => {
    expect(normalizeSql("SELECT 1;")).toBe("SELECT 1");
    expect(normalizeSql("SELECT 1;;;")).toBe("SELECT 1");
  });

  it("preserves internal content", () => {
    expect(normalizeSql("SELECT * FROM data WHERE x = 1")).toBe(
      "SELECT * FROM data WHERE x = 1",
    );
  });
});

describe("ensureReadOnlySql - edge cases", () => {
  it("throws on empty string", () => {
    expect(() => ensureReadOnlySql("")).toThrowError(SqlGuardError);
    expect(() => ensureReadOnlySql("   ")).toThrowError(SqlGuardError);
  });

  it("allows WITH (CTE) queries", () => {
    const sql = "WITH counts AS (SELECT x, COUNT(*) FROM data GROUP BY x) SELECT * FROM counts";
    expect(ensureReadOnlySql(sql)).toBe(sql);
  });

  it("allows DESCRIBE", () => {
    expect(ensureReadOnlySql("DESCRIBE data")).toBe("DESCRIBE data");
  });

  it("allows EXPLAIN", () => {
    expect(ensureReadOnlySql("EXPLAIN SELECT 1")).toBe("EXPLAIN SELECT 1");
  });

  it("blocks DROP TABLE", () => {
    expect(() => ensureReadOnlySql("DROP TABLE data")).toThrowError(SqlGuardError);
  });

  it("blocks INSERT", () => {
    expect(() => ensureReadOnlySql("INSERT INTO data VALUES (1)")).toThrowError(SqlGuardError);
  });

  it("blocks ALTER", () => {
    expect(() => ensureReadOnlySql("ALTER TABLE data ADD col INT")).toThrowError(SqlGuardError);
  });

  it("blocks COPY", () => {
    expect(() => ensureReadOnlySql("COPY data TO '/tmp/out.csv'")).toThrowError(SqlGuardError);
  });

  it("blocks ATTACH", () => {
    expect(() => ensureReadOnlySql("ATTACH '/tmp/db' AS ext")).toThrowError(SqlGuardError);
  });

  it("blocks embedded mutating keywords in complex queries", () => {
    expect(() =>
      ensureReadOnlySql("SELECT * FROM data; DELETE FROM data"),
    ).toThrowError(SqlGuardError);
  });

  it("SqlGuardError has code property", () => {
    try {
      ensureReadOnlySql("");
    } catch (err) {
      expect(err).toBeInstanceOf(SqlGuardError);
      expect((err as SqlGuardError).code).toBe("EMPTY_SQL");
    }
  });

  it("multi-statement error has correct code", () => {
    try {
      ensureReadOnlySql("SELECT 1; SELECT 2");
    } catch (err) {
      expect((err as SqlGuardError).code).toBe("MULTI_STATEMENT_BLOCKED");
    }
  });
});

describe("clampLimit", () => {
  it("returns default when undefined", () => {
    expect(clampLimit(undefined)).toBe(DEFAULT_QUERY_LIMIT);
  });

  it("returns default when NaN", () => {
    expect(clampLimit(NaN)).toBe(DEFAULT_QUERY_LIMIT);
  });

  it("clamps to 1 for zero", () => {
    expect(clampLimit(0)).toBe(1);
  });

  it("clamps to 1 for negative", () => {
    expect(clampLimit(-100)).toBe(1);
  });

  it("clamps to HARD_QUERY_LIMIT for large values", () => {
    expect(clampLimit(999_999)).toBe(HARD_QUERY_LIMIT);
  });

  it("passes through valid values unchanged", () => {
    expect(clampLimit(500)).toBe(500);
    expect(clampLimit(1)).toBe(1);
    expect(clampLimit(HARD_QUERY_LIMIT)).toBe(HARD_QUERY_LIMIT);
  });

  it("accepts custom default limit", () => {
    expect(clampLimit(undefined, 50)).toBe(50);
  });
});

describe("quoteIdentifier", () => {
  it("wraps in double quotes", () => {
    expect(quoteIdentifier("politics")).toBe('"politics"');
  });

  it("escapes embedded double quotes", () => {
    expect(quoteIdentifier('col"name')).toBe('"col""name"');
  });
});

describe("quoteLiteral", () => {
  it("handles null", () => {
    expect(quoteLiteral(null)).toBe("NULL");
  });

  it("handles numbers", () => {
    expect(quoteLiteral(42)).toBe("42");
    expect(quoteLiteral(3.14)).toBe("3.14");
  });

  it("handles booleans", () => {
    expect(quoteLiteral(true)).toBe("TRUE");
    expect(quoteLiteral(false)).toBe("FALSE");
  });

  it("handles strings with escaping", () => {
    expect(quoteLiteral("hello")).toBe("'hello'");
    expect(quoteLiteral("it's")).toBe("'it''s'");
  });

  it("throws on non-finite numbers", () => {
    expect(() => quoteLiteral(Infinity)).toThrowError(SqlGuardError);
    expect(() => quoteLiteral(-Infinity)).toThrowError(SqlGuardError);
    expect(() => quoteLiteral(NaN)).toThrowError(SqlGuardError);
  });
});

describe("buildWhereClause - extended", () => {
  it("returns empty string for undefined", () => {
    expect(buildWhereClause(undefined)).toBe("");
  });

  it("returns empty string for empty object", () => {
    expect(buildWhereClause({})).toBe("");
  });

  it("handles boolean filter values", () => {
    const clause = buildWhereClause({ active: true });
    expect(clause).toBe('WHERE "active" = TRUE');
  });

  it("handles array with null mixed in", () => {
    const clause = buildWhereClause({ status: ["Active", null] });
    expect(clause).toContain("IN ('Active')");
    expect(clause).toContain("IS NULL");
    expect(clause).toContain("OR");
  });

  it("handles array of only nulls", () => {
    const clause = buildWhereClause({ status: [null] });
    expect(clause).toBe('WHERE "status" IS NULL');
  });

  it("combines multiple predicates with AND", () => {
    const clause = buildWhereClause({ a: 1, b: "x" });
    expect(clause).toContain("AND");
  });
});

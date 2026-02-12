import { describe, expect, it } from "vitest";

import {
  applyLimitToQuery,
  buildWhereClause,
  ensureReadOnlySql,
  SqlGuardError,
} from "./sql-guards";

describe("ensureReadOnlySql", () => {
  it("allows read-only select", () => {
    expect(ensureReadOnlySql("SELECT * FROM data")).toBe("SELECT * FROM data");
  });

  it("blocks mutating statements", () => {
    expect(() => ensureReadOnlySql("DELETE FROM data")).toThrowError(SqlGuardError);
  });

  it("blocks multi statements", () => {
    expect(() => ensureReadOnlySql("SELECT 1; SELECT 2")).toThrowError(SqlGuardError);
  });
});

describe("applyLimitToQuery", () => {
  it("wraps select queries with limit", () => {
    const bounded = applyLimitToQuery("SELECT * FROM data", 25);
    expect(bounded).toContain("LIMIT 25");
    expect(bounded).toContain("bounded_query");
  });

  it("does not wrap describe", () => {
    expect(applyLimitToQuery("DESCRIBE data", 10)).toBe("DESCRIBE data");
  });
});

describe("buildWhereClause", () => {
  it("renders scalar and list filters", () => {
    const clause = buildWhereClause({
      politics: ["Liberal", "Moderate"],
      biomale: 1,
    });

    expect(clause).toContain('"politics" IN (\'Liberal\', \'Moderate\')');
    expect(clause).toContain('"biomale" = 1');
  });

  it("handles null filters", () => {
    const clause = buildWhereClause({
      straightness: null,
    });

    expect(clause).toBe('WHERE "straightness" IS NULL');
  });
});

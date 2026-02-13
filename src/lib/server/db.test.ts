import { describe, expect, it } from "vitest";

import { DATA_TABLE_NAME, QueryExecutionError } from "./db";

describe("QueryExecutionError", () => {
  it("has correct name and code", () => {
    const err = new QueryExecutionError("QUERY_TIMEOUT", "Query timed out");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(QueryExecutionError);
    expect(err.name).toBe("QueryExecutionError");
    expect(err.code).toBe("QUERY_TIMEOUT");
    expect(err.message).toBe("Query timed out");
  });

  it("captures different error codes", () => {
    const notFound = new QueryExecutionError("PARQUET_NOT_FOUND", "File missing");
    expect(notFound.code).toBe("PARQUET_NOT_FOUND");

    const failed = new QueryExecutionError("QUERY_EXECUTION_FAILED", "SQL error");
    expect(failed.code).toBe("QUERY_EXECUTION_FAILED");

    const invalid = new QueryExecutionError("INVALID_DUCKDB_OUTPUT", "Bad output");
    expect(invalid.code).toBe("INVALID_DUCKDB_OUTPUT");
  });

  it("is catchable as Error", () => {
    expect(() => {
      throw new QueryExecutionError("TEST", "test error");
    }).toThrow("test error");
  });
});

describe("DATA_TABLE_NAME", () => {
  it("is the expected table name", () => {
    expect(DATA_TABLE_NAME).toBe("data");
  });
});

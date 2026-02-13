import { describe, expect, it } from "vitest";

import { getColumnMetadata, getSchemaMetadata, listColumns, listColumnsWithCaveats } from "./metadata";

describe("getSchemaMetadata", () => {
  it("returns dataset with expected shape", () => {
    const schema = getSchemaMetadata();
    expect(schema.dataset).toBeDefined();
    expect(schema.dataset.name).toBeTruthy();
    expect(schema.dataset.rowCount).toBeGreaterThan(0);
    expect(schema.dataset.columnCount).toBeGreaterThan(0);
  });

  it("returns columns array", () => {
    const schema = getSchemaMetadata();
    expect(Array.isArray(schema.columns)).toBe(true);
    expect(schema.columns.length).toBe(schema.dataset.columnCount);
  });
});

describe("getColumnMetadata", () => {
  it("returns metadata for a known column", () => {
    const columns = listColumns();
    const firstName = columns[0].name;
    const meta = getColumnMetadata(firstName);
    expect(meta).toBeDefined();
    expect(meta!.name).toBe(firstName);
    expect(meta!.duckdbType).toBeTruthy();
    expect(meta!.logicalType).toBeTruthy();
  });

  it("returns undefined for unknown column", () => {
    expect(getColumnMetadata("nonexistent_column_xyz_999")).toBeUndefined();
  });
});

describe("listColumns", () => {
  it("returns all columns", () => {
    const columns = listColumns();
    expect(columns.length).toBeGreaterThan(0);
  });

  it("each column has required fields", () => {
    const columns = listColumns();
    for (const col of columns.slice(0, 5)) {
      expect(col.name).toBeTruthy();
      expect(typeof col.duckdbType).toBe("string");
      expect(typeof col.logicalType).toBe("string");
      expect(typeof col.nullRatio).toBe("number");
      expect(typeof col.approxCardinality).toBe("number");
      expect(Array.isArray(col.tags)).toBe(true);
    }
  });
});

describe("listColumnsWithCaveats", () => {
  it("augments columns with caveatKeys", () => {
    const columns = listColumnsWithCaveats();
    expect(columns.length).toBeGreaterThan(0);

    for (const col of columns.slice(0, 5)) {
      expect(Array.isArray(col.caveatKeys)).toBe(true);
      // Every column should have at least global caveats
      expect(col.caveatKeys.length).toBeGreaterThan(0);
    }
  });

  it("known columns get specific caveats", () => {
    const columns = listColumnsWithCaveats();
    const politics = columns.find((c) => c.name === "politics");
    if (politics) {
      expect(politics.caveatKeys).toContain("binned_or_collapsed");
      expect(politics.caveatKeys).toContain("gated_missingness");
    }
  });
});

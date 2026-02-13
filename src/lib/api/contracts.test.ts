import { describe, expect, it } from "vitest";

import {
  ApiErrorEnvelopeSchema,
  ApiSuccessEnvelopeSchema,
  CategoricalStatsSchema,
  CategoryCountSchema,
  CategoryTagSchema,
  CaveatKeySchema,
  CaveatSchema,
  ColumnMetadataSchema,
  CrosstabDataSchema,
  CrosstabRequestSchema,
  CrosstabRowSchema,
  DatasetMetadataSchema,
  FilterValueSchema,
  FiltersSchema,
  LogicalTypeSchema,
  NumericStatsSchema,
  QueryDataSchema,
  QueryRequestSchema,
  SchemaDataSchema,
  StatsDataSchema,
} from "./contracts";

describe("LogicalTypeSchema", () => {
  it("accepts valid logical types", () => {
    for (const t of ["categorical", "numeric", "boolean", "text", "unknown"]) {
      expect(LogicalTypeSchema.parse(t)).toBe(t);
    }
  });

  it("rejects invalid type", () => {
    expect(() => LogicalTypeSchema.parse("array")).toThrow();
  });
});

describe("CategoryTagSchema", () => {
  it("accepts valid tags", () => {
    for (const t of ["demographic", "ocean", "fetish", "derived", "other"]) {
      expect(CategoryTagSchema.parse(t)).toBe(t);
    }
  });

  it("rejects unknown tag", () => {
    expect(() => CategoryTagSchema.parse("random")).toThrow();
  });
});

describe("CaveatKeySchema", () => {
  it("accepts all defined caveat keys", () => {
    const keys = [
      "binned_or_collapsed",
      "combined_or_merged",
      "computed_column",
      "gated_missingness",
      "late_added_questions",
    ];
    for (const k of keys) {
      expect(CaveatKeySchema.parse(k)).toBe(k);
    }
  });

  it("rejects unknown caveat key", () => {
    expect(() => CaveatKeySchema.parse("nonexistent")).toThrow();
  });
});

describe("CaveatSchema", () => {
  it("accepts valid caveat", () => {
    const result = CaveatSchema.parse({
      key: "binned_or_collapsed",
      title: "Binned or Collapsed",
      description: "Some description",
      guidance: "Some guidance",
    });
    expect(result.key).toBe("binned_or_collapsed");
  });

  it("rejects missing fields", () => {
    expect(() => CaveatSchema.parse({ key: "binned_or_collapsed" })).toThrow();
  });
});

describe("ColumnMetadataSchema", () => {
  const validColumn = {
    name: "politics",
    duckdbType: "VARCHAR",
    logicalType: "categorical",
    nullRatio: 0.05,
    approxCardinality: 8,
    tags: ["demographic"],
  };

  it("accepts valid column metadata", () => {
    const result = ColumnMetadataSchema.parse(validColumn);
    expect(result.name).toBe("politics");
    expect(result.caveatKeys).toEqual([]);
  });

  it("defaults caveatKeys to empty array", () => {
    const result = ColumnMetadataSchema.parse(validColumn);
    expect(result.caveatKeys).toEqual([]);
  });

  it("accepts explicit caveatKeys", () => {
    const result = ColumnMetadataSchema.parse({
      ...validColumn,
      caveatKeys: ["binned_or_collapsed"],
    });
    expect(result.caveatKeys).toEqual(["binned_or_collapsed"]);
  });

  it("rejects nullRatio out of range", () => {
    expect(() =>
      ColumnMetadataSchema.parse({ ...validColumn, nullRatio: 1.5 }),
    ).toThrow();
    expect(() =>
      ColumnMetadataSchema.parse({ ...validColumn, nullRatio: -0.1 }),
    ).toThrow();
  });

  it("rejects negative cardinality", () => {
    expect(() =>
      ColumnMetadataSchema.parse({ ...validColumn, approxCardinality: -1 }),
    ).toThrow();
  });
});

describe("DatasetMetadataSchema", () => {
  it("accepts valid dataset metadata", () => {
    const result = DatasetMetadataSchema.parse({
      name: "Big Kink Survey",
      sourcePath: "/data/BKSPublic.parquet",
      generatedAt: "2026-01-01T00:00:00Z",
      rowCount: 15503,
      columnCount: 365,
    });
    expect(result.rowCount).toBe(15503);
  });

  it("rejects negative row count", () => {
    expect(() =>
      DatasetMetadataSchema.parse({
        name: "test",
        sourcePath: "/test",
        generatedAt: "2026-01-01",
        rowCount: -1,
        columnCount: 0,
      }),
    ).toThrow();
  });
});

describe("QueryRequestSchema", () => {
  it("accepts valid query", () => {
    const result = QueryRequestSchema.parse({ sql: "SELECT * FROM data" });
    expect(result.sql).toBe("SELECT * FROM data");
    expect(result.limit).toBeUndefined();
  });

  it("accepts query with limit", () => {
    const result = QueryRequestSchema.parse({ sql: "SELECT 1", limit: 500 });
    expect(result.limit).toBe(500);
  });

  it("trims whitespace from sql", () => {
    const result = QueryRequestSchema.parse({ sql: "  SELECT 1  " });
    expect(result.sql).toBe("SELECT 1");
  });

  it("rejects empty sql", () => {
    expect(() => QueryRequestSchema.parse({ sql: "" })).toThrow();
    expect(() => QueryRequestSchema.parse({ sql: "   " })).toThrow();
  });

  it("rejects limit exceeding 10000", () => {
    expect(() =>
      QueryRequestSchema.parse({ sql: "SELECT 1", limit: 10_001 }),
    ).toThrow();
  });

  it("rejects zero or negative limit", () => {
    expect(() =>
      QueryRequestSchema.parse({ sql: "SELECT 1", limit: 0 }),
    ).toThrow();
    expect(() =>
      QueryRequestSchema.parse({ sql: "SELECT 1", limit: -5 }),
    ).toThrow();
  });
});

describe("QueryDataSchema", () => {
  it("accepts valid query data", () => {
    const result = QueryDataSchema.parse({
      columns: ["a", "b"],
      rows: [[1, "x"], [2, "y"]],
    });
    expect(result.columns).toHaveLength(2);
    expect(result.rows).toHaveLength(2);
  });

  it("accepts empty results", () => {
    const result = QueryDataSchema.parse({ columns: [], rows: [] });
    expect(result.columns).toEqual([]);
  });
});

describe("FilterValueSchema / FiltersSchema", () => {
  it("accepts scalar filter values", () => {
    expect(FilterValueSchema.parse("Liberal")).toBe("Liberal");
    expect(FilterValueSchema.parse(42)).toBe(42);
    expect(FilterValueSchema.parse(true)).toBe(true);
    expect(FilterValueSchema.parse(null)).toBeNull();
  });

  it("accepts filter record with scalar and array values", () => {
    const result = FiltersSchema.parse({
      politics: ["Liberal", "Moderate"],
      biomale: 1,
      straightness: null,
    });
    expect(result.politics).toEqual(["Liberal", "Moderate"]);
    expect(result.biomale).toBe(1);
  });
});

describe("CrosstabRequestSchema", () => {
  it("accepts valid crosstab request", () => {
    const result = CrosstabRequestSchema.parse({ x: "politics", y: "bmi" });
    expect(result.x).toBe("politics");
    expect(result.limit).toBeUndefined();
    expect(result.filters).toBeUndefined();
  });

  it("accepts with optional fields", () => {
    const result = CrosstabRequestSchema.parse({
      x: "politics",
      y: "bmi",
      limit: 100,
      filters: { biomale: 1 },
    });
    expect(result.limit).toBe(100);
  });

  it("rejects empty x or y", () => {
    expect(() => CrosstabRequestSchema.parse({ x: "", y: "bmi" })).toThrow();
    expect(() => CrosstabRequestSchema.parse({ x: "politics", y: "" })).toThrow();
  });

  it("rejects limit over 1000", () => {
    expect(() =>
      CrosstabRequestSchema.parse({ x: "a", y: "b", limit: 1001 }),
    ).toThrow();
  });
});

describe("CrosstabRowSchema / CrosstabDataSchema", () => {
  it("accepts valid crosstab data", () => {
    const result = CrosstabDataSchema.parse({
      x: "politics",
      y: "bmi",
      rows: [
        { x: "Liberal", y: "Normal", count: 100 },
        { x: null, y: "Overweight", count: 50 },
      ],
    });
    expect(result.rows).toHaveLength(2);
  });

  it("rejects negative count", () => {
    expect(() => CrosstabRowSchema.parse({ x: "a", y: "b", count: -1 })).toThrow();
  });
});

describe("NumericStatsSchema", () => {
  it("accepts valid numeric stats", () => {
    const result = NumericStatsSchema.parse({
      kind: "numeric",
      totalCount: 15503,
      nonNullCount: 15000,
      nullCount: 503,
      mean: 3.5,
      stddev: 1.2,
      min: 0,
      p25: 2,
      median: 3.5,
      p75: 5,
      max: 7,
    });
    expect(result.kind).toBe("numeric");
  });

  it("accepts nullable stats fields", () => {
    const result = NumericStatsSchema.parse({
      kind: "numeric",
      totalCount: 0,
      nonNullCount: 0,
      nullCount: 0,
      mean: null,
      stddev: null,
      min: null,
      p25: null,
      median: null,
      p75: null,
      max: null,
    });
    expect(result.mean).toBeNull();
  });
});

describe("CategoricalStatsSchema", () => {
  it("accepts valid categorical stats", () => {
    const result = CategoricalStatsSchema.parse({
      kind: "categorical",
      totalCount: 100,
      nonNullCount: 95,
      nullCount: 5,
      topValues: [
        { value: "Liberal", count: 40, percentage: 42.1 },
        { value: "Moderate", count: 30, percentage: 31.6 },
      ],
    });
    expect(result.topValues).toHaveLength(2);
  });

  it("rejects percentage out of range", () => {
    expect(() =>
      CategoryCountSchema.parse({ value: "x", count: 1, percentage: 101 }),
    ).toThrow();
    expect(() =>
      CategoryCountSchema.parse({ value: "x", count: 1, percentage: -1 }),
    ).toThrow();
  });
});

describe("StatsDataSchema", () => {
  it("accepts numeric stats variant", () => {
    const result = StatsDataSchema.parse({
      column: "bmi",
      logicalType: "numeric",
      caveatKeys: ["binned_or_collapsed"],
      stats: {
        kind: "numeric",
        totalCount: 100,
        nonNullCount: 90,
        nullCount: 10,
        mean: 25.0,
        stddev: 4.0,
        min: 15,
        p25: 22,
        median: 25,
        p75: 28,
        max: 50,
      },
    });
    expect(result.stats.kind).toBe("numeric");
  });

  it("accepts categorical stats variant", () => {
    const result = StatsDataSchema.parse({
      column: "politics",
      logicalType: "categorical",
      caveatKeys: [],
      stats: {
        kind: "categorical",
        totalCount: 100,
        nonNullCount: 100,
        nullCount: 0,
        topValues: [],
      },
    });
    expect(result.stats.kind).toBe("categorical");
  });
});

describe("ApiSuccessEnvelopeSchema / ApiErrorEnvelopeSchema", () => {
  it("accepts success envelope", () => {
    const schema = ApiSuccessEnvelopeSchema(QueryDataSchema);
    const result = schema.parse({
      ok: true,
      data: { columns: ["a"], rows: [[1]] },
    });
    expect(result.ok).toBe(true);
    expect(result.data.columns).toEqual(["a"]);
  });

  it("accepts success envelope with meta", () => {
    const schema = ApiSuccessEnvelopeSchema(QueryDataSchema);
    const result = schema.parse({
      ok: true,
      data: { columns: [], rows: [] },
      meta: { took: 42 },
    });
    expect(result.meta?.took).toBe(42);
  });

  it("accepts error envelope", () => {
    const result = ApiErrorEnvelopeSchema.parse({
      ok: false,
      error: { code: "BAD_REQUEST", message: "Invalid input" },
    });
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("BAD_REQUEST");
  });

  it("rejects success with ok:false", () => {
    const schema = ApiSuccessEnvelopeSchema(QueryDataSchema);
    expect(() =>
      schema.parse({
        ok: false,
        data: { columns: [], rows: [] },
      }),
    ).toThrow();
  });
});

describe("SchemaDataSchema", () => {
  it("accepts valid full schema data", () => {
    const result = SchemaDataSchema.parse({
      dataset: {
        name: "test",
        sourcePath: "/test.parquet",
        generatedAt: "2026-01-01",
        rowCount: 100,
        columnCount: 5,
      },
      columns: [
        {
          name: "col1",
          duckdbType: "VARCHAR",
          logicalType: "categorical",
          nullRatio: 0,
          approxCardinality: 3,
          tags: ["demographic"],
        },
      ],
      caveats: {
        global: ["gated_missingness"],
        definitions: [
          {
            key: "gated_missingness",
            title: "Gated Missingness",
            description: "desc",
            guidance: "guidance",
          },
        ],
      },
    });
    expect(result.columns).toHaveLength(1);
    expect(result.caveats.global).toContain("gated_missingness");
  });
});

import { z } from "zod";

export const LogicalTypeSchema = z.enum([
  "categorical",
  "numeric",
  "boolean",
  "text",
  "unknown",
]);

export const CategoryTagSchema = z.enum([
  "demographic",
  "ocean",
  "fetish",
  "derived",
  "other",
]);

export const CaveatKeySchema = z.enum([
  "binned_or_collapsed",
  "combined_or_merged",
  "computed_column",
  "negated_scale",
  "opaque_composite",
  "gated_missingness",
  "late_added_questions",
]);

export const NullMeaningSchema = z.enum([
  "GATED",
  "LATE_ADDED",
  "NOT_APPLICABLE",
  "UNKNOWN",
]);

export const CaveatSchema = z.object({
  key: CaveatKeySchema,
  title: z.string(),
  description: z.string(),
  guidance: z.string(),
});

export const ColumnMetadataSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  duckdbType: z.string(),
  logicalType: LogicalTypeSchema,
  nullRatio: z.number().min(0).max(1),
  approxCardinality: z.number().int().nonnegative(),
  approxTopValues: z.array(z.string()).optional(),
  tags: z.array(CategoryTagSchema),
  valueLabels: z.record(z.string(), z.string()).optional(),
  nullMeaning: NullMeaningSchema.default("UNKNOWN"),
  caveatKeys: z.array(CaveatKeySchema).default([]),
});

export const DatasetMetadataSchema = z.object({
  name: z.string(),
  sourcePath: z.string(),
  generatedAt: z.string(),
  rowCount: z.number().int().nonnegative(),
  columnCount: z.number().int().nonnegative(),
});

export const SchemaDataSchema = z.object({
  dataset: DatasetMetadataSchema,
  columns: z.array(ColumnMetadataSchema),
  caveats: z.object({
    global: z.array(CaveatKeySchema),
    definitions: z.array(CaveatSchema),
  }),
});

export const QueryRequestSchema = z.object({
  sql: z.string().trim().min(1),
  limit: z.number().int().positive().max(10_000).optional(),
});

export const AnalyticsQueryRequestSchema = z.object({
  sql: z.string().trim().min(1),
  limit: z.number().int().positive().max(10_000).optional(),
});

export const QueryDataSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.unknown())),
});

export const AnalyticsEventTypeSchema = z.enum([
  "page_view",
  "interaction",
  "query",
  "error",
  "slow_experience",
]);

const BaseAnalyticsEventSchema = z.object({
  event: AnalyticsEventTypeSchema,
  page: z.string().trim().min(1).max(500),
  action: z.string().trim().min(1).max(120).optional(),
  label: z.string().trim().min(1).max(200).optional(),
  value: z.number().finite().optional(),
  error_code: z.string().trim().min(1).max(120).optional(),
  session_id: z.string().trim().min(1).max(120),
  ts: z.string().datetime(),
});

export const AnalyticsEventInputSchema = BaseAnalyticsEventSchema.strip();

export const AnalyticsEventBatchRequestSchema = z
  .object({
    events: z.array(AnalyticsEventInputSchema).min(1).max(20),
  })
  .strip();

export const AnalyticsEventV1Schema = BaseAnalyticsEventSchema.extend({
  v: z.literal(1),
  received_at: z.string().datetime(),
  user_agent: z.string().trim().max(512).optional(),
}).strip();

export const FilterValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const FiltersSchema = z.record(
  z.string(),
  z.union([FilterValueSchema, z.array(FilterValueSchema)]),
);

export const CrosstabRequestSchema = z.object({
  x: z.string().min(1),
  y: z.string().min(1),
  limit: z.number().int().positive().max(1_000).optional(),
  filters: FiltersSchema.optional(),
});

export const CrosstabRowSchema = z.object({
  x: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  y: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  count: z.number().int().nonnegative(),
});

export const CrosstabDataSchema = z.object({
  x: z.string(),
  y: z.string(),
  rows: z.array(CrosstabRowSchema),
});

export const NumericStatsSchema = z.object({
  kind: z.literal("numeric"),
  totalCount: z.number().int().nonnegative(),
  nonNullCount: z.number().int().nonnegative(),
  nullCount: z.number().int().nonnegative(),
  mean: z.number().nullable(),
  stddev: z.number().nullable(),
  min: z.number().nullable(),
  p25: z.number().nullable(),
  median: z.number().nullable(),
  p75: z.number().nullable(),
  max: z.number().nullable(),
});

export const CategoryCountSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export const CategoricalStatsSchema = z.object({
  kind: z.literal("categorical"),
  totalCount: z.number().int().nonnegative(),
  nonNullCount: z.number().int().nonnegative(),
  nullCount: z.number().int().nonnegative(),
  topValues: z.array(CategoryCountSchema),
});

export const StatsDataSchema = z.object({
  column: z.string(),
  logicalType: LogicalTypeSchema,
  caveatKeys: z.array(CaveatKeySchema),
  stats: z.union([NumericStatsSchema, CategoricalStatsSchema]),
});

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const ApiSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: dataSchema,
    meta: z.record(z.string(), z.unknown()).optional(),
  });

export const ApiErrorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: ApiErrorSchema,
});

export type QueryRequest = z.infer<typeof QueryRequestSchema>;
export type AnalyticsQueryRequest = z.infer<typeof AnalyticsQueryRequestSchema>;
export type AnalyticsEventInput = z.infer<typeof AnalyticsEventInputSchema>;
export type AnalyticsEventBatchRequest = z.infer<typeof AnalyticsEventBatchRequestSchema>;
export type AnalyticsEventV1 = z.infer<typeof AnalyticsEventV1Schema>;
export type CrosstabRequest = z.infer<typeof CrosstabRequestSchema>;
export type SchemaData = z.infer<typeof SchemaDataSchema>;
export type QueryData = z.infer<typeof QueryDataSchema>;
export type CrosstabData = z.infer<typeof CrosstabDataSchema>;
export type StatsData = z.infer<typeof StatsDataSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

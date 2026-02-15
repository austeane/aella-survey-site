import { quoteIdentifier, quoteLiteral } from "./sql-helpers";

export const PROFILE_METRICS = [
  "totalfetishcategory",
  "powerlessnessvariable",
  "opennessvariable",
  "extroversionvariable",
  "neuroticismvariable",
  "agreeablenessvariable",
  "consciensiousnessvariable",
] as const;

export type ProfileMetric = (typeof PROFILE_METRICS)[number];

export interface FilterPair {
  column: string;
  value: string;
}

export function buildCondition(filters: FilterPair[]): string {
  if (filters.length === 0) {
    return "TRUE";
  }

  return filters
    .map((pair) => `${quoteIdentifier(pair.column)} = ${quoteLiteral(pair.value)}`)
    .join(" AND ");
}

export function buildProfileSizeQuery(condition: string): string {
  return `
    SELECT
      count(*)::BIGINT AS total_size,
      count(*) FILTER (WHERE ${condition})::BIGINT AS cohort_size
    FROM data
  `;
}

export function buildPercentileCardsQuery(condition: string, metrics: string[]): string {
  if (metrics.length === 0) {
    return "SELECT '' AS metric WHERE FALSE";
  }

  return metrics
    .map((metric) => {
      const quoted = quoteIdentifier(metric);
      return `(
        WITH cohort AS (
          SELECT
            quantile_cont(${quoted}, 0.5)::DOUBLE AS cohort_median,
            avg(cast(${quoted} AS DOUBLE))::DOUBLE AS cohort_mean,
            stddev_samp(cast(${quoted} AS DOUBLE))::DOUBLE AS cohort_sd,
            count(*)::BIGINT AS cohort_n
          FROM data
          WHERE ${condition} AND ${quoted} IS NOT NULL
        ),
        global_stats AS (
          SELECT
            quantile_cont(${quoted}, 0.5)::DOUBLE AS global_median,
            stddev_samp(cast(${quoted} AS DOUBLE))::DOUBLE AS global_sd
          FROM data
          WHERE ${quoted} IS NOT NULL
        )
        SELECT
          ${quoteLiteral(metric)} AS metric,
          (SELECT cohort_median FROM cohort) AS cohort_median,
          (SELECT cohort_mean FROM cohort) AS cohort_mean,
          (SELECT cohort_sd FROM cohort) AS cohort_sd,
          (SELECT cohort_n FROM cohort) AS cohort_n,
          (SELECT global_median FROM global_stats) AS global_median,
          (SELECT global_sd FROM global_stats) AS global_sd,
          CASE
            WHEN (SELECT cohort_median FROM cohort) IS NULL THEN NULL
            ELSE (
              SELECT
                100.0 *
                SUM(CASE WHEN ${quoted} <= (SELECT cohort_median FROM cohort) THEN 1 ELSE 0 END)::DOUBLE /
                NULLIF(COUNT(*)::DOUBLE, 0)
              FROM data
              WHERE ${quoted} IS NOT NULL
            )
          END AS global_percentile
      )`;
    })
    .join(" UNION ALL ");
}

export function buildOverIndexingQuery(
  condition: string,
  candidateColumns: string[],
  options?: {
    topLimit?: number;
    underLimit?: number;
    minCount?: number;
  },
): string {
  if (candidateColumns.length === 0) {
    return "SELECT '' AS column_name WHERE FALSE";
  }

  const topLimit = Math.max(1, options?.topLimit ?? 12);
  const underLimit = Math.max(1, options?.underLimit ?? 5);
  const minCount = Math.max(1, options?.minCount ?? 30);

  const countsUnion = candidateColumns
    .map((columnName) => {
      const quoted = quoteIdentifier(columnName);
      return `
        SELECT
          ${quoteLiteral(columnName)} AS column_name,
          cast(${quoted} AS VARCHAR) AS value,
          SUM(CASE WHEN ${condition} THEN 1 ELSE 0 END)::DOUBLE AS cohort_count,
          COUNT(*)::DOUBLE AS global_count
        FROM data
        WHERE ${quoted} IS NOT NULL
        GROUP BY 1, 2
      `;
    })
    .join(" UNION ALL ");

  return `
    WITH counts AS (
      ${countsUnion}
    ),
    sizes AS (
      SELECT
        count(*) FILTER (WHERE ${condition})::DOUBLE AS cohort_size,
        count(*)::DOUBLE AS global_size
      FROM data
    ),
    scored AS (
      SELECT
        counts.column_name,
        counts.value,
        counts.cohort_count,
        counts.global_count,
        CASE WHEN sizes.cohort_size = 0 THEN 0 ELSE counts.cohort_count / sizes.cohort_size END AS cohort_pct,
        CASE WHEN sizes.global_size = 0 THEN 0 ELSE counts.global_count / sizes.global_size END AS global_pct
      FROM counts
      CROSS JOIN sizes
    ),
    filtered AS (
      SELECT
        column_name,
        value,
        cohort_count,
        global_count,
        cohort_pct,
        global_pct,
        CASE WHEN global_pct <= 0 THEN NULL ELSE cohort_pct / global_pct END AS ratio
      FROM scored
      WHERE cohort_count >= ${minCount}
        AND global_count >= ${minCount}
    ),
    top_over AS (
      SELECT
        column_name,
        value,
        cohort_count,
        global_count,
        cohort_pct,
        global_pct,
        ratio,
        'over' AS direction
      FROM filtered
      WHERE ratio IS NOT NULL AND ratio >= 1
      ORDER BY ratio DESC, cohort_count DESC
      LIMIT ${topLimit}
    ),
    top_under AS (
      SELECT
        column_name,
        value,
        cohort_count,
        global_count,
        cohort_pct,
        global_pct,
        ratio,
        'under' AS direction
      FROM filtered
      WHERE ratio IS NOT NULL AND ratio < 1
      ORDER BY ratio ASC, cohort_count DESC
      LIMIT ${underLimit}
    )
    SELECT * FROM top_over
    UNION ALL
    SELECT * FROM top_under
  `;
}

export function buildDistributionHistogramQuery(
  condition: string,
  metric: string,
  bins = 40,
): string {
  const safeBins = Math.max(10, Math.min(80, Math.trunc(bins)));
  const quoted = quoteIdentifier(metric);

  return `
    WITH bounds AS (
      SELECT
        min(cast(${quoted} AS DOUBLE)) AS min_val,
        max(cast(${quoted} AS DOUBLE)) AS max_val
      FROM data
      WHERE ${quoted} IS NOT NULL
    ),
    series AS (
      SELECT range AS bin
      FROM range(1, ${safeBins + 1}) AS t(range)
    ),
    binned AS (
      SELECT
        CASE
          WHEN bounds.max_val IS NULL OR bounds.min_val IS NULL THEN 1
          WHEN bounds.max_val <= bounds.min_val THEN 1
          ELSE LEAST(
            ${safeBins},
            GREATEST(
              1,
              CAST(FLOOR((cast(${quoted} AS DOUBLE) - bounds.min_val) / NULLIF(bounds.max_val - bounds.min_val, 0) * ${safeBins}) + 1 AS INTEGER)
            )
          )
        END AS bin,
        COUNT(*)::DOUBLE AS global_count,
        COUNT(*) FILTER (WHERE ${condition})::DOUBLE AS cohort_count
      FROM data
      CROSS JOIN bounds
      WHERE ${quoted} IS NOT NULL
      GROUP BY 1
    )
    SELECT
      series.bin,
      COALESCE(binned.global_count, 0)::DOUBLE AS global_count,
      COALESCE(binned.cohort_count, 0)::DOUBLE AS cohort_count,
      (SELECT min_val FROM bounds) AS min_val,
      (SELECT max_val FROM bounds) AS max_val
    FROM series
    LEFT JOIN binned USING (bin)
    ORDER BY series.bin
  `;
}

export function buildDirectComparisonQuery(
  conditionA: string,
  conditionB: string,
  candidateColumns: string[],
  limit = 20,
): string {
  if (candidateColumns.length === 0) {
    return "SELECT '' AS column_name WHERE FALSE";
  }

  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));

  const countsUnion = candidateColumns
    .map((columnName) => {
      const quoted = quoteIdentifier(columnName);
      return `
        SELECT
          ${quoteLiteral(columnName)} AS column_name,
          cast(${quoted} AS VARCHAR) AS value,
          SUM(CASE WHEN ${conditionA} THEN 1 ELSE 0 END)::DOUBLE AS count_a,
          SUM(CASE WHEN ${conditionB} THEN 1 ELSE 0 END)::DOUBLE AS count_b
        FROM data
        WHERE ${quoted} IS NOT NULL
        GROUP BY 1, 2
      `;
    })
    .join(" UNION ALL ");

  return `
    WITH counts AS (
      ${countsUnion}
    ),
    sizes AS (
      SELECT
        count(*) FILTER (WHERE ${conditionA})::DOUBLE AS size_a,
        count(*) FILTER (WHERE ${conditionB})::DOUBLE AS size_b
      FROM data
    ),
    scored AS (
      SELECT
        counts.column_name,
        counts.value,
        counts.count_a,
        counts.count_b,
        CASE WHEN sizes.size_a = 0 THEN 0 ELSE counts.count_a / sizes.size_a END AS pct_a,
        CASE WHEN sizes.size_b = 0 THEN 0 ELSE counts.count_b / sizes.size_b END AS pct_b
      FROM counts
      CROSS JOIN sizes
      WHERE counts.count_a >= 20
        AND counts.count_b >= 20
    )
    SELECT
      column_name,
      value,
      count_a,
      count_b,
      pct_a,
      pct_b,
      abs((pct_a - pct_b) * 100.0) AS abs_delta
    FROM scored
    ORDER BY abs_delta DESC, (count_a + count_b) DESC
    LIMIT ${safeLimit}
  `;
}

export function buildMetricComparisonQuery(
  conditionA: string,
  conditionB: string,
  metrics: string[],
): string {
  if (metrics.length === 0) {
    return "SELECT '' AS metric WHERE FALSE";
  }

  return metrics
    .map((metric) => {
      const quoted = quoteIdentifier(metric);
      return `
        SELECT
          ${quoteLiteral(metric)} AS metric,
          quantile_cont(${quoted}, 0.5) FILTER (WHERE ${conditionA} AND ${quoted} IS NOT NULL)::DOUBLE AS median_a,
          quantile_cont(${quoted}, 0.5) FILTER (WHERE ${conditionB} AND ${quoted} IS NOT NULL)::DOUBLE AS median_b,
          avg(cast(${quoted} AS DOUBLE)) FILTER (WHERE ${conditionA} AND ${quoted} IS NOT NULL)::DOUBLE AS mean_a,
          avg(cast(${quoted} AS DOUBLE)) FILTER (WHERE ${conditionB} AND ${quoted} IS NOT NULL)::DOUBLE AS mean_b,
          stddev_samp(cast(${quoted} AS DOUBLE)) FILTER (WHERE ${conditionA} AND ${quoted} IS NOT NULL)::DOUBLE AS sd_a,
          stddev_samp(cast(${quoted} AS DOUBLE)) FILTER (WHERE ${conditionB} AND ${quoted} IS NOT NULL)::DOUBLE AS sd_b,
          count(*) FILTER (WHERE ${conditionA} AND ${quoted} IS NOT NULL)::BIGINT AS n_a,
          count(*) FILTER (WHERE ${conditionB} AND ${quoted} IS NOT NULL)::BIGINT AS n_b
        FROM data
      `;
    })
    .join(" UNION ALL ");
}

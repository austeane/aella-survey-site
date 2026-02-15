import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CohortFingerprint, type FingerprintAxisPoint } from "@/components/charts/cohort-fingerprint";
import { DistributionStrip, type DistributionBin } from "@/components/charts/distribution-strip";
import { DumbbellChart, type DumbbellRow } from "@/components/charts/dumbbell-chart";
import { OverIndexChart, type OverIndexChartRow } from "@/components/charts/over-index-chart";
import { PercentileChart, type PercentileChartDatum } from "@/components/charts/percentile-chart";
import { ColumnCombobox } from "@/components/column-combobox";
import { ColumnNameTooltip } from "@/components/column-name-tooltip";
import { DataTable } from "@/components/data-table";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SchemaData } from "@/lib/api/contracts";
import { DEFAULTS_BY_PAGE } from "@/lib/chart-presets";
import { getSchema } from "@/lib/client/api";
import {
  PROFILE_METRICS,
  buildCondition,
  buildDirectComparisonQuery,
  buildDistributionHistogramQuery,
  buildMetricComparisonQuery,
  buildOverIndexingQuery,
  buildPercentileCardsQuery,
  buildProfileSizeQuery,
  type FilterPair as QueryFilterPair,
} from "@/lib/duckdb/profile-queries";
import { useDuckDB } from "@/lib/duckdb/provider";
import { quoteIdentifier } from "@/lib/duckdb/sql-helpers";
import { asNumber, formatNumber, formatPercent } from "@/lib/format";
import { formatValueWithLabel, getColumnDisplayName } from "@/lib/format-labels";
import { addNotebookEntry } from "@/lib/notebook-store";
import { getConfidenceStyle, reliabilityScore } from "@/lib/statistics/confidence";
import { contextualizeDifference } from "@/lib/statistics/effect-context";

export const Route = createFileRoute("/profile")({
  validateSearch: (
    search,
  ): {
    mode?: Mode;
    c0?: string;
    c1?: string;
    c2?: string;
    v0?: string;
    v1?: string;
    v2?: string;
    ac0?: string;
    ac1?: string;
    ac2?: string;
    av0?: string;
    av1?: string;
    av2?: string;
    bc0?: string;
    bc1?: string;
    bc2?: string;
    bv0?: string;
    bv1?: string;
    bv2?: string;
  } => ({
    mode: search.mode === "compare" ? "compare" : search.mode === "single" ? "single" : undefined,
    c0: typeof search.c0 === "string" ? search.c0 : undefined,
    c1: typeof search.c1 === "string" ? search.c1 : undefined,
    c2: typeof search.c2 === "string" ? search.c2 : undefined,
    v0: typeof search.v0 === "string" ? search.v0 : undefined,
    v1: typeof search.v1 === "string" ? search.v1 : undefined,
    v2: typeof search.v2 === "string" ? search.v2 : undefined,
    ac0: typeof search.ac0 === "string" ? search.ac0 : undefined,
    ac1: typeof search.ac1 === "string" ? search.ac1 : undefined,
    ac2: typeof search.ac2 === "string" ? search.ac2 : undefined,
    av0: typeof search.av0 === "string" ? search.av0 : undefined,
    av1: typeof search.av1 === "string" ? search.av1 : undefined,
    av2: typeof search.av2 === "string" ? search.av2 : undefined,
    bc0: typeof search.bc0 === "string" ? search.bc0 : undefined,
    bc1: typeof search.bc1 === "string" ? search.bc1 : undefined,
    bc2: typeof search.bc2 === "string" ? search.bc2 : undefined,
    bv0: typeof search.bv0 === "string" ? search.bv0 : undefined,
    bv1: typeof search.bv1 === "string" ? search.bv1 : undefined,
    bv2: typeof search.bv2 === "string" ? search.bv2 : undefined,
  }),
  component: ProfilePage,
});

type Mode = "single" | "compare";

type RunStage = "idle" | "identity" | "percentile" | "overindex" | "distribution" | "done";

interface PercentileCard {
  metric: string;
  label: string;
  cohortMedian: number | null;
  cohortMean: number | null;
  cohortSD: number | null;
  cohortN: number;
  globalMedian: number | null;
  globalSD: number | null;
  globalPercentile: number | null;
  ciLower: number | null;
  ciUpper: number | null;
}

interface OverIndexingItem extends OverIndexChartRow {
  direction: "over" | "under";
  href: {
    x: string;
    y?: string;
  };
}

interface DistributionSummary {
  metric: string;
  label: string;
  bins: DistributionBin[];
  min: number;
  max: number;
  cohortMedian: number | null;
  cohortSD: number | null;
  cohortN: number;
  globalMedian: number | null;
}

interface SurpriseFinding {
  id: string;
  sentence: string;
  score: number;
  href: {
    to: "/relationships" | "/explore/crosstab";
    search: Record<string, string | undefined>;
  };
}

interface ProfileSummary {
  totalSize: number;
  cohortSize: number;
  cohortSharePercent: number;
  cohortRarity: number;
  filterSummary: string;
  percentileCards: PercentileCard[];
  overIndexing: OverIndexingItem[];
  topOverIndexing: OverIndexingItem[];
  underIndexing: OverIndexingItem[];
  distributions: DistributionSummary[];
  surpriseFindings: SurpriseFinding[];
}

interface DirectDifferenceRow extends DumbbellRow {
  columnName: string;
  value: string;
  pctA: number;
  pctB: number;
  countA: number;
  countB: number;
  absDelta: number;
  isGated: boolean;
  href: {
    x: string;
    y?: string;
  };
}

interface SharedTraitRow {
  key: string;
  label: string;
  ratioA: number;
  ratioB: number;
  href: {
    x: string;
    y?: string;
  };
}

interface MetricCompareRow {
  metric: string;
  label: string;
  medianA: number | null;
  medianB: number | null;
  meanA: number | null;
  meanB: number | null;
  sdA: number | null;
  sdB: number | null;
  nA: number;
  nB: number;
}

interface ComparisonResult {
  a: ProfileSummary;
  b: ProfileSummary;
  differences: DirectDifferenceRow[];
  sharedTraits: SharedTraitRow[];
  metricRows: MetricCompareRow[];
  topDifferenceContext: string;
}

type FilterPair = QueryFilterPair;

const NONE = "__none__";
const SUGGESTED_COHORTS = DEFAULTS_BY_PAGE.profile?.suggestedCohorts ?? [];

const METRIC_LABELS: Record<string, string> = {
  totalfetishcategory: "Kink breadth",
  opennessvariable: "Openness",
  extroversionvariable: "Extroversion",
  neuroticismvariable: "Neuroticism",
  agreeablenessvariable: "Agreeableness",
  consciensiousnessvariable: "Conscientiousness",
  powerlessnessvariable: "Powerlessness",
};

const FINGERPRINT_ORDER: string[] = [
  "totalfetishcategory",
  "opennessvariable",
  "extroversionvariable",
  "neuroticismvariable",
  "agreeablenessvariable",
  "consciensiousnessvariable",
  "powerlessnessvariable",
];

function metricLabel(metric: string): string {
  return METRIC_LABELS[metric] ?? metric;
}

interface QueryResultLike {
  numRows: number;
  schema: { fields: unknown[] };
  getChildAt(index: number): { get(rowIndex: number): unknown } | null | undefined;
}

function toRows(result: QueryResultLike): unknown[][] {
  const rows: unknown[][] = [];
  for (let i = 0; i < result.numRows; i += 1) {
    const row: unknown[] = [];
    for (let c = 0; c < result.schema.fields.length; c += 1) {
      const value = result.getChildAt(c)?.get(i);
      row.push(typeof value === "bigint" ? Number(value) : value ?? null);
    }
    rows.push(row);
  }
  return rows;
}

function confidenceLabelForN(n: number): string {
  return getConfidenceStyle(n).label;
}

function formatFilterSummary(filters: FilterPair[], columnByName: Map<string, SchemaData["columns"][number]>): string {
  if (filters.length === 0) return "All respondents";

  return filters
    .map((filter) => {
      const columnMeta = columnByName.get(filter.column);
      const columnLabel = columnMeta ? getColumnDisplayName(columnMeta) : filter.column;
      const valueLabel = formatValueWithLabel(filter.value, columnMeta?.valueLabels);
      return `${columnLabel}: ${valueLabel}`;
    })
    .join(" · ");
}

function buildSurpriseFindings(summary: {
  percentileCards: PercentileCard[];
  overIndexing: OverIndexingItem[];
  defaultFilterColumn?: string;
}): SurpriseFinding[] {
  const metricFindings: SurpriseFinding[] = summary.percentileCards
    .filter((row) => row.globalPercentile != null)
    .map<SurpriseFinding>((row) => {
      const percentile = row.globalPercentile ?? 50;
      const rounded = Math.round(percentile);
      return {
        id: `metric-${row.metric}`,
        score: Math.abs(percentile - 50),
        sentence: `Your group sits in the ${rounded}th percentile on ${row.label}.`,
        href: {
          to: "/relationships",
          search: { column: row.metric },
        },
      };
    });

  const traitFindings: SurpriseFinding[] = summary.overIndexing
    .map<SurpriseFinding>((row) => {
      const ratioScore = row.ratio >= 1 ? row.ratio : 1 / Math.max(row.ratio, 0.0001);
      const direction = row.ratio >= 1 ? "more common" : "less common";
      return {
        id: `trait-${row.key}`,
        score: ratioScore,
        sentence: `${row.label} is ${direction} in this cohort (${row.ratio.toFixed(2)}x vs global).`,
        href: {
          to: "/explore/crosstab",
          search: {
            x: row.columnName,
            y: summary.defaultFilterColumn,
          },
        },
      };
    })
    .slice(0, 12);

  return [...metricFindings, ...traitFindings]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function fingerprintPoints(percentileCards: PercentileCard[]): FingerprintAxisPoint[] {
  const byMetric = new Map(percentileCards.map((row) => [row.metric, row]));

  return FINGERPRINT_ORDER.map((metric) => {
    const row = byMetric.get(metric);
    const percentile = row?.globalPercentile;
    return {
      axis: metricLabel(metric),
      value: percentile == null ? 50 : Math.max(0, Math.min(100, percentile)),
    };
  });
}

function ConfidenceIndicator({ n }: { n: number }) {
  const score = reliabilityScore(n);
  const width = Math.round(score * 100);
  return (
    <div className="space-y-1 border border-[var(--rule)] bg-[var(--paper)] p-2">
      <p className="mono-label">confidence</p>
      <div className="h-2 w-full bg-[var(--rule-light)]">
        <span
          className="block h-full bg-[var(--accent)]"
          style={{ width: `${width}%`, opacity: 0.9 }}
        />
      </div>
      <p className="mono-value text-[0.62rem] text-[var(--ink-faded)]">
        {confidenceLabelForN(n)} · N={formatNumber(n)}
      </p>
    </div>
  );
}

function ProfilePage() {
  const search = Route.useSearch();
  const [initialSearch] = useState(search);
  const navigate = useNavigate({ from: "/profile" });
  const { db, phase } = useDuckDB();

  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [searchReady, setSearchReady] = useState(false);

  const [mode, setMode] = useState<Mode>("single");

  const [selectedColumns, setSelectedColumns] = useState<[string, string, string]>(["", "", ""]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [valueOptionsByColumn, setValueOptionsByColumn] = useState<Record<string, string[]>>({});

  const [columnsA, setColumnsA] = useState<[string, string, string]>(["", "", ""]);
  const [valuesA, setValuesA] = useState<Record<string, string>>({});
  const [valueOptionsA, setValueOptionsA] = useState<Record<string, string[]>>({});

  const [columnsB, setColumnsB] = useState<[string, string, string]>(["", "", ""]);
  const [valuesB, setValuesB] = useState<Record<string, string>>({});
  const [valueOptionsB, setValueOptionsB] = useState<Record<string, string[]>>({});

  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runStage, setRunStage] = useState<RunStage>("idle");
  const [notebookSaved, setNotebookSaved] = useState(false);

  const availableFilterColumns = useMemo(() => {
    if (!schema) return [];
    return schema.columns.filter(
      (column) =>
        column.tags.includes("demographic") &&
        (column.logicalType === "categorical" || column.logicalType === "boolean"),
    );
  }, [schema]);

  const candidateColumns = useMemo(() => {
    if (!schema) return [];

    return schema.columns
      .filter(
        (column) =>
          (column.logicalType === "categorical" || column.logicalType === "boolean") &&
          (column.tags.includes("demographic") ||
            column.tags.includes("ocean") ||
            column.tags.includes("fetish")),
      )
      .sort((a, b) => a.nullRatio - b.nullRatio)
      .slice(0, 100)
      .map((column) => column.name);
  }, [schema]);

  const metricColumns = useMemo(() => {
    if (!schema) return [] as string[];
    const available = new Set(schema.columns.map((column) => column.name));
    return PROFILE_METRICS.filter((metric) => available.has(metric));
  }, [schema]);

  const columnByName = useMemo(() => {
    if (!schema) return new Map<string, SchemaData["columns"][number]>();
    return new Map(schema.columns.map((column) => [column.name, column]));
  }, [schema]);

  const loadValueOptions = useCallback(
    async (columns: string[]): Promise<Record<string, string[]>> => {
      if (!db || columns.length === 0) return {};

      const conn = await db.connect();
      try {
        const output: Record<string, string[]> = {};

        for (const column of columns) {
          const sql = `
            SELECT cast(${quoteIdentifier(column)} AS VARCHAR) AS value, count(*)::BIGINT AS cnt
            FROM data
            WHERE ${quoteIdentifier(column)} IS NOT NULL
            GROUP BY 1
            ORDER BY cnt DESC
            LIMIT 30
          `;

          const result = await conn.query(sql);
          const rows = toRows(result);
          output[column] = rows.map((row) => String(row[0] ?? "NULL"));
        }

        return output;
      } finally {
        await conn.close();
      }
    },
    [db],
  );

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) return;
        const nextSchema = response.data;
        setSchema(nextSchema);

        const defaults = nextSchema.columns
          .filter(
            (column) =>
              column.tags.includes("demographic") &&
              (column.logicalType === "categorical" || column.logicalType === "boolean"),
          )
          .slice(0, 3)
          .map((column) => column.name);

        const resolve = (candidate: string | undefined, fallback: string) => {
          if (!candidate) return fallback;
          return nextSchema.columns.some((column) => column.name === candidate) ? candidate : fallback;
        };

        const nextSingleColumns: [string, string, string] = [
          resolve(initialSearch.c0, defaults[0] ?? ""),
          resolve(initialSearch.c1, defaults[1] ?? ""),
          resolve(initialSearch.c2, defaults[2] ?? ""),
        ];

        const nextColumnsA: [string, string, string] = [
          resolve(initialSearch.ac0, defaults[0] ?? ""),
          resolve(initialSearch.ac1, defaults[1] ?? ""),
          resolve(initialSearch.ac2, defaults[2] ?? ""),
        ];

        const nextColumnsB: [string, string, string] = [
          resolve(initialSearch.bc0, defaults[0] ?? ""),
          resolve(initialSearch.bc1, defaults[1] ?? ""),
          resolve(initialSearch.bc2, defaults[2] ?? ""),
        ];

        const nextSingleValues: Record<string, string> = {};
        const nextValuesA: Record<string, string> = {};
        const nextValuesB: Record<string, string> = {};

        if (nextSingleColumns[0] && initialSearch.v0) nextSingleValues[nextSingleColumns[0]] = initialSearch.v0;
        if (nextSingleColumns[1] && initialSearch.v1) nextSingleValues[nextSingleColumns[1]] = initialSearch.v1;
        if (nextSingleColumns[2] && initialSearch.v2) nextSingleValues[nextSingleColumns[2]] = initialSearch.v2;

        if (nextColumnsA[0] && initialSearch.av0) nextValuesA[nextColumnsA[0]] = initialSearch.av0;
        if (nextColumnsA[1] && initialSearch.av1) nextValuesA[nextColumnsA[1]] = initialSearch.av1;
        if (nextColumnsA[2] && initialSearch.av2) nextValuesA[nextColumnsA[2]] = initialSearch.av2;

        if (nextColumnsB[0] && initialSearch.bv0) nextValuesB[nextColumnsB[0]] = initialSearch.bv0;
        if (nextColumnsB[1] && initialSearch.bv1) nextValuesB[nextColumnsB[1]] = initialSearch.bv1;
        if (nextColumnsB[2] && initialSearch.bv2) nextValuesB[nextColumnsB[2]] = initialSearch.bv2;

        setMode(initialSearch.mode === "compare" ? "compare" : "single");
        setSelectedColumns(nextSingleColumns);
        setSelectedValues(nextSingleValues);
        setColumnsA(nextColumnsA);
        setValuesA(nextValuesA);
        setColumnsB(nextColumnsB);
        setValuesB(nextValuesB);
        setSearchReady(true);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setSchemaError(error.message);
          setSearchReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialSearch]);

  useEffect(() => {
    if (!searchReady) return;

    const singleValue0 = selectedColumns[0] ? selectedValues[selectedColumns[0]] : undefined;
    const singleValue1 = selectedColumns[1] ? selectedValues[selectedColumns[1]] : undefined;
    const singleValue2 = selectedColumns[2] ? selectedValues[selectedColumns[2]] : undefined;

    const valueA0 = columnsA[0] ? valuesA[columnsA[0]] : undefined;
    const valueA1 = columnsA[1] ? valuesA[columnsA[1]] : undefined;
    const valueA2 = columnsA[2] ? valuesA[columnsA[2]] : undefined;

    const valueB0 = columnsB[0] ? valuesB[columnsB[0]] : undefined;
    const valueB1 = columnsB[1] ? valuesB[columnsB[1]] : undefined;
    const valueB2 = columnsB[2] ? valuesB[columnsB[2]] : undefined;

    void navigate({
      search: {
        mode: mode === "compare" ? "compare" : undefined,
        c0: mode === "single" ? selectedColumns[0] || undefined : undefined,
        c1: mode === "single" ? selectedColumns[1] || undefined : undefined,
        c2: mode === "single" ? selectedColumns[2] || undefined : undefined,
        v0: mode === "single" ? singleValue0 || undefined : undefined,
        v1: mode === "single" ? singleValue1 || undefined : undefined,
        v2: mode === "single" ? singleValue2 || undefined : undefined,
        ac0: mode === "compare" ? columnsA[0] || undefined : undefined,
        ac1: mode === "compare" ? columnsA[1] || undefined : undefined,
        ac2: mode === "compare" ? columnsA[2] || undefined : undefined,
        av0: mode === "compare" ? valueA0 || undefined : undefined,
        av1: mode === "compare" ? valueA1 || undefined : undefined,
        av2: mode === "compare" ? valueA2 || undefined : undefined,
        bc0: mode === "compare" ? columnsB[0] || undefined : undefined,
        bc1: mode === "compare" ? columnsB[1] || undefined : undefined,
        bc2: mode === "compare" ? columnsB[2] || undefined : undefined,
        bv0: mode === "compare" ? valueB0 || undefined : undefined,
        bv1: mode === "compare" ? valueB1 || undefined : undefined,
        bv2: mode === "compare" ? valueB2 || undefined : undefined,
      },
      replace: true,
    });
  }, [
    mode,
    selectedColumns,
    selectedValues,
    columnsA,
    valuesA,
    columnsB,
    valuesB,
    navigate,
    searchReady,
  ]);

  useEffect(() => {
    if (!db) return;
    const activeColumns = selectedColumns.filter(Boolean);
    if (activeColumns.length === 0) return;

    let cancelled = false;
    void loadValueOptions(activeColumns)
      .then((options) => {
        if (!cancelled) setValueOptionsByColumn(options);
      })
      .catch(() => {
        if (!cancelled) setValueOptionsByColumn({});
      });

    return () => {
      cancelled = true;
    };
  }, [selectedColumns, db, loadValueOptions]);

  useEffect(() => {
    if (!db) return;
    const activeColumns = columnsA.filter(Boolean);
    if (activeColumns.length === 0) return;

    let cancelled = false;
    void loadValueOptions(activeColumns)
      .then((options) => {
        if (!cancelled) setValueOptionsA(options);
      })
      .catch(() => {
        if (!cancelled) setValueOptionsA({});
      });

    return () => {
      cancelled = true;
    };
  }, [columnsA, db, loadValueOptions]);

  useEffect(() => {
    if (!db) return;
    const activeColumns = columnsB.filter(Boolean);
    if (activeColumns.length === 0) return;

    let cancelled = false;
    void loadValueOptions(activeColumns)
      .then((options) => {
        if (!cancelled) setValueOptionsB(options);
      })
      .catch(() => {
        if (!cancelled) setValueOptionsB({});
      });

    return () => {
      cancelled = true;
    };
  }, [columnsB, db, loadValueOptions]);

  const filterPairs = useMemo(
    () =>
      selectedColumns
        .map((column) => ({ column, value: selectedValues[column] }))
        .filter((item): item is FilterPair => Boolean(item.column && item.value)),
    [selectedColumns, selectedValues],
  );

  const filterPairsA = useMemo(
    () =>
      columnsA
        .map((column) => ({ column, value: valuesA[column] }))
        .filter((item): item is FilterPair => Boolean(item.column && item.value)),
    [columnsA, valuesA],
  );

  const filterPairsB = useMemo(
    () =>
      columnsB
        .map((column) => ({ column, value: valuesB[column] }))
        .filter((item): item is FilterPair => Boolean(item.column && item.value)),
    [columnsB, valuesB],
  );

  const canRun =
    mode === "single"
      ? Boolean(db) && filterPairs.length > 0 && !running
      : Boolean(db) && filterPairsA.length > 0 && filterPairsB.length > 0 && !running;

  const runSingleCohort = useCallback(
    async (
      condition: string,
      filters: FilterPair[],
      onStage?: (stage: RunStage) => void,
    ): Promise<ProfileSummary> => {
      if (!db) throw new Error("DuckDB is not ready yet.");

      const conn = await db.connect();
      try {
        const runSql = async (sql: string) => {
          const result = await conn.query(sql);
          return toRows(result);
        };

        onStage?.("identity");
        const sizeRows = await runSql(buildProfileSizeQuery(condition));
        const totalSize = asNumber(sizeRows[0]?.[0]);
        const cohortSize = asNumber(sizeRows[0]?.[1]);
        const cohortSharePercent = totalSize > 0 ? (cohortSize / totalSize) * 100 : 0;
        const cohortRarity = Math.max(0, Math.min(100, 100 - cohortSharePercent));

        onStage?.("percentile");
        const percentileRows =
          metricColumns.length > 0
            ? await runSql(buildPercentileCardsQuery(condition, metricColumns))
            : [];

        const percentileCards: PercentileCard[] = percentileRows.map((row) => {
          const metric = String(row[0] ?? "");
          const n = asNumber(row[4]);
          const percentile = row[7] == null ? null : Number(row[7]);
          const margin = n > 0 ? Math.min(28, 120 / Math.sqrt(n)) : 40;

          return {
            metric,
            label: metricLabel(metric),
            cohortMedian: row[1] == null ? null : Number(row[1]),
            cohortMean: row[2] == null ? null : Number(row[2]),
            cohortSD: row[3] == null ? null : Number(row[3]),
            cohortN: n,
            globalMedian: row[5] == null ? null : Number(row[5]),
            globalSD: row[6] == null ? null : Number(row[6]),
            globalPercentile: percentile,
            ciLower: percentile == null ? null : Math.max(0, percentile - margin),
            ciUpper: percentile == null ? null : Math.min(100, percentile + margin),
          };
        });

        onStage?.("overindex");
        const overRows =
          candidateColumns.length > 0
            ? await runSql(
                buildOverIndexingQuery(condition, candidateColumns, {
                  topLimit: 12,
                  underLimit: 5,
                  minCount: 30,
                }),
              )
            : [];

        const overIndexing: OverIndexingItem[] = overRows.map((row, index) => {
          const columnName = String(row[0] ?? "");
          const value = String(row[1] ?? "");
          const columnMeta = columnByName.get(columnName);
          const label = `${columnMeta ? getColumnDisplayName(columnMeta) : columnName}: ${formatValueWithLabel(value, columnMeta?.valueLabels)}`;

          return {
            key: `${columnName}-${value}-${index}`,
            label,
            columnName,
            value,
            cohortCount: asNumber(row[2]),
            globalCount: asNumber(row[3]),
            cohortPct: asNumber(row[4]) * 100,
            globalPct: asNumber(row[5]) * 100,
            ratio: asNumber(row[6]),
            direction: String(row[7] ?? "over") === "under" ? "under" : "over",
            isGated: columnMeta?.nullMeaning === "GATED",
            href: {
              x: columnName,
              y: filters[0]?.column,
            },
          };
        });

        const topOverIndexing = overIndexing.filter((row) => row.direction === "over");
        const underIndexing = overIndexing.filter((row) => row.direction === "under");

        onStage?.("distribution");
        const distributions: DistributionSummary[] = await Promise.all(
          percentileCards.map(async (card) => {
            const rows = await runSql(buildDistributionHistogramQuery(condition, card.metric, 40));

            return {
              metric: card.metric,
              label: card.label,
              bins: rows.map((histRow) => ({
                bin: asNumber(histRow[0]),
                globalCount: asNumber(histRow[1]),
                cohortCount: asNumber(histRow[2]),
              })),
              min: rows[0]?.[3] == null ? 0 : Number(rows[0][3]),
              max: rows[0]?.[4] == null ? 0 : Number(rows[0][4]),
              cohortMedian: card.cohortMedian,
              cohortSD: card.cohortSD,
              cohortN: card.cohortN,
              globalMedian: card.globalMedian,
            };
          }),
        );

        const surpriseFindings = buildSurpriseFindings({
          percentileCards,
          overIndexing,
          defaultFilterColumn: filters[0]?.column,
        });

        onStage?.("done");
        return {
          totalSize,
          cohortSize,
          cohortSharePercent,
          cohortRarity,
          filterSummary: formatFilterSummary(filters, columnByName),
          percentileCards,
          overIndexing,
          topOverIndexing,
          underIndexing,
          distributions,
          surpriseFindings,
        };
      } finally {
        await conn.close();
      }
    },
    [db, metricColumns, candidateColumns, columnByName],
  );

  const runProfile = useCallback(async () => {
    if (!db) {
      setRunError("DuckDB is not ready yet.");
      return;
    }

    setRunning(true);
    setRunError(null);
    setRunStage("identity");
    setSummary(null);
    setComparison(null);

    try {
      if (mode === "single") {
        if (filterPairs.length === 0) {
          throw new Error("Select at least one field value to define your cohort.");
        }

        const condition = buildCondition(filterPairs);
        const result = await runSingleCohort(condition, filterPairs, setRunStage);
        setSummary(result);
      } else {
        if (filterPairsA.length === 0 || filterPairsB.length === 0) {
          throw new Error("Select at least one value for each group.");
        }

        const conditionA = buildCondition(filterPairsA);
        const conditionB = buildCondition(filterPairsB);

        const [a, b] = await Promise.all([
          runSingleCohort(conditionA, filterPairsA),
          runSingleCohort(conditionB, filterPairsB),
        ]);

        setRunStage("overindex");
        const conn = await db.connect();
        try {
          const runSql = async (sql: string) => {
            const result = await conn.query(sql);
            return toRows(result);
          };

          const diffRowsRaw = await runSql(
            buildDirectComparisonQuery(conditionA, conditionB, candidateColumns, 20),
          );

          const differences: DirectDifferenceRow[] = diffRowsRaw.map((row, index) => {
            const columnName = String(row[0] ?? "");
            const value = String(row[1] ?? "");
            const columnMeta = columnByName.get(columnName);
            const label = `${columnMeta ? getColumnDisplayName(columnMeta) : columnName}: ${formatValueWithLabel(value, columnMeta?.valueLabels)}`;

            const pctA = asNumber(row[4]) * 100;
            const pctB = asNumber(row[5]) * 100;
            return {
              key: `${columnName}-${value}-${index}`,
              label,
              columnName,
              value,
              valueA: pctA,
              valueB: pctB,
              nA: asNumber(row[2]),
              nB: asNumber(row[3]),
              pctA,
              pctB,
              countA: asNumber(row[2]),
              countB: asNumber(row[3]),
              absDelta: asNumber(row[6]),
              isGated: columnMeta?.nullMeaning === "GATED",
              href: {
                x: columnName,
                y: filterPairsA[0]?.column,
              },
            };
          });

          const metricRowsRaw = await runSql(
            buildMetricComparisonQuery(conditionA, conditionB, metricColumns),
          );

          const metricRows: MetricCompareRow[] = metricRowsRaw.map((row) => {
            const metric = String(row[0] ?? "");
            return {
              metric,
              label: metricLabel(metric),
              medianA: row[1] == null ? null : Number(row[1]),
              medianB: row[2] == null ? null : Number(row[2]),
              meanA: row[3] == null ? null : Number(row[3]),
              meanB: row[4] == null ? null : Number(row[4]),
              sdA: row[5] == null ? null : Number(row[5]),
              sdB: row[6] == null ? null : Number(row[6]),
              nA: asNumber(row[7]),
              nB: asNumber(row[8]),
            };
          });

          const sharedByKey = new Map<string, { a: OverIndexingItem; b: OverIndexingItem }>();
          const overA = new Map(
            a.topOverIndexing.map((row) => [`${row.columnName}\0${row.value}`, row]),
          );
          const overB = new Map(
            b.topOverIndexing.map((row) => [`${row.columnName}\0${row.value}`, row]),
          );

          for (const [key, rowA] of overA.entries()) {
            const rowB = overB.get(key);
            if (!rowB) continue;
            sharedByKey.set(key, { a: rowA, b: rowB });
          }

          const sharedTraits: SharedTraitRow[] = [...sharedByKey.entries()]
            .map(([key, rows]) => ({
              key,
              label: rows.a.label,
              ratioA: rows.a.ratio,
              ratioB: rows.b.ratio,
              href: rows.a.href,
            }))
            .sort((left, right) => Math.min(right.ratioA, right.ratioB) - Math.min(left.ratioA, left.ratioB))
            .slice(0, 8);

          const topDifference = differences[0];
          const topDifferenceContext = topDifference
            ? contextualizeDifference({
                traitLabel: topDifference.label,
                absDelta: topDifference.absDelta,
                groupALabel: "Group A",
                groupBLabel: "Group B",
              })
            : "These groups look similar across the selected traits.";

          setRunStage("done");
          setComparison({
            a,
            b,
            differences,
            sharedTraits,
            metricRows,
            topDifferenceContext,
          });
        } finally {
          await conn.close();
        }
      }
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Failed to run profile analysis.");
    } finally {
      setRunning(false);
    }
  }, [
    db,
    mode,
    filterPairs,
    filterPairsA,
    filterPairsB,
    runSingleCohort,
    candidateColumns,
    columnByName,
    metricColumns,
  ]);

  const saveToNotebook = useCallback(() => {
    const activeSummary = mode === "single" ? summary : null;
    const activeComparison = mode === "compare" ? comparison : null;
    if (!activeSummary && !activeComparison) return;

    const filters = mode === "single" ? filterPairs : [...filterPairsA, ...filterPairsB];
    const filterDesc = filters.map((pair) => `${pair.column}=${pair.value}`).join(", ");

    addNotebookEntry({
      title: `Profile: ${filterDesc}`,
      sourceUrl: window.location.href,
      queryDefinition: {
        type: "profile",
        params:
          mode === "single"
            ? { mode: "single", filters: filterPairs }
            : { mode: "compare", filtersA: filterPairsA, filtersB: filterPairsB },
      },
      resultsSnapshot: {
        summary:
          activeSummary != null
            ? {
                cohortSize: activeSummary.cohortSize,
                topTraits: activeSummary.topOverIndexing.slice(0, 5).map((row) => row.label),
              }
            : {
                groupASize: activeComparison?.a.cohortSize,
                groupBSize: activeComparison?.b.cohortSize,
                topDifference: activeComparison?.differences[0]?.label,
              },
      },
      notes: "",
    });

    setNotebookSaved(true);
    setTimeout(() => setNotebookSaved(false), 1800);
  }, [mode, summary, comparison, filterPairs, filterPairsA, filterPairsB]);

  const applySuggestedCohort = useCallback(
    (filters: Array<{ column: string; value: string }>) => {
      if (!schema) return;

      const available = new Set(schema.columns.map((column) => column.name));
      const valid = filters.filter((filter) => available.has(filter.column)).slice(0, 3);

      const nextColumns: [string, string, string] = ["", "", ""];
      const nextValues: Record<string, string> = {};

      valid.forEach((filter, index) => {
        nextColumns[index] = filter.column;
        nextValues[filter.column] = filter.value;
      });

      setMode("single");
      setSummary(null);
      setComparison(null);
      setRunError(null);
      setSelectedColumns(nextColumns);
      setSelectedValues(nextValues);
    },
    [schema],
  );

  const renderFilterSlots = (
    columns: [string, string, string],
    setColumns: (next: [string, string, string]) => void,
    values: Record<string, string>,
    setValues: (next: Record<string, string>) => void,
    valueOptions: Record<string, string[]>,
    layout: "grid" | "stack" = "grid",
  ) => (
    <div className={layout === "stack" ? "flex flex-col gap-3" : "grid gap-4 md:grid-cols-3"}>
      {[0, 1, 2].map((slot) => {
        const column = columns[slot] ?? "";
        const options = valueOptions[column] ?? [];
        const columnMeta = availableFilterColumns.find((candidate) => candidate.name === column);

        return (
          <div key={`slot-${slot}`} className="space-y-2 border border-[var(--rule)] bg-[var(--paper)] p-3">
            <label className="editorial-label">
              Field {slot + 1}
              <ColumnCombobox
                columns={availableFilterColumns}
                value={column}
                includeNoneOption
                noneOptionLabel="None"
                onValueChange={(value) => {
                  const next = [...columns] as [string, string, string];
                  next[slot] = value;
                  setColumns(next);
                }}
              />
            </label>

            <label className="editorial-label">
              Value
              <Select
                value={values[column] || NONE}
                onValueChange={(value) => {
                  const next = { ...values, [column]: value === NONE ? "" : value };
                  setValues(next);
                }}
                disabled={!column || options.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatValueWithLabel(option, columnMeta?.valueLabels)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        );
      })}
    </div>
  );

  const stageLabel =
    runStage === "identity"
      ? "Calculating cohort size and identity"
      : runStage === "percentile"
        ? "Building personality snapshot"
        : runStage === "overindex"
          ? "Ranking standout traits"
          : runStage === "distribution"
            ? "Rendering distributions"
            : runStage === "done"
              ? "Complete"
              : "";

  const comparisonPercentileA: PercentileChartDatum[] =
    comparison?.a.percentileCards.map((row) => ({
      metric: row.metric,
      label: row.label,
      percentile: row.globalPercentile,
      cohortN: row.cohortN,
      ciLower: row.ciLower,
      ciUpper: row.ciUpper,
    })) ?? [];

  const comparisonPercentileB: PercentileChartDatum[] =
    comparison?.b.percentileCards.map((row) => ({
      metric: row.metric,
      label: row.label,
      percentile: row.globalPercentile,
      cohortN: row.cohortN,
      ciLower: row.ciLower,
      ciUpper: row.ciUpper,
    })) ?? [];

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Build a Profile</h1>
        <p className="page-subtitle">
          Build a cohort, see where it sits in the landscape, and compare two groups directly.
        </p>
      </header>

      {schemaError ? <section className="alert alert--error">Failed to load schema: {schemaError}</section> : null}

      {schema ? (
        <section className="raised-panel space-y-4">
          <SectionHeader number="01" title="Choose your group" />

          {SUGGESTED_COHORTS.length > 0 ? (
            <div className="space-y-2">
              <p className="mono-label">Suggested starters</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_COHORTS.map((cohort) => (
                  <button
                    key={cohort.label}
                    type="button"
                    className="editorial-button"
                    onClick={() => applySuggestedCohort(cohort.filters)}
                  >
                    {cohort.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex gap-0 border border-[var(--rule)]" style={{ width: "fit-content" }}>
            <button
              type="button"
              className={`px-4 py-2 text-[0.75rem] tracking-[0.08em] uppercase font-['JetBrains_Mono',ui-monospace,monospace] border-r border-[var(--rule)] transition-colors ${
                mode === "single"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--paper)] text-[var(--ink)] hover:text-[var(--accent-hover)]"
              }`}
              onClick={() => {
                setMode("single");
                setComparison(null);
                setRunError(null);
              }}
            >
              One Group
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-[0.75rem] tracking-[0.08em] uppercase font-['JetBrains_Mono',ui-monospace,monospace] transition-colors ${
                mode === "compare"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--paper)] text-[var(--ink)] hover:text-[var(--accent-hover)]"
              }`}
              onClick={() => {
                setMode("compare");
                setSummary(null);
                setRunError(null);
              }}
            >
              Compare Two Groups
            </button>
          </div>

          {mode === "single" ? (
            renderFilterSlots(
              selectedColumns,
              (next) => setSelectedColumns(next),
              selectedValues,
              (next) => setSelectedValues(next),
              valueOptionsByColumn,
            )
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 border border-[var(--rule)] bg-[var(--paper)] p-4">
                <p className="mono-label text-[0.75rem] uppercase tracking-[0.08em]">Group A</p>
                {renderFilterSlots(
                  columnsA,
                  (next) => setColumnsA(next),
                  valuesA,
                  (next) => setValuesA(next),
                  valueOptionsA,
                  "stack",
                )}
              </div>

              <div className="space-y-3 border border-[var(--rule)] bg-[var(--paper)] p-4">
                <p className="mono-label text-[0.75rem] uppercase tracking-[0.08em]">Group B</p>
                {renderFilterSlots(
                  columnsB,
                  (next) => setColumnsB(next),
                  valuesB,
                  (next) => setValuesB(next),
                  valueOptionsB,
                  "stack",
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="default"
              disabled={!canRun}
              onClick={() => {
                void runProfile();
              }}
            >
              {running
                ? "Running..."
                : mode === "single"
                  ? "Run Group Analysis"
                  : "Compare Groups"}
            </Button>

            {(summary || comparison) && !running ? (
              <button type="button" className="editorial-button" onClick={saveToNotebook}>
                {notebookSaved ? "Saved" : "Add to Notebook"}
              </button>
            ) : null}

            {running ? (
              <p className="mono-value text-[0.72rem] text-[var(--ink-faded)]">{stageLabel}</p>
            ) : null}
          </div>

          {runError ? <p className="alert alert--error">{runError}</p> : null}
        </section>
      ) : (
        <section className="editorial-panel">
          <LoadingSkeleton variant="panel" phase={phase} title="Loading schema metadata..." />
        </section>
      )}

      {running && !summary && !comparison ? (
        <section className="space-y-3">
          <SectionHeader number="02" title="Preparing results" subtitle={stageLabel} />
          <LoadingSkeleton variant="stat-grid" phase={phase} title="Computing profile..." />
        </section>
      ) : null}

      {summary ? (
        <section className="space-y-4">
          <SectionHeader number="02" title="Your group at a glance" subtitle={summary.filterSummary} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="stat-grid grid-cols-1 md:grid-cols-4">
              <StatCard label="Dataset Size" value={formatNumber(summary.totalSize)} />
              <StatCard label="Group Size" value={formatNumber(summary.cohortSize)} />
              <StatCard
                label="Group Share"
                value={formatPercent(summary.cohortSharePercent, 2)}
                note={`${confidenceLabelForN(summary.cohortSize)}`}
              />
              <StatCard
                label="Cohort Rarity"
                value={formatPercent(summary.cohortRarity, 2)}
                note="100% minus cohort share"
              />
            </div>

            <div className="space-y-3">
              <ConfidenceIndicator n={summary.cohortSize} />
              <CohortFingerprint
                points={fingerprintPoints(summary.percentileCards)}
                labelA="This cohort"
                size={200}
              />
            </div>
          </div>

          <section className="raised-panel space-y-3">
            <SectionHeader
              number="03"
              title="Personality snapshot"
              subtitle="Percentile ranks versus the full dataset"
            />

            <PercentileChart
              data={summary.percentileCards.map((row) => ({
                metric: row.metric,
                label: row.label,
                percentile: row.globalPercentile,
                cohortN: row.cohortN,
                ciLower: row.ciLower,
                ciUpper: row.ciUpper,
              }))}
            />

            <details>
              <summary className="editorial-button inline-flex">Show data table</summary>
              <div className="mt-3">
                <DataTable
                  rows={summary.percentileCards}
                  rowKey={(row) => row.metric}
                  columns={[
                    {
                      id: "metric",
                      header: "Metric",
                      cell: (row) => {
                        const columnMeta = columnByName.get(row.metric);
                        if (!columnMeta) return row.label;
                        return (
                          <ColumnNameTooltip column={columnMeta}>
                            <span>{row.label}</span>
                          </ColumnNameTooltip>
                        );
                      },
                    },
                    {
                      id: "median",
                      header: "Cohort median",
                      align: "right",
                      cell: (row) => (row.cohortMedian == null ? "n/a" : row.cohortMedian.toFixed(3)),
                    },
                    {
                      id: "percentile",
                      header: "Global percentile",
                      align: "right",
                      cell: (row) =>
                        row.globalPercentile == null
                          ? "n/a"
                          : formatPercent(row.globalPercentile, 1),
                    },
                    {
                      id: "n",
                      header: "N",
                      align: "right",
                      cell: (row) => formatNumber(row.cohortN),
                    },
                  ]}
                />
              </div>
            </details>
          </section>

          <section className="raised-panel space-y-3">
            <SectionHeader
              number="03b"
              title="Distribution panorama"
              subtitle="Where the cohort clusters across each metric"
            />

            <details open={summary.cohortSize > 200}>
              <summary className="editorial-button inline-flex">
                {summary.cohortSize > 200 ? "Hide distributions" : "Show distributions"}
              </summary>
              <div className="mt-3 space-y-2">
                {summary.distributions.map((distribution) => (
                  <DistributionStrip
                    key={distribution.metric}
                    label={distribution.label}
                    bins={distribution.bins}
                    min={distribution.min}
                    max={distribution.max}
                    cohortMedian={distribution.cohortMedian}
                    cohortSD={distribution.cohortSD}
                    cohortN={distribution.cohortN}
                    globalMedian={distribution.globalMedian}
                  />
                ))}
              </div>
            </details>
          </section>

          <section className="raised-panel space-y-4">
            <SectionHeader
              number="04"
              title="What stands out"
              subtitle="Top over-indexed and under-indexed traits versus global"
            />

            <OverIndexChart
              rows={summary.topOverIndexing}
              cohortSize={summary.cohortSize}
              title="More common in your group"
            />

            <OverIndexChart
              rows={summary.underIndexing}
              cohortSize={summary.cohortSize}
              title="Less common in your group"
            />

            <details>
              <summary className="editorial-button inline-flex">Show data table</summary>
              <div className="mt-3">
                <DataTable
                  rows={summary.overIndexing}
                  rowKey={(row) => row.key}
                  columns={[
                    {
                      id: "trait",
                      header: "Trait",
                      cell: (row) => (
                        <Link
                          to="/explore/crosstab"
                          search={{ x: row.href.x, y: row.href.y }}
                          className="mono-value text-[var(--accent)]"
                        >
                          {row.label}
                        </Link>
                      ),
                    },
                    {
                      id: "ratio",
                      header: "Ratio",
                      align: "right",
                      cell: (row) => `${row.ratio.toFixed(2)}x`,
                    },
                    {
                      id: "cohort",
                      header: "Cohort %",
                      align: "right",
                      cell: (row) => formatPercent(row.cohortPct, 2),
                    },
                    {
                      id: "global",
                      header: "Global %",
                      align: "right",
                      cell: (row) => formatPercent(row.globalPct, 2),
                    },
                    {
                      id: "n",
                      header: "N",
                      align: "right",
                      cell: (row) => `${formatNumber(row.cohortCount)} / ${formatNumber(row.globalCount)}`,
                    },
                  ]}
                />
              </div>
            </details>
          </section>

          <section className="raised-panel space-y-3">
            <SectionHeader
              number="04b"
              title="Surprise discoveries"
              subtitle="A few high-signal findings to explore next"
            />

            <div className="grid gap-2 md:grid-cols-2">
              {summary.surpriseFindings.map((finding) => (
                <Link
                  key={finding.id}
                  to={finding.href.to}
                  search={finding.href.search}
                  className="border border-[var(--rule)] bg-[var(--paper)] p-3 text-[0.9rem] text-[var(--ink)] hover:border-[var(--accent)]"
                >
                  {finding.sentence}
                </Link>
              ))}
            </div>
          </section>

          <section className="raised-panel space-y-3">
            <SectionHeader number="05" title="Explore deeper" />
            <ul className="space-y-2 text-[0.9rem]">
              {summary.topOverIndexing.slice(0, 5).map((row) => (
                <li key={`deep-${row.key}`}>
                  <Link
                    to="/explore/crosstab"
                    search={{ x: row.href.x, y: row.href.y }}
                    className="text-[var(--accent)] underline decoration-[var(--rule-light)] underline-offset-2"
                  >
                    {row.label}
                  </Link>
                </li>
              ))}
              {summary.percentileCards.slice(0, 3).map((row) => (
                <li key={`deep-metric-${row.metric}`}>
                  <Link
                    to="/relationships"
                    search={{ column: row.metric }}
                    className="text-[var(--accent)] underline decoration-[var(--rule-light)] underline-offset-2"
                  >
                    Connections around {row.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </section>
      ) : null}

      {comparison ? (
        <section className="space-y-4">
          <SectionHeader number="C1" title="Dual identity cards" subtitle="Who each group represents" />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="raised-panel space-y-3">
              <p className="mono-label">Group A</p>
              <p className="section-subtitle">{comparison.a.filterSummary}</p>
              <div className="stat-grid grid-cols-1 md:grid-cols-3">
                <StatCard label="N" value={formatNumber(comparison.a.cohortSize)} />
                <StatCard label="Share" value={formatPercent(comparison.a.cohortSharePercent, 2)} />
                <StatCard label="Rarity" value={formatPercent(comparison.a.cohortRarity, 2)} />
              </div>
              <ConfidenceIndicator n={comparison.a.cohortSize} />
              <CohortFingerprint points={fingerprintPoints(comparison.a.percentileCards)} labelA="Group A" size={190} />
            </div>

            <div className="raised-panel space-y-3">
              <p className="mono-label">Group B</p>
              <p className="section-subtitle">{comparison.b.filterSummary}</p>
              <div className="stat-grid grid-cols-1 md:grid-cols-3">
                <StatCard label="N" value={formatNumber(comparison.b.cohortSize)} />
                <StatCard label="Share" value={formatPercent(comparison.b.cohortSharePercent, 2)} />
                <StatCard label="Rarity" value={formatPercent(comparison.b.cohortRarity, 2)} />
              </div>
              <ConfidenceIndicator n={comparison.b.cohortSize} />
              <CohortFingerprint points={fingerprintPoints(comparison.b.percentileCards)} labelA="Group B" size={190} />
            </div>
          </div>

          <section className="raised-panel space-y-3">
            <SectionHeader
              number="C2"
              title="Fingerprint comparison"
              subtitle="Percentile positions for each group"
            />

            <PercentileChart
              data={comparisonPercentileA}
              compareData={comparisonPercentileB}
              groupALabel="Group A"
              groupBLabel="Group B"
            />

            <details>
              <summary className="editorial-button inline-flex">Show distributions</summary>
              <div className="mt-3 space-y-2">
                {comparison.a.distributions.map((distributionA) => {
                  const distributionB = comparison.b.distributions.find(
                    (candidate) => candidate.metric === distributionA.metric,
                  );
                  if (!distributionB) return null;

                  return (
                    <DistributionStrip
                      key={`compare-dist-${distributionA.metric}`}
                      label={distributionA.label}
                      bins={distributionA.bins}
                      compareBins={distributionB.bins}
                      min={Math.min(distributionA.min, distributionB.min)}
                      max={Math.max(distributionA.max, distributionB.max)}
                      cohortMedian={distributionA.cohortMedian}
                      cohortSD={distributionA.cohortSD}
                      cohortN={distributionA.cohortN}
                      globalMedian={distributionA.globalMedian}
                      compareMedian={distributionB.cohortMedian}
                    />
                  );
                })}
              </div>
            </details>
          </section>

          <section className="raised-panel space-y-3">
            <SectionHeader
              number="C3"
              title="What's actually different"
              subtitle="Ranked by absolute percentage-point gap"
            />
            <p className="section-subtitle">{comparison.topDifferenceContext}</p>

            <DumbbellChart
              rows={comparison.differences}
              groupALabel="Group A"
              groupBLabel="Group B"
            />

            <details>
              <summary className="editorial-button inline-flex">Show data table</summary>
              <div className="mt-3">
                <DataTable
                  rows={comparison.differences}
                  rowKey={(row) => row.key}
                  columns={[
                    {
                      id: "trait",
                      header: "Trait",
                      cell: (row) => (
                        <Link
                          to="/explore/crosstab"
                          search={{ x: row.href.x, y: row.href.y }}
                          className="mono-value text-[var(--accent)]"
                        >
                          {row.label}
                        </Link>
                      ),
                    },
                    {
                      id: "a",
                      header: "Group A",
                      align: "right",
                      cell: (row) => formatPercent(row.pctA, 2),
                    },
                    {
                      id: "b",
                      header: "Group B",
                      align: "right",
                      cell: (row) => formatPercent(row.pctB, 2),
                    },
                    {
                      id: "delta",
                      header: "Δ points",
                      align: "right",
                      cell: (row) => row.absDelta.toFixed(2),
                    },
                    {
                      id: "n",
                      header: "N",
                      align: "right",
                      cell: (row) => `${formatNumber(row.countA)} / ${formatNumber(row.countB)}`,
                    },
                  ]}
                />
              </div>
            </details>
          </section>

          <section className="raised-panel space-y-3">
            <SectionHeader number="C4" title="What they share" subtitle="Traits both groups over-index on" />
            <DataTable
              rows={comparison.sharedTraits}
              rowKey={(row) => row.key}
              columns={[
                {
                  id: "trait",
                  header: "Shared trait",
                  cell: (row) => (
                    <Link
                      to="/explore/crosstab"
                      search={{ x: row.href.x, y: row.href.y }}
                      className="mono-value text-[var(--accent)]"
                    >
                      {row.label}
                    </Link>
                  ),
                },
                {
                  id: "a",
                  header: "Group A ratio",
                  align: "right",
                  cell: (row) => `${row.ratioA.toFixed(2)}x`,
                },
                {
                  id: "b",
                  header: "Group B ratio",
                  align: "right",
                  cell: (row) => `${row.ratioB.toFixed(2)}x`,
                },
              ]}
              emptyMessage="No strong shared over-index traits were found for these cohorts."
            />
          </section>

          <section className="raised-panel space-y-3">
            <SectionHeader
              number="C5"
              title="Individual profiles"
              subtitle="Each group compared to global baseline"
            />

            <details>
              <summary className="editorial-button inline-flex">Group A profile</summary>
              <div className="mt-3 space-y-2">
                <OverIndexChart
                  rows={comparison.a.topOverIndexing}
                  cohortSize={comparison.a.cohortSize}
                  title="More common in Group A"
                />
                <OverIndexChart
                  rows={comparison.a.underIndexing}
                  cohortSize={comparison.a.cohortSize}
                  title="Less common in Group A"
                />
              </div>
            </details>

            <details>
              <summary className="editorial-button inline-flex">Group B profile</summary>
              <div className="mt-3 space-y-2">
                <OverIndexChart
                  rows={comparison.b.topOverIndexing}
                  cohortSize={comparison.b.cohortSize}
                  title="More common in Group B"
                />
                <OverIndexChart
                  rows={comparison.b.underIndexing}
                  cohortSize={comparison.b.cohortSize}
                  title="Less common in Group B"
                />
              </div>
            </details>
          </section>
        </section>
      ) : null}
    </div>
  );
}

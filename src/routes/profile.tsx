import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import { track } from "@/lib/client/track";
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
import { formatValueWithLabel, getColumnDisplayName, getColumnTooltip } from "@/lib/format-labels";
import { addNotebookEntry } from "@/lib/notebook-store";
import { getConfidenceStyle, reliabilityScore } from "@/lib/statistics/confidence";
import { contextualizeDifference } from "@/lib/statistics/effect-context";

type Mode = "single" | "compare";

type ProfileSearchKey =
  | `c${number}`
  | `v${number}`
  | `ac${number}`
  | `av${number}`
  | `bc${number}`
  | `bv${number}`;

type ProfileSearch = { mode?: Mode } & Partial<Record<ProfileSearchKey, string>>;

const MAX_FIELDS = 8;
const URL_SLOT_INDICES = Array.from({ length: MAX_FIELDS }, (_, index) => index);
const PREFERRED_DEFAULTS = ["straightness", "age", "politics"] as const;

function isSlotSearchKey(key: string): key is ProfileSearchKey {
  return /^(?:c|v|ac|av|bc|bv)\d+$/.test(key);
}

export const Route = createFileRoute("/profile")({
  validateSearch: (search): ProfileSearch => {
    const output: ProfileSearch = {
      mode: search.mode === "compare" ? "compare" : search.mode === "single" ? "single" : undefined,
    };

    Object.entries(search as Record<string, unknown>).forEach(([key, value]) => {
      if (!isSlotSearchKey(key) || typeof value !== "string") return;
      const indexMatch = key.match(/(\d+)$/);
      const index = Number(indexMatch?.[1] ?? -1);
      if (!Number.isInteger(index) || index < 0 || index >= MAX_FIELDS) return;
      output[key] = value;
    });

    return output;
  },
  component: ProfilePage,
});

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

  const [selectedColumns, setSelectedColumns] = useState<string[]>([""]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [valueOptionsByColumn, setValueOptionsByColumn] = useState<Record<string, string[]>>({});

  const [columnsA, setColumnsA] = useState<string[]>([""]);
  const [valuesA, setValuesA] = useState<Record<string, string>>({});
  const [valueOptionsA, setValueOptionsA] = useState<Record<string, string[]>>({});

  const [columnsB, setColumnsB] = useState<string[]>([""]);
  const [valuesB, setValuesB] = useState<Record<string, string>>({});
  const [valueOptionsB, setValueOptionsB] = useState<Record<string, string[]>>({});

  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runStage, setRunStage] = useState<RunStage>("idle");
  const [notebookSaved, setNotebookSaved] = useState(false);
  const [touchedA, setTouchedA] = useState(false);
  const [touchedB, setTouchedB] = useState(false);
  const [pendingCohort, setPendingCohort] = useState<Array<{ column: string; value: string }> | null>(
    null,
  );

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

        const availableColumns = new Set(nextSchema.columns.map((column) => column.name));
        const demographicCandidates = nextSchema.columns
          .filter(
            (column) =>
              column.tags.includes("demographic") &&
              (column.logicalType === "categorical" || column.logicalType === "boolean"),
          )
          .map((column) => column.name);

        const defaults = [...new Set([...PREFERRED_DEFAULTS, ...demographicCandidates])]
          .filter((column) => availableColumns.has(column))
          .slice(0, 3);

        const ensureSlotList = (columns: string[]) => {
          const trimmed = columns.filter(Boolean).slice(0, MAX_FIELDS);
          if (trimmed.length > 0) return trimmed;
          if (defaults.length > 0) return defaults;
          return [""];
        };

        const columnsFromSearch = (prefix: "c" | "ac" | "bc") => {
          const parsed = URL_SLOT_INDICES.map((slot) => {
            const key = `${prefix}${slot}` as ProfileSearchKey;
            const candidate = initialSearch[key];
            return candidate && availableColumns.has(candidate) ? candidate : "";
          }).filter(Boolean) as string[];

          return ensureSlotList(parsed);
        };

        const valuesFromSearch = (
          columns: string[],
          columnPrefix: "c" | "ac" | "bc",
          valuePrefix: "v" | "av" | "bv",
        ) => {
          const nextValues: Record<string, string> = {};
          URL_SLOT_INDICES.forEach((slot) => {
            const columnKey = `${columnPrefix}${slot}` as ProfileSearchKey;
            const valueKey = `${valuePrefix}${slot}` as ProfileSearchKey;
            const column = initialSearch[columnKey];
            const value = initialSearch[valueKey];
            if (!column || !value) return;
            if (!columns.includes(column)) return;
            nextValues[column] = value;
          });

          return nextValues;
        };

        const nextSingleColumns = columnsFromSearch("c");
        const nextColumnsA = columnsFromSearch("ac");
        const nextColumnsB = columnsFromSearch("bc");

        const nextSingleValues = valuesFromSearch(nextSingleColumns, "c", "v");
        const nextValuesA = valuesFromSearch(nextColumnsA, "ac", "av");
        const nextValuesB = valuesFromSearch(nextColumnsB, "bc", "bv");

        setMode(initialSearch.mode === "compare" ? "compare" : "single");
        setSelectedColumns(nextSingleColumns);
        setSelectedValues(nextSingleValues);
        setColumnsA(nextColumnsA);
        setValuesA(nextValuesA);
        setColumnsB(nextColumnsB);
        setValuesB(nextValuesB);
        setTouchedA(false);
        setTouchedB(false);
        setPendingCohort(null);
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

    const nextSearch: ProfileSearch = {
      mode: mode === "compare" ? "compare" : undefined,
    };

    URL_SLOT_INDICES.forEach((slot) => {
      const singleColumn = mode === "single" ? selectedColumns[slot] : undefined;
      nextSearch[`c${slot}` as ProfileSearchKey] = singleColumn || undefined;
      nextSearch[`v${slot}` as ProfileSearchKey] =
        mode === "single" && singleColumn ? selectedValues[singleColumn] || undefined : undefined;

      const columnA = mode === "compare" ? columnsA[slot] : undefined;
      const columnB = mode === "compare" ? columnsB[slot] : undefined;
      nextSearch[`ac${slot}` as ProfileSearchKey] = columnA || undefined;
      nextSearch[`av${slot}` as ProfileSearchKey] =
        mode === "compare" && columnA ? valuesA[columnA] || undefined : undefined;
      nextSearch[`bc${slot}` as ProfileSearchKey] = columnB || undefined;
      nextSearch[`bv${slot}` as ProfileSearchKey] =
        mode === "compare" && columnB ? valuesB[columnB] || undefined : undefined;
    });

    void navigate({
      search: nextSearch,
      replace: true,
      resetScroll: false,
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

    track({
      event: "query",
      page: typeof window !== "undefined" ? window.location.pathname : "/profile",
      action: "run_profile",
      label: mode,
      value: mode === "single" ? filterPairs.length : filterPairsA.length + filterPairsB.length,
    });

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
            const questionLabel = columnMeta ? getColumnTooltip(columnMeta) : columnName;
            const answerLabel = formatValueWithLabel(value, columnMeta?.valueLabels);
            const label = `${questionLabel}: ${answerLabel}`;

            const pctA = asNumber(row[4]) * 100;
            const pctB = asNumber(row[5]) * 100;
            return {
              key: `${columnName}-${value}-${index}`,
              label,
              questionLabel,
              answerLabel,
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

  const resetRunState = useCallback(() => {
    setSummary(null);
    setComparison(null);
    setRunError(null);
  }, []);

  const normalizeSlotColumns = useCallback((columns: string[]) => {
    const trimmed = columns.slice(0, MAX_FIELDS);
    return trimmed.length > 0 ? trimmed : [""];
  }, []);

  const buildColumnStateFromFilters = useCallback(
    (filters: Array<{ column: string; value: string }>) => {
      const nextColumns = normalizeSlotColumns(filters.map((filter) => filter.column));
      const nextValues: Record<string, string> = {};
      filters.forEach((filter) => {
        nextValues[filter.column] = filter.value;
      });
      return { nextColumns, nextValues };
    },
    [normalizeSlotColumns],
  );

  const applyCohortToGroupA = useCallback(
    (filters: Array<{ column: string; value: string }>) => {
      const { nextColumns, nextValues } = buildColumnStateFromFilters(filters);
      resetRunState();
      setColumnsA(nextColumns);
      setValuesA(nextValues);
      setTouchedA(true);
      setPendingCohort(null);
    },
    [buildColumnStateFromFilters, resetRunState],
  );

  const applyCohortToGroupB = useCallback(
    (filters: Array<{ column: string; value: string }>) => {
      const { nextColumns, nextValues } = buildColumnStateFromFilters(filters);
      resetRunState();
      setColumnsB(nextColumns);
      setValuesB(nextValues);
      setTouchedB(true);
      setPendingCohort(null);
    },
    [buildColumnStateFromFilters, resetRunState],
  );

  const applySuggestedCohort = useCallback(
    (filters: Array<{ column: string; value: string }>) => {
      if (!schema) return;

      const available = new Set(schema.columns.map((column) => column.name));
      const valid = filters.filter((filter) => available.has(filter.column)).slice(0, MAX_FIELDS);
      if (valid.length === 0) return;

      if (mode === "single") {
        const { nextColumns, nextValues } = buildColumnStateFromFilters(valid);
        setMode("single");
        resetRunState();
        setPendingCohort(null);
        setSelectedColumns(nextColumns);
        setSelectedValues(nextValues);
        return;
      }

      if (!touchedA && !touchedB) {
        applyCohortToGroupA(valid);
        return;
      }

      if (touchedA && !touchedB) {
        applyCohortToGroupB(valid);
        return;
      }

      if (!touchedA && touchedB) {
        applyCohortToGroupA(valid);
        return;
      }

      setPendingCohort(valid);
    },
    [
      schema,
      mode,
      touchedA,
      touchedB,
      buildColumnStateFromFilters,
      resetRunState,
      applyCohortToGroupA,
      applyCohortToGroupB,
    ],
  );

  const renderSingleSlot = (
    slot: number,
    columns: string[],
    setColumns: Dispatch<SetStateAction<string[]>>,
    values: Record<string, string>,
    setValues: Dispatch<SetStateAction<Record<string, string>>>,
    valueOptions: Record<string, string[]>,
    onTouched?: () => void,
  ) => {
    const column = columns[slot] ?? "";
    const options = valueOptions[column] ?? [];
    const columnMeta = columnByName.get(column);

    return (
      <div key={`slot-${slot}`} className="space-y-2 border border-[var(--rule)] bg-[var(--paper)] p-3">
        <div className="flex items-start justify-between gap-2">
          <label className="editorial-label flex-1">
            Field {slot + 1}
            <ColumnCombobox
              columns={availableFilterColumns}
              value={column}
              includeNoneOption
              noneOptionLabel="None"
              onValueChange={(value) => {
                onTouched?.();
                setColumns((current) => {
                  const next = [...current];
                  next[slot] = value;
                  return next;
                });
              }}
            />
          </label>

          {columns.length > 1 ? (
            <button
              type="button"
              className="mt-5 h-9 w-9 border border-[var(--rule)] bg-[var(--paper)] text-[1rem] leading-none text-[var(--ink)] transition-colors hover:border-[var(--accent-hover)] hover:text-[var(--accent-hover)]"
              onClick={() => {
                onTouched?.();
                setColumns((current) => {
                  if (current.length <= 1) return current;
                  const next = current.filter((_, index) => index !== slot);
                  return next.length > 0 ? next : [""];
                });
              }}
              aria-label={`Remove field ${slot + 1}`}
            >
              ×
            </button>
          ) : null}
        </div>

        <label className="editorial-label">
          Value
          <Select
            value={values[column] || NONE}
            onValueChange={(value) => {
              onTouched?.();
              setValues((current) => ({ ...current, [column]: value === NONE ? "" : value }));
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
  };

  const renderFilterSlots = (
    columns: string[],
    setColumns: Dispatch<SetStateAction<string[]>>,
    values: Record<string, string>,
    setValues: Dispatch<SetStateAction<Record<string, string>>>,
    valueOptions: Record<string, string[]>,
    onTouched?: () => void,
  ) => (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((_, slot) =>
          renderSingleSlot(slot, columns, setColumns, values, setValues, valueOptions, onTouched),
        )}
      </div>

      {columns.length < MAX_FIELDS ? (
        <button
          type="button"
          className="editorial-button"
          onClick={() => {
            onTouched?.();
            setColumns((current) =>
              current.length >= MAX_FIELDS ? current : normalizeSlotColumns([...current, ""]),
            );
          }}
        >
          + Add field
        </button>
      ) : null}
    </div>
  );

  const renderComparePlaceholder = (groupLabel: "Group A" | "Group B", slot: number) => (
    <div
      key={`${groupLabel}-placeholder-${slot}`}
      className="space-y-2 border border-dashed border-[var(--rule-light)] bg-[var(--paper)] p-3"
    >
      <p className="editorial-label">Field {slot + 1}</p>
      <p className="mono-value text-[0.68rem] text-[var(--ink-faded)]">
        {groupLabel} has no field in this row.
      </p>
    </div>
  );

  const renderCompareSlots = () => {
    const totalRows = Math.max(columnsA.length, columnsB.length);
    return (
      <div className="space-y-3">
        {Array.from({ length: totalRows }, (_, slot) => (
          <div key={`compare-row-${slot}`} className="grid grid-cols-2 gap-6">
            {slot < columnsA.length
              ? renderSingleSlot(slot, columnsA, setColumnsA, valuesA, setValuesA, valueOptionsA, () => {
                  setTouchedA(true);
                })
              : renderComparePlaceholder("Group A", slot)}

            {slot < columnsB.length
              ? renderSingleSlot(slot, columnsB, setColumnsB, valuesB, setValuesB, valueOptionsB, () => {
                  setTouchedB(true);
                })
              : renderComparePlaceholder("Group B", slot)}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-6">
          <div>
            {columnsA.length < MAX_FIELDS ? (
              <button
                type="button"
                className="editorial-button"
                onClick={() => {
                  setTouchedA(true);
                  setColumnsA((current) =>
                    current.length >= MAX_FIELDS ? current : normalizeSlotColumns([...current, ""]),
                  );
                }}
              >
                + Add field (Group A)
              </button>
            ) : null}
          </div>
          <div>
            {columnsB.length < MAX_FIELDS ? (
              <button
                type="button"
                className="editorial-button"
                onClick={() => {
                  setTouchedB(true);
                  setColumnsB((current) =>
                    current.length >= MAX_FIELDS ? current : normalizeSlotColumns([...current, ""]),
                  );
                }}
              >
                + Add field (Group B)
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

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
                setPendingCohort(null);
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
                setPendingCohort(null);
              }}
            >
              Compare Two Groups
            </button>
          </div>

          {mode === "single" ? (
            renderFilterSlots(
              selectedColumns,
              setSelectedColumns,
              selectedValues,
              setSelectedValues,
              valueOptionsByColumn,
            )
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-6">
                <p className="mono-label text-[0.75rem] uppercase tracking-[0.08em]">Group A</p>
                <p className="mono-label text-[0.75rem] uppercase tracking-[0.08em]">Group B</p>
              </div>
              {renderCompareSlots()}
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

          <Dialog
            open={pendingCohort != null}
            onOpenChange={(open) => {
              if (!open) setPendingCohort(null);
            }}
          >
            <DialogContent>
              <div className="space-y-4">
                <DialogTitle>Replace Group A or Group B?</DialogTitle>
                <p className="text-[0.82rem] leading-relaxed text-[var(--ink-faded)]">
                  Both groups already have selections. Choose which group this preset should replace.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      if (!pendingCohort) return;
                      applyCohortToGroupA(pendingCohort);
                      setPendingCohort(null);
                    }}
                  >
                    Replace A
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      if (!pendingCohort) return;
                      applyCohortToGroupB(pendingCohort);
                      setPendingCohort(null);
                    }}
                  >
                    Replace B
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPendingCohort(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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

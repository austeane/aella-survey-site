import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { ColumnCombobox } from "@/components/column-combobox";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { SimpleLineChart } from "@/components/charts/line-chart";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { SectionHeader } from "@/components/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SchemaData } from "@/lib/api/contracts";
import { getSchema } from "@/lib/client/api";
import { useDuckDB } from "@/lib/duckdb/provider";
import { quoteIdentifier } from "@/lib/duckdb/sql-helpers";
import { useDuckDBQuery } from "@/lib/duckdb/use-query";
import {
  CHART_PRESETS,
  DEFAULTS_BY_PAGE,
  QUESTION_CARDS,
  type ChartPreset,
} from "@/lib/chart-presets";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/")({
  validateSearch: (search): { chart?: string } => ({
    chart: typeof search.chart === "string" ? search.chart : undefined,
  }),
  component: HomePage,
});

type DataRow = Record<string, unknown>;

type BuilderType = "bar" | "line";

const BUILDER_TYPES: Array<{ value: BuilderType; label: string }> = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
];

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toCount(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  return toNumber(value);
}

function rowsToObjects(data: { columns: string[]; rows: unknown[][] } | null): DataRow[] {
  if (!data) return [];

  return data.rows.map((row) => {
    const record: DataRow = {};
    data.columns.forEach((column, index) => {
      record[column] = row[index] ?? null;
    });
    return record;
  });
}

function HomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const { phase } = useDuckDB();

  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [buildX, setBuildX] = useState("");
  const [buildY, setBuildY] = useState("");
  const [buildType, setBuildType] = useState<BuilderType>("bar");

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) return;

        const nextSchema = response.data;
        setSchema(nextSchema);

        const defaults = DEFAULTS_BY_PAGE.explore;
        const fallbackX = nextSchema.columns.find((column) => column.name === "politics")?.name
          ?? nextSchema.columns.find((column) => column.name === defaults?.x)?.name
          ?? nextSchema.columns.find((column) => column.name === "straightness")?.name
          ?? nextSchema.columns[0]?.name
          ?? "";
        const fallbackY = nextSchema.columns.find((column) => column.name === "opennessvariable")?.name
          ?? nextSchema.columns.find((column) => column.name === defaults?.y)?.name
          ?? nextSchema.columns.find((column) => column.name === "politics")?.name
          ?? nextSchema.columns[1]?.name
          ?? "";

        setBuildX((current) => current || fallbackX);
        setBuildY((current) => current || fallbackY);
      })
      .catch((error: Error) => {
        if (!cancelled) setSchemaError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPreset = useMemo(() => {
    const byId = CHART_PRESETS.find((preset) => preset.id === search.chart);
    return byId ?? CHART_PRESETS[0] ?? null;
  }, [search.chart]);

  useEffect(() => {
    if (!selectedPreset) return;
    if (search.chart === selectedPreset.id) return;

    void navigate({
      search: { chart: selectedPreset.id },
      replace: true,
    });
  }, [search.chart, selectedPreset, navigate]);

  const featuredQuery = useDuckDBQuery(selectedPreset?.sql ?? null);
  const featuredRows = useMemo(() => rowsToObjects(featuredQuery.data), [featuredQuery.data]);
  const [lastFeaturedRows, setLastFeaturedRows] = useState<DataRow[]>([]);

  useEffect(() => {
    if (featuredQuery.loading || featuredQuery.error) return;
    setLastFeaturedRows(featuredRows);
  }, [featuredQuery.loading, featuredQuery.error, featuredRows]);

  const featuredSampleSql = useMemo(() => {
    if (!selectedPreset) return null;

    const xQuoted = quoteIdentifier(selectedPreset.exploreX);
    const yQuoted = quoteIdentifier(selectedPreset.exploreY);

    return `
      SELECT count(*)::BIGINT AS n
      FROM data
      WHERE ${xQuoted} IS NOT NULL
        AND ${yQuoted} IS NOT NULL
    `;
  }, [selectedPreset]);
  const featuredSampleQuery = useDuckDBQuery(featuredSampleSql);
  const featuredSampleSize = useMemo(
    () => toCount(featuredSampleQuery.data?.rows[0]?.[0]),
    [featuredSampleQuery.data],
  );

  const buildXMeta = useMemo(
    () => schema?.columns.find((column) => column.name === buildX) ?? null,
    [schema, buildX],
  );
  const buildYMeta = useMemo(
    () => schema?.columns.find((column) => column.name === buildY) ?? null,
    [schema, buildY],
  );

  const buildSql = useMemo(() => {
    if (!buildX || !buildY || !buildXMeta || !buildYMeta) return null;

    const xQuoted = quoteIdentifier(buildX);
    const yQuoted = quoteIdentifier(buildY);

    if (buildYMeta.logicalType === "numeric") {
      return `
        SELECT
          cast(${xQuoted} AS VARCHAR) AS name,
          round(avg(cast(${yQuoted} AS DOUBLE))::DOUBLE, 3) AS value,
          count(*)::BIGINT AS answered_count
        FROM data
        WHERE ${xQuoted} IS NOT NULL
          AND ${yQuoted} IS NOT NULL
        GROUP BY 1
        ORDER BY value DESC
        LIMIT 20
      `;
    }

    return `
      SELECT
        cast(${xQuoted} AS VARCHAR) AS name,
        count(*)::BIGINT AS value
      FROM data
      WHERE ${xQuoted} IS NOT NULL
        AND ${yQuoted} IS NOT NULL
      GROUP BY 1
      ORDER BY value DESC
      LIMIT 20
    `;
  }, [buildX, buildY, buildXMeta, buildYMeta]);

  const buildQuery = useDuckDBQuery(buildSql);
  const buildRows = useMemo(() => {
    const objects = rowsToObjects(buildQuery.data)
      .map((row) => ({
        name: String(row.name ?? "Unknown"),
        value: toNumber(row.value),
      }))
      .filter((row) => Number.isFinite(row.value));

    if (buildType === "line") {
      const allNumeric = objects.every((row) => Number.isFinite(Number(row.name)));
      if (allNumeric) {
        return [...objects].sort((left, right) => Number(left.name) - Number(right.name));
      }
      return [...objects].sort((left, right) => left.name.localeCompare(right.name));
    }

    return objects;
  }, [buildQuery.data, buildType]);

  const renderFeaturedChart = (preset: ChartPreset, rows: DataRow[]) => {
    if (preset.chartType === "grouped-bar") {
      return (
        <GroupedBarChart
          data={rows}
          series={preset.series ?? []}
          xLabel={preset.xLabel}
          yLabel={preset.yLabel}
        />
      );
    }

    const points = rows.map((row) => ({
      name: String(row.name ?? "Unknown"),
      value: toNumber(row.value),
    }));

    if (preset.chartType === "line") {
      const sorted = [...points].sort((left, right) => Number(left.name) - Number(right.name));
      return <SimpleLineChart data={sorted} xLabel={preset.xLabel} yLabel={preset.yLabel} />;
    }

    return <SimpleBarChart data={points} xLabel={preset.xLabel} yLabel={preset.yLabel} />;
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">The Big Kink Survey</h1>
        <p className="page-subtitle">
          What ~970,000 people were asked — and what 15,000 answers revealed about desire, personality, and identity.
        </p>
        <p className="dateline">
          Based on 15,503 anonymized responses from a{" "}
          <a
            href="https://aella.substack.com/p/heres-my-big-kink-survey-dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
          >
            ~970,000-respondent survey
          </a>.
        </p>
      </header>

      {schemaError ? <section className="alert alert--error">Failed to load schema: {schemaError}</section> : null}

      {selectedPreset ? (
        <section className="raised-panel space-y-4" aria-labelledby="featured-chart-heading">
          <SectionHeader number="01" title="What the data shows" />

          <p className="mono-label">Pick a finding</p>

          <div role="tablist" aria-label="Featured findings" className="flex flex-wrap gap-2">
            {CHART_PRESETS.map((preset) => {
              const selected = preset.id === selectedPreset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="featured-chart-panel"
                  className={`editorial-button ${selected ? "editorial-button--filled" : ""}`}
                  onClick={() => {
                    void navigate({ search: { chart: preset.id }, replace: true });
                  }}
                >
                  {preset.shortTitle}
                </button>
              );
            })}
          </div>

          <article id="featured-chart-panel" className="editorial-panel space-y-4">
            <div>
              <p className="mono-label">Question</p>
              <h2 id="featured-chart-heading" className="mt-1 text-[1.35rem] leading-tight font-['Fraunces',Georgia,serif]">
                {selectedPreset.question}
              </h2>
            </div>

            {featuredQuery.loading && lastFeaturedRows.length === 0 ? (
              <LoadingSkeleton variant="panel" phase={phase} title="Loading featured chart..." />
            ) : null}

            {featuredQuery.error ? <p className="alert alert--error">{featuredQuery.error}</p> : null}

            {!featuredQuery.error ? (
              <>
                <div className={`h-[360px] w-full transition-opacity ${featuredQuery.loading ? "opacity-70" : "opacity-100"}`}>
                  {renderFeaturedChart(
                    selectedPreset,
                    featuredQuery.loading && lastFeaturedRows.length > 0 ? lastFeaturedRows : featuredRows,
                  )}
                </div>
                {featuredQuery.loading && lastFeaturedRows.length > 0 ? (
                  <p className="mono-value text-[var(--ink-faded)]">Updating chart...</p>
                ) : null}
              </>
            ) : null}

            <div className="space-y-2">
              <p>{selectedPreset.caption}</p>
              {!featuredSampleQuery.loading && featuredSampleSize > 0 ? (
                <p className="mono-value text-[var(--ink-faded)]">Sample size: N = {formatNumber(featuredSampleSize)}</p>
              ) : null}
              {selectedPreset.wave2 ? (
                <p className="mono-value text-[var(--ink-faded)]">
                  Confidence: {selectedPreset.wave2.evidenceTier === "robust" ? "high" : selectedPreset.wave2.evidenceTier === "supported" ? "moderate" : selectedPreset.wave2.evidenceTier === "tiny" ? "low" : "preliminary"}.
                </p>
              ) : null}
            </div>

            <Link
              to="/explore"
              search={{ x: selectedPreset.exploreX, y: selectedPreset.exploreY }}
              className="editorial-button"
            >
              Explore this further
            </Link>
          </article>
        </section>
      ) : null}

      <section className="editorial-panel space-y-4">
        <SectionHeader number="02" title="Build your own chart" />
        <p>Choose two questions and see a quick comparison.</p>

        {schema ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="editorial-label">
                X question
                <ColumnCombobox
                  columns={schema.columns}
                  value={buildX}
                  onValueChange={setBuildX}
                  placeholder="Choose X"
                />
              </label>

              <label className="editorial-label">
                Y question
                <ColumnCombobox
                  columns={schema.columns}
                  value={buildY}
                  onValueChange={setBuildY}
                  placeholder="Choose Y"
                />
              </label>

              <label className="editorial-label">
                Chart type
                <Select value={buildType} onValueChange={(value) => setBuildType(value as BuilderType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDER_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            {buildQuery.loading ? (
              <LoadingSkeleton variant="panel" phase={phase} title="Running chart query..." />
            ) : null}
            {buildQuery.error ? <p className="alert alert--error">{buildQuery.error}</p> : null}

            {!buildQuery.loading && !buildQuery.error ? (
              <div className="h-[320px] w-full border border-[var(--rule)] bg-[var(--paper)] p-2">
                {buildType === "line" ? (
                  <SimpleLineChart
                    data={buildRows}
                    xLabel={buildXMeta?.displayName ?? buildX}
                    yLabel={buildYMeta?.displayName ?? buildY}
                    height={300}
                  />
                ) : (
                  <SimpleBarChart
                    data={buildRows}
                    xLabel={buildXMeta?.displayName ?? buildX}
                    yLabel={buildYMeta?.displayName ?? buildY}
                    height={300}
                  />
                )}
              </div>
            ) : null}

            <Link to="/explore" search={{ x: buildX || undefined, y: buildY || undefined }} className="editorial-button">
              Open this in Explore
            </Link>
          </>
        ) : (
          <LoadingSkeleton variant="panel" phase={phase} title="Loading columns for chart builder..." />
        )}
      </section>

      <section className="editorial-panel space-y-4">
        <SectionHeader number="03" title="Questions you can explore" />
        <div className="grid gap-3 md:grid-cols-2">
          {QUESTION_CARDS.map((card, index) => {
            const featuredCard = index < 2;

            return (
              <article
                key={card.prompt}
                className={`border p-3 ${featuredCard ? "border-[var(--ink)] bg-[var(--paper-warm)]" : "border-[var(--rule)] bg-[var(--paper)]"}`}
              >
                {featuredCard ? <p className="mono-label text-[var(--accent)]">Popular</p> : null}
                <p>{card.prompt}</p>
                {card.presetId ? (
                  <Link to="/" search={{ chart: card.presetId }} className="editorial-button mt-3 inline-flex">
                    Open chart
                  </Link>
                ) : card.deepLink ? (
                  <Link to={card.deepLink} className="editorial-button mt-3 inline-flex">
                    Open page
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="editorial-panel space-y-4">
        <SectionHeader number="04" title="About the Data" />
        <p>
          The original survey collected ~970,000 responses. This public dataset is a 15,503-respondent anonymized
          subsample — limited to ages 18–32 in Western countries, with noise injection and binning to protect privacy.
          Use patterns directionally rather than as exact population estimates.
        </p>
        <p className="mono-value text-[var(--ink-faded)]">
          Tip: use Data Quality to see which questions have missing answers before making strong claims.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/data-quality" className="editorial-button">
            Open Data Quality
          </Link>
          <a
            href="https://aella.substack.com/p/heres-my-big-kink-survey-dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="editorial-button"
          >
            Read about the dataset
          </a>
          <a
            href="https://www.guidedtrack.com/programs/u4m797m/run"
            target="_blank"
            rel="noopener noreferrer"
            className="editorial-button"
          >
            Take the survey
          </a>
        </div>
      </section>
    </div>
  );
}

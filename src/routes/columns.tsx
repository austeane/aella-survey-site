import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { ColumnInspector } from "@/components/column-inspector";
import { MissingnessBadge } from "@/components/missingness-badge";
import { SectionHeader } from "@/components/section-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SchemaData } from "@/lib/api/contracts";
import { getSchema } from "@/lib/client/api";
import { DEFAULTS_BY_PAGE } from "@/lib/chart-presets";
import { getColumnDisplayName, getColumnTooltip, stripHashSuffix } from "@/lib/format-labels";
import { formatNumber, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/columns")({
  validateSearch: (search) => ({
    column: typeof search.column === "string" ? search.column : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    tags: typeof search.tags === "string" ? search.tags : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
  }),
  component: ColumnsPage,
});

type SortMode =
  | "interestingness"
  | "name"
  | "null_low"
  | "null_high"
  | "cardinality_low"
  | "cardinality_high";

const TAG_OPTIONS = [
  { value: "demographic", label: "Demographics" },
  { value: "ocean", label: "Personality (Big Five)" },
  { value: "fetish", label: "Kinks and interests" },
  { value: "derived", label: "Computed scores" },
  { value: "other", label: "Other" },
] as const;
const LOGICAL_TYPE_LABELS: Record<string, string> = {
  categorical: "Multiple choice",
  numeric: "Number",
  boolean: "Yes/No",
  text: "Text",
  unknown: "Unspecified",
};
const DEFAULT_COLUMNS_SORT = (DEFAULTS_BY_PAGE.columns?.sort as SortMode | undefined) ?? "interestingness";
const INTERESTING_COLUMNS = DEFAULTS_BY_PAGE.columns?.interestingColumns ?? [];

function ColumnsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(search.q ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    search.tags ? search.tags.split(",").filter(Boolean) : [],
  );
  const [sortMode, setSortMode] = useState<SortMode>(
    (search.sort as SortMode) ?? DEFAULT_COLUMNS_SORT,
  );
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(
    search.column ?? null,
  );

  useEffect(() => {
    void navigate({
      to: "/columns",
      search: {
        column: selectedColumnName || undefined,
        q: searchTerm || undefined,
        tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
        sort: sortMode !== DEFAULT_COLUMNS_SORT ? sortMode : undefined,
      },
      replace: true,
    });
  }, [selectedColumnName, searchTerm, selectedTags, sortMode, navigate]);

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) return;
        setSchema(response.data);
        if (!selectedColumnName) {
          setSelectedColumnName(response.data.columns[0]?.name ?? null);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) setSchemaError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredColumns = useMemo(() => {
    if (!schema) return [];

    const term = searchTerm.trim().toLowerCase();

    const filtered = schema.columns.filter((column) => {
      const displayName = getColumnDisplayName(column).toLowerCase();
      const matchesTerm = term.length === 0 || column.name.toLowerCase().includes(term) || displayName.includes(term);
      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => column.tags.includes(tag as typeof column.tags[number]));
      return matchesTerm && matchesTags;
    });

    const sorted = [...filtered];
    const interestingOrder = new Map(INTERESTING_COLUMNS.map((name, index) => [name, index]));
    sorted.sort((left, right) => {
      switch (sortMode) {
        case "interestingness": {
          const leftRank = interestingOrder.get(left.name);
          const rightRank = interestingOrder.get(right.name);
          if (leftRank != null && rightRank != null) return leftRank - rightRank;
          if (leftRank != null) return -1;
          if (rightRank != null) return 1;
          if (left.nullRatio !== right.nullRatio) return left.nullRatio - right.nullRatio;
          return left.approxCardinality - right.approxCardinality;
        }
        case "null_low":
          return left.nullRatio - right.nullRatio;
        case "null_high":
          return right.nullRatio - left.nullRatio;
        case "cardinality_low":
          return left.approxCardinality - right.approxCardinality;
        case "cardinality_high":
          return right.approxCardinality - left.approxCardinality;
        case "name":
        default:
          return left.name.localeCompare(right.name);
      }
    });

    return sorted;
  }, [schema, searchTerm, selectedTags, sortMode]);

  const selectedColumn = useMemo(() => {
    if (!schema || !selectedColumnName) return null;
    return schema.columns.find((column) => column.name === selectedColumnName) ?? null;
  }, [schema, selectedColumnName]);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Browse Topics</h1>
        <p className="page-subtitle">Search, filter, and sort survey questions. Pick one to inspect answer patterns and data notes.</p>
      </header>

      {schemaError ? <section className="alert alert--error">Failed to load schema: {schemaError}</section> : null}

      <section className="grid gap-8 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="editorial-panel space-y-4">
          <SectionHeader number="01" title="Topics" />

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="editorial-label">
              Search questions
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Type a question or keyword"
              />
            </label>

            <label className="editorial-label">
              Sort
              <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interestingness">Interesting starter questions</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="null_low">Least missing answers</SelectItem>
                  <SelectItem value="null_high">Most missing answers</SelectItem>
                  <SelectItem value="cardinality_low">Fewest answer choices</SelectItem>
                  <SelectItem value="cardinality_high">Most answer choices</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <div>
            <p className="mono-label">Topic filters</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TAG_OPTIONS.map((tag) => {
                const checked = selectedTags.includes(tag.value);
                return (
                  <label key={tag.value} className="flex items-center gap-2 border border-[var(--rule)] bg-[var(--paper)] px-2 py-1.5">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        if (value === true) {
                          setSelectedTags((current) => [...current, tag.value]);
                        } else {
                          setSelectedTags((current) => current.filter((item) => item !== tag.value));
                        }
                      }}
                    />
                    <span className="mono-value">{tag.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <p className="mono-value text-[var(--ink-faded)]">Showing {formatNumber(filteredColumns.length)} questions</p>

          <ScrollArea className="max-h-[calc(100vh-380px)] min-h-[300px] border border-[var(--rule)]">
            {filteredColumns.map((column) => {
              const active = column.name === selectedColumnName;

              return (
                <button
                  key={column.name}
                  type="button"
                  className={`w-full border-b border-[var(--rule-light)] px-3 py-2 text-left ${
                    active ? "bg-[var(--paper-warm)]" : "bg-[var(--paper)]"
                  }`}
                  onClick={() => setSelectedColumnName(column.name)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="mono-value text-[var(--ink)]" title={getColumnTooltip(column)}>{getColumnDisplayName(column)}</span>
                      {column.displayName ? <p className="mono-value text-[var(--ink-faded)]">{stripHashSuffix(column.name)}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="null-badge">{LOGICAL_TYPE_LABELS[column.logicalType] ?? column.logicalType}</span>
                      {column.nullMeaning && column.nullMeaning !== "UNKNOWN" ? <MissingnessBadge meaning={column.nullMeaning} /> : null}
                    </div>
                  </div>
                  <div className="mt-1 grid gap-2 md:grid-cols-[1fr,auto,auto] md:items-end">
                    <div>
                      <p className="mono-value text-[var(--ink-faded)]">Missing answers: {formatPercent(column.nullRatio * 100, 1)}</p>
                      <div className="inline-ratio">
                        <span style={{ width: `${Math.max(0, Math.min(100, column.nullRatio * 100))}%` }} />
                      </div>
                    </div>
                    <p className="mono-value text-[var(--ink-faded)]">Answer choices: {formatNumber(column.approxCardinality)}</p>
                    <p className="mono-value text-[var(--ink-faded)]">Data notes: {column.caveatKeys.length}</p>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <ColumnInspector column={selectedColumn} allColumns={schema?.columns ?? []} />
        </div>
      </section>
    </div>
  );
}

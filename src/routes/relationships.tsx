import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { ColumnCombobox } from "@/components/column-combobox";
import { SectionHeader } from "@/components/section-header";
import { getColumnDisplayName } from "@/lib/format-labels";
import { formatNumber } from "@/lib/format";
import schemaMetadata from "@/lib/schema/columns.generated.json";
import relationshipData from "@/lib/schema/relationships.generated.json";

export const Route = createFileRoute("/relationships")({
  validateSearch: (search): { column?: string } => ({
    column: typeof search.column === "string" ? search.column : undefined,
  }),
  component: RelationshipsPage,
});

type Relationship = {
  column: string;
  metric: string;
  value: number;
  n: number;
};

type RelationshipData = {
  generatedAt: string;
  columnCount: number;
  pairCount: number;
  relationships: Record<string, Relationship[]>;
};

const data = relationshipData as RelationshipData;
const schemaColumns = (schemaMetadata as { columns: Array<{ name: string; displayName?: string }> }).columns;
const schemaByName = new Map(schemaColumns.map((column) => [column.name, column]));

const columnNames = Object.keys(data.relationships).sort((a, b) =>
  a.localeCompare(b)
);

function strengthLabel(value: number): string {
  if (value < 0.1) return "negligible";
  if (value < 0.3) return "weak";
  if (value < 0.5) return "moderate";
  return "strong";
}

function metricLabel(metric: string): string {
  if (metric === "cramers_v") return "Cramer\u2019s V";
  if (metric === "correlation") return "Correlation";
  return metric;
}

function RelationshipsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/relationships" });
  const [selectedColumn, setSelectedColumn] = useState(
    search.column && columnNames.includes(search.column) ? search.column : columnNames[0] ?? "",
  );

  useEffect(() => {
    void navigate({
      search: { column: selectedColumn || undefined },
      replace: true,
    });
  }, [selectedColumn, navigate]);

  const columnOptions = useMemo(
    () =>
      columnNames.map((name) => {
        const column = schemaByName.get(name);
        return {
          name,
          displayName: column ? getColumnDisplayName(column) : name,
        };
      }),
    [],
  );

  const relationships = useMemo(() => {
    if (!selectedColumn) return [];
    return data.relationships[selectedColumn] ?? [];
  }, [selectedColumn]);

  const maxValue = useMemo(() => {
    if (relationships.length === 0) return 1;
    return Math.max(...relationships.map((r) => r.value));
  }, [relationships]);

  const selectedColumnDisplayName = useMemo(() => {
    const column = schemaByName.get(selectedColumn);
    return column ? getColumnDisplayName(column) : selectedColumn;
  }, [selectedColumn]);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Relationship Finder</h1>
        <p className="page-subtitle">
          Precomputed pairwise associations between survey columns.
          Categorical pairs use Cramer&rsquo;s V; numeric pairs use Pearson
          correlation.
        </p>
        <p className="dateline">
          {formatNumber(data.columnCount)} columns &middot;{" "}
          {formatNumber(data.pairCount)} relationships
        </p>
      </header>

      <section className="raised-panel space-y-4">
        <SectionHeader number="01" title="Target Column" />

        <label className="editorial-label">
          Select a column to see its strongest associations
          <ColumnCombobox
            columns={columnOptions}
            value={selectedColumn}
            onValueChange={setSelectedColumn}
            placeholder="Choose a column"
          />
        </label>
      </section>

      <section className="editorial-panel space-y-4">
        <SectionHeader
          number="02"
          title="Top Related Columns"
          subtitle={
            relationships.length > 0
              ? `${relationships.length} associations for "${selectedColumnDisplayName}"`
              : "No associations found for this column"
          }
        />

        {relationships.length > 0 ? (
          <div className="editorial-table-wrap">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Related Column</th>
                  <th>Metric</th>
                  <th className="numeric">Strength</th>
                  <th>Label</th>
                  <th className="numeric">N</th>
                  <th style={{ width: "120px" }}>Strength</th>
                </tr>
              </thead>
              <tbody>
                {relationships.map((rel) => {
                  const label = strengthLabel(rel.value);
                  const barWidth =
                    maxValue > 0 ? (rel.value / maxValue) * 100 : 0;

                  return (
                    <tr key={rel.column}>
                      <td>
                        <div className="space-y-1">
                        <Link
                          to="/explore"
                          search={{ x: selectedColumn, y: rel.column }}
                          className="mono-value"
                          style={{
                            color: "var(--accent)",
                            borderBottom: "1px solid var(--rule-light)",
                          }}
                        >
                          {getColumnDisplayName(schemaByName.get(rel.column) ?? { name: rel.column })}
                        </Link>
                        <p className="mono-value text-[var(--ink-faded)]">{rel.column}</p>
                        </div>
                      </td>
                      <td>
                        <span className="null-badge">
                          {metricLabel(rel.metric)}
                        </span>
                      </td>
                      <td className="numeric">
                        <span className="mono-value">
                          {rel.value.toFixed(4)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="null-badge"
                          style={
                            label === "strong"
                              ? {
                                  borderColor: "var(--accent)",
                                  color: "var(--accent)",
                                }
                              : label === "moderate"
                                ? {
                                    borderColor: "#8f5a2b",
                                    color: "#8f5a2b",
                                  }
                                : undefined
                          }
                        >
                          {label}
                        </span>
                      </td>
                      <td className="numeric">
                        <span className="mono-value">
                          {formatNumber(rel.n)}
                        </span>
                      </td>
                      <td>
                        <div className="inline-ratio">
                          <span
                            style={{
                              width: `${barWidth}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="section-subtitle">
            Select a column above to view its relationships.
          </p>
        )}
      </section>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/format";
import relationshipData from "@/lib/schema/relationships.generated.json";

export const Route = createFileRoute("/relationships")({
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
  const [selectedColumn, setSelectedColumn] = useState(columnNames[0] ?? "");

  const relationships = useMemo(() => {
    if (!selectedColumn) return [];
    return data.relationships[selectedColumn] ?? [];
  }, [selectedColumn]);

  const maxValue = useMemo(() => {
    if (relationships.length === 0) return 1;
    return Math.max(...relationships.map((r) => r.value));
  }, [relationships]);

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
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a column" />
            </SelectTrigger>
            <SelectContent>
              {columnNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </section>

      <section className="editorial-panel space-y-4">
        <SectionHeader
          number="02"
          title="Top Related Columns"
          subtitle={
            relationships.length > 0
              ? `${relationships.length} associations for "${selectedColumn}"`
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
                        <Link
                          to="/explore"
                          search={{ x: selectedColumn, y: rel.column }}
                          className="mono-value"
                          style={{
                            color: "var(--accent)",
                            borderBottom: "1px solid var(--rule-light)",
                          }}
                        >
                          {rel.column}
                        </Link>
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

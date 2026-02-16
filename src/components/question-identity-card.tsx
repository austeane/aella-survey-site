import { formatNumber, formatPercent } from "@/lib/format";
import { formatValueWithLabel, getColumnDisplayName } from "@/lib/format-labels";

interface QuestionLike {
  name: string;
  displayName?: string;
  logicalType?: string;
  tags?: string[];
  nullRatio?: number;
  valueLabels?: Record<string, string>;
  approxTopValues?: string[];
}

interface QuestionIdentityCardProps {
  column: QuestionLike;
  datasetRowCount?: number;
  responseCount?: number;
  valueLabels?: Record<string, string>;
}

export function QuestionIdentityCard({
  column,
  datasetRowCount,
  responseCount,
  valueLabels,
}: QuestionIdentityCardProps) {
  const estimatedResponses =
    responseCount ??
    (datasetRowCount != null && Number.isFinite(column.nullRatio)
      ? Math.round(datasetRowCount * (1 - (column.nullRatio ?? 0)))
      : null);

  const topValues = (column.approxTopValues ?? []).slice(0, 5);

  return (
    <section className="raised-panel space-y-3">
      <header className="space-y-1">
        <p className="mono-label">Question identity</p>
        <h3 className="text-[1.25rem] leading-tight font-['Fraunces',Georgia,serif] text-[var(--ink)]">
          {getColumnDisplayName(column)}
        </h3>
        <p className="mono-value text-[0.67rem] text-[var(--ink-faded)] break-all">{column.name}</p>
      </header>

      <div className="grid gap-2 md:grid-cols-3">
        <p className="mono-value text-[0.68rem] text-[var(--ink-faded)]">
          type: <span className="text-[var(--ink)]">{column.logicalType ?? "unknown"}</span>
        </p>
        <p className="mono-value text-[0.68rem] text-[var(--ink-faded)]">
          responses: <span className="text-[var(--ink)]">{estimatedResponses != null ? formatNumber(estimatedResponses) : "n/a"}</span>
        </p>
        <p className="mono-value text-[0.68rem] text-[var(--ink-faded)]">
          null ratio: <span className="text-[var(--ink)]">{column.nullRatio != null ? formatPercent((column.nullRatio ?? 0) * 100, 1) : "n/a"}</span>
        </p>
      </div>

      {topValues.length > 0 ? (
        <div className="space-y-1">
          <p className="mono-label">Top answers</p>
          <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[0.72rem] text-[var(--ink-faded)]">
            {topValues
              .map((value) => formatValueWithLabel(value, valueLabels ?? column.valueLabels))
              .join(" · ")}
          </p>
        </div>
      ) : null}

      {column.tags && column.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {column.tags.map((tag) => (
            <span key={tag} className="null-badge">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

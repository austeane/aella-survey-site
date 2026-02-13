import { formatNumber } from "@/lib/format";

interface SampleSizeDisplayProps {
  total: number;
  nonNull?: number;
  used?: number;
  className?: string;
}

export function SampleSizeDisplay({ total, nonNull, used, className }: SampleSizeDisplayProps) {
  return (
    <div className={`sample-size ${className ?? ""}`.trim()}>
      <span className="sample-size-item">N total: {formatNumber(total)}</span>
      {typeof nonNull === "number" ? (
        <span className="sample-size-item">N non-null: {formatNumber(nonNull)}</span>
      ) : null}
      {typeof used === "number" ? (
        <span className="sample-size-item">N used: {formatNumber(used)}</span>
      ) : null}
    </div>
  );
}

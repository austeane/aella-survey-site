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
      <span className="sample-size-item">People total: {formatNumber(total)}</span>
      {typeof nonNull === "number" ? (
        <span className="sample-size-item">People who answered: {formatNumber(nonNull)}</span>
      ) : null}
      {typeof used === "number" ? (
        <span className="sample-size-item">People used: {formatNumber(used)}</span>
      ) : null}
    </div>
  );
}

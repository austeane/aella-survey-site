import { formatNumber } from "@/lib/format";

interface SampleSizeDisplayProps {
  total: number;
  nonNull?: number;
  used?: number;
  className?: string;
}

export function SampleSizeDisplay({ total, nonNull, used, className }: SampleSizeDisplayProps) {
  const nonNullValue = typeof nonNull === "number" ? nonNull : null;
  const usedValue = typeof used === "number" ? used : null;
  const showNonNull = nonNullValue != null && nonNullValue !== total;
  const showUsed = usedValue != null && usedValue !== total && (nonNullValue == null || usedValue !== nonNullValue);

  return (
    <div className={`sample-size ${className ?? ""}`.trim()}>
      <span className="sample-size-item">People total: {formatNumber(total)}</span>
      {showNonNull ? (
        <span className="sample-size-item">People who answered: {formatNumber(nonNullValue as number)}</span>
      ) : null}
      {showUsed ? (
        <span className="sample-size-item">People used: {formatNumber(usedValue as number)}</span>
      ) : null}
    </div>
  );
}

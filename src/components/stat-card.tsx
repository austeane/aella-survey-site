import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, note, className }: StatCardProps) {
  return (
    <div className={`stat-cell ${className ?? ""}`.trim()}>
      <p className="stat-cell-label">{label}</p>
      <p className="stat-cell-value">{value}</p>
      {note ? <p className="stat-cell-note">{note}</p> : null}
    </div>
  );
}

import type { ReactNode } from "react";

interface SectionHeaderProps {
  number: string;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

export function SectionHeader({ number, title, subtitle, className }: SectionHeaderProps) {
  return (
    <header className={className}>
      <h2 className="section-header">
        <span className="section-number">{number}</span>
        <span>{title}</span>
      </h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </header>
  );
}

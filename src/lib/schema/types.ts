export type LogicalType = "categorical" | "numeric" | "boolean" | "text" | "unknown";

export type CategoryTag = "demographic" | "ocean" | "fetish" | "derived" | "other";

export type NullMeaning = "GATED" | "LATE_ADDED" | "NOT_APPLICABLE" | "UNKNOWN";

export interface ColumnMetadata {
  name: string;
  displayName?: string;
  duckdbType: string;
  logicalType: LogicalType;
  nullRatio: number;
  approxCardinality: number;
  tags: CategoryTag[];
  nullMeaning?: NullMeaning;
  valueLabels?: Record<string, string>;
}

export interface DatasetMetadata {
  name: string;
  sourcePath: string;
  generatedAt: string;
  rowCount: number;
  columnCount: number;
}

export interface SchemaMetadata {
  dataset: DatasetMetadata;
  columns: ColumnMetadata[];
}

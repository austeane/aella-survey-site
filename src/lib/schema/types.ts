export type LogicalType = "categorical" | "numeric" | "boolean" | "text" | "unknown";

export type CategoryTag = "demographic" | "ocean" | "fetish" | "derived" | "other";

export interface ColumnMetadata {
  name: string;
  duckdbType: string;
  logicalType: LogicalType;
  nullRatio: number;
  approxCardinality: number;
  tags: CategoryTag[];
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

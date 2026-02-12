import rawSchemaMetadata from "./columns.generated.json";
import { getCaveatKeysForColumn } from "./caveats";
import type { ColumnMetadata, SchemaMetadata } from "./types";

const schemaMetadata = rawSchemaMetadata as SchemaMetadata;

const columnByName = new Map<string, ColumnMetadata>(
  schemaMetadata.columns.map((column) => [column.name, column]),
);

export function getSchemaMetadata(): SchemaMetadata {
  return schemaMetadata;
}

export function getColumnMetadata(columnName: string): ColumnMetadata | undefined {
  return columnByName.get(columnName);
}

export function listColumns(): ColumnMetadata[] {
  return schemaMetadata.columns;
}

export function listColumnsWithCaveats() {
  return schemaMetadata.columns.map((column) => ({
    ...column,
    caveatKeys: getCaveatKeysForColumn(column.name),
  }));
}

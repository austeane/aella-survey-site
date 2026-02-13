import rawSchemaMetadata from "./columns.generated.json";
import { isHiddenColumn } from "./column-flags";
import { getCaveatKeysForColumn } from "./caveats";
import { inferNullMeaning } from "./null-meaning";
import type { ColumnMetadata, SchemaMetadata } from "./types";
import { getValueLabels } from "./value-labels";

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

export function listAllColumns(): ColumnMetadata[] {
  return schemaMetadata.columns;
}

export function listColumns(): ColumnMetadata[] {
  return listAllColumns().filter((column) => !isHiddenColumn(column.name));
}

export function listColumnsWithCaveats() {
  return listColumns().map((column) => {
    const caveatKeys = getCaveatKeysForColumn(column.name);
    const valueLabels = getValueLabels(column.name);

    return {
      ...column,
      ...(valueLabels ? { valueLabels } : {}),
      nullMeaning: column.nullMeaning ?? inferNullMeaning(column.name, column.nullRatio, caveatKeys),
      caveatKeys,
    };
  });
}

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  align?: "left" | "right";
  headerClassName?: string;
  cellClassName?: string;
  cell: (row: Row, index: number) => ReactNode;
}

interface DataTableProps<Row> {
  columns: Array<DataTableColumn<Row>>;
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  emptyMessage?: string;
  className?: string;
}

function getAlignClass(align: "left" | "right" | undefined): string {
  return align === "right" ? "numeric" : "";
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No rows",
  className,
}: DataTableProps<Row>) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={`${getAlignClass(column.align)} ${column.headerClassName ?? ""}`.trim()}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length}>{emptyMessage}</TableCell>
          </TableRow>
        ) : (
          rows.map((row, rowIndex) => (
            <TableRow key={rowKey(row, rowIndex)}>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={`${getAlignClass(column.align)} ${column.cellClassName ?? ""}`.trim()}
                >
                  {column.cell(row, rowIndex)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

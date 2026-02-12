import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { DEFAULT_QUERY_TIMEOUT_MS } from "./sql-guards";

const execFileAsync = promisify(execFile);
const maxBufferBytes = 24 * 1024 * 1024;
let nodeApiInstancePromise: Promise<any> | null = null;

export const DATA_TABLE_NAME = "data";

export class QueryExecutionError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "QueryExecutionError";
  }
}

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  rowObjects: Array<Record<string, unknown>>;
}

function parquetPath(): string {
  return process.env.BKS_PARQUET_PATH ?? resolve(process.cwd(), "data", "BKSPublic.parquet");
}

function parquetLiteral(): string {
  return parquetPath().replaceAll("'", "''");
}

function ensureParquetExists() {
  const sourcePath = parquetPath();
  if (!existsSync(sourcePath)) {
    throw new QueryExecutionError("PARQUET_NOT_FOUND", `Parquet file not found: ${sourcePath}`);
  }
}

function prepareSql(userSql: string): string {
  return `
    CREATE OR REPLACE TEMP VIEW ${DATA_TABLE_NAME} AS
    SELECT * FROM read_parquet('${parquetLiteral()}');

    ${userSql}
  `;
}

function normalizeValue(value: unknown): unknown {
  if (value == null) {
    return null;
  }

  if (typeof value === "bigint") {
    const numeric = Number(value);
    return Number.isSafeInteger(numeric) ? numeric : value.toString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "Infinity" || trimmed === "-Infinity" || trimmed === "NaN") {
      return null;
    }
  }

  return value;
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, normalizeValue(value)]),
  );
}

function isMissingExecutable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}

async function getNodeApiInstance() {
  if (!nodeApiInstancePromise) {
    const moduleName = "@duckdb/node-api";
    nodeApiInstancePromise = import(/* @vite-ignore */ moduleName).then((module) =>
      module.DuckDBInstance.create(":memory:"),
    );
  }

  return nodeApiInstancePromise;
}

async function executeDuckDbNodeApi(
  sql: string,
  timeoutMs: number,
): Promise<Array<Record<string, unknown>>> {
  ensureParquetExists();

  const instance = await getNodeApiInstance();
  const connection = await instance.connect();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    await connection.run(
      `CREATE OR REPLACE TEMP VIEW ${DATA_TABLE_NAME} AS SELECT * FROM read_parquet('${parquetLiteral()}')`,
    );

    const queryPromise = connection.runAndReadAll(sql).then((reader: any) =>
      reader.getRowObjectsJS() as Array<Record<string, unknown>>,
    );

    if (timeoutMs > 0) {
      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          void connection.interrupt().catch(() => {
            // no-op
          });
          reject(new QueryExecutionError("QUERY_TIMEOUT", `Query exceeded ${timeoutMs}ms timeout.`));
        }, timeoutMs);
      });

      const rows = (await Promise.race([queryPromise, timeoutPromise])) as Array<
        Record<string, unknown>
      >;
      return rows.map((row) => normalizeRow(row));
    }

    const rows: Array<Record<string, unknown>> = await queryPromise;
    return rows.map((row) => normalizeRow(row));
  } catch (error: unknown) {
    if (error instanceof QueryExecutionError) {
      throw error;
    }

    throw new QueryExecutionError(
      "QUERY_EXECUTION_FAILED",
      error instanceof Error ? error.message : "DuckDB query failed.",
    );
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
    connection.closeSync();
  }
}

async function executeDuckDbJson(sql: string, timeoutMs: number): Promise<Array<Record<string, unknown>>> {
  ensureParquetExists();

  try {
    const { stdout } = await execFileAsync(
      "duckdb",
      ["-json", ":memory:", "-c", sql],
      {
        timeout: timeoutMs,
        maxBuffer: maxBufferBytes,
      },
    );

    const trimmed = stdout.trim();
    if (!trimmed) {
      return [];
    }

    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) {
      throw new QueryExecutionError("INVALID_DUCKDB_OUTPUT", "DuckDB did not return a JSON array.");
    }

    return parsed.map((row) => normalizeRow((row ?? {}) as Record<string, unknown>));
  } catch (error: unknown) {
    if (isMissingExecutable(error)) {
      return executeDuckDbNodeApi(sql, timeoutMs);
    }

    if (error && typeof error === "object" && "code" in error && error.code === "ETIMEDOUT") {
      throw new QueryExecutionError("QUERY_TIMEOUT", `Query exceeded ${timeoutMs}ms timeout.`);
    }

    const message =
      error && typeof error === "object" && "stderr" in error && typeof error.stderr === "string"
        ? error.stderr.trim() || "DuckDB query failed."
        : error instanceof Error
          ? error.message
          : "DuckDB query failed.";

    throw new QueryExecutionError("QUERY_EXECUTION_FAILED", message);
  }
}

export async function runQuery(
  userSql: string,
  timeoutMs = DEFAULT_QUERY_TIMEOUT_MS,
): Promise<QueryResult> {
  const rowObjects = await executeDuckDbJson(prepareSql(userSql), timeoutMs);
  const columns = rowObjects.length > 0 ? Object.keys(rowObjects[0]) : [];
  const rows = rowObjects.map((row) => columns.map((column) => row[column] ?? null));

  return {
    columns,
    rows,
    rowObjects,
  };
}

export async function runSingleRow(
  userSql: string,
  timeoutMs = DEFAULT_QUERY_TIMEOUT_MS,
): Promise<Record<string, unknown>> {
  const result = await runQuery(userSql, timeoutMs);
  return result.rowObjects[0] ?? {};
}

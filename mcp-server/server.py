"""MCP server for the Big Kink Survey dataset."""

from __future__ import annotations

import os
import re
import time
from datetime import date, datetime, time as datetime_time
from decimal import Decimal
from pathlib import Path
from typing import Any

import duckdb
from duckdb import DuckDBPyConnection
from mcp.server.fastmcp import FastMCP

PARQUET_PATH = os.environ.get(
    "BKS_PARQUET_PATH",
    str(Path(__file__).parent.parent / "data" / "BKSPublic.parquet"),
)
DATA_TABLE = "data"

DEFAULT_LIMIT = int(os.environ.get("BKS_QUERY_DEFAULT_LIMIT", "1000"))
MAX_LIMIT = int(os.environ.get("BKS_QUERY_MAX_LIMIT", "10000"))
DEFAULT_TIMEOUT_MS = int(os.environ.get("BKS_QUERY_TIMEOUT_MS", "5000"))
MAX_TIMEOUT_MS = int(os.environ.get("BKS_QUERY_MAX_TIMEOUT_MS", "30000"))

DEFAULT_TOP_N = int(os.environ.get("BKS_TOP_N_DEFAULT", "20"))
MAX_TOP_N = int(os.environ.get("BKS_TOP_N_MAX", "100"))
NULL_LABEL = "<NULL>"

READ_ONLY_PREFIXES = {"SELECT", "WITH", "DESCRIBE", "EXPLAIN"}
MUTATING_KEYWORDS_RE = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|COPY|ATTACH|DETACH|INSTALL|LOAD|"
    r"CALL|TRUNCATE|VACUUM|MERGE|REPLACE|GRANT|REVOKE|COMMENT|ANALYZE)\b",
    flags=re.IGNORECASE,
)
NUMERIC_TYPE_PREFIXES = (
    "TINYINT",
    "SMALLINT",
    "INTEGER",
    "BIGINT",
    "HUGEINT",
    "UTINYINT",
    "USMALLINT",
    "UINTEGER",
    "UBIGINT",
    "FLOAT",
    "DOUBLE",
    "REAL",
    "DECIMAL",
    "NUMERIC",
)

_transport = os.environ.get("MCP_TRANSPORT", "stdio")
_mcp_kwargs: dict[str, Any] = {}
if _transport == "streamable-http":
    _mcp_kwargs["host"] = "0.0.0.0"
    _mcp_kwargs["port"] = int(os.environ.get("PORT", "8000"))

mcp = FastMCP("Big Kink Survey", **_mcp_kwargs)


def success(data: Any, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"ok": True, "data": data}
    if meta is not None:
        payload["meta"] = meta
    return payload


def failure(code: str, message: str, details: Any | None = None) -> dict[str, Any]:
    error: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return {"ok": False, "error": error}


def normalize_limit(
    limit: int | None,
    *,
    default: int = DEFAULT_LIMIT,
    maximum: int = MAX_LIMIT,
) -> int:
    if limit is None:
        limit = default
    try:
        limit_int = int(limit)
    except (TypeError, ValueError):
        limit_int = default
    return max(1, min(limit_int, maximum))


def normalize_timeout_ms(timeout_ms: int | None) -> int:
    if timeout_ms is None:
        timeout_ms = DEFAULT_TIMEOUT_MS
    try:
        timeout_int = int(timeout_ms)
    except (TypeError, ValueError):
        timeout_int = DEFAULT_TIMEOUT_MS
    return max(0, min(timeout_int, MAX_TIMEOUT_MS))


def normalize_top_n(top_n: int | None, *, default: int = DEFAULT_TOP_N) -> int:
    if top_n is None:
        top_n = default
    try:
        top_n_int = int(top_n)
    except (TypeError, ValueError):
        top_n_int = default
    return max(1, min(top_n_int, MAX_TOP_N))


def quote_ident(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def statement_type(sql: str) -> str:
    match = re.match(r"^([A-Za-z]+)", sql)
    if not match:
        return ""
    return match.group(1).upper()


def validate_read_only_sql(sql: str) -> tuple[str | None, str | None]:
    cleaned = sql.strip()
    if not cleaned:
        return None, "sql field is required"

    while cleaned.endswith(";"):
        cleaned = cleaned[:-1].rstrip()

    if ";" in cleaned:
        return None, "Only a single SQL statement is allowed"

    kind = statement_type(cleaned)
    if kind not in READ_ONLY_PREFIXES:
        allowed = ", ".join(sorted(READ_ONLY_PREFIXES))
        return None, f"Only read-only queries are allowed ({allowed})"

    if MUTATING_KEYWORDS_RE.search(cleaned):
        return None, "Mutating SQL keywords are not allowed"

    return cleaned, None


def is_numeric_type(db_type: str) -> bool:
    upper = db_type.upper()
    return upper.startswith(NUMERIC_TYPE_PREFIXES)


def is_timeout_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return "timeout" in message or "timed out" in message


def to_json_value(value: Any) -> Any:
    if isinstance(value, (datetime, date, datetime_time)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, list):
        return [to_json_value(item) for item in value]
    if isinstance(value, tuple):
        return [to_json_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): to_json_value(item) for key, item in value.items()}
    return value


def with_timeout(conn: DuckDBPyConnection, timeout_ms: int) -> bool:
    if timeout_ms <= 0:
        return False
    try:
        conn.execute(f"SET statement_timeout='{timeout_ms}ms'")
        return True
    except Exception:
        return False


def get_connection(timeout_ms: int = DEFAULT_TIMEOUT_MS) -> tuple[DuckDBPyConnection, bool]:
    dataset_path = Path(PARQUET_PATH)
    if not dataset_path.exists():
        raise FileNotFoundError(str(dataset_path))

    conn = duckdb.connect(":memory:")
    escaped_path = str(dataset_path).replace("'", "''")
    conn.execute(
        f"CREATE OR REPLACE VIEW {DATA_TABLE} AS "
        f"SELECT * FROM read_parquet('{escaped_path}')"
    )
    timeout_enforced = with_timeout(conn, timeout_ms)
    return conn, timeout_enforced


def describe_columns(conn: DuckDBPyConnection) -> list[dict[str, Any]]:
    rows = conn.execute(f"DESCRIBE {DATA_TABLE}").fetchall()
    return [
        {"name": row[0], "type": row[1], "nullable": str(row[2]).upper() == "YES"}
        for row in rows
    ]


def resolve_column_name(column: str, columns: list[dict[str, Any]]) -> str:
    names = [item["name"] for item in columns]
    if column in names:
        return column

    lowered = column.lower()
    case_insensitive = [name for name in names if name.lower() == lowered]
    if len(case_insensitive) == 1:
        return case_insensitive[0]
    if len(case_insensitive) > 1:
        raise ValueError(
            f"Column '{column}' is ambiguous; use exact casing for one of: "
            f"{', '.join(case_insensitive)}"
        )
    raise KeyError(column)


@mcp.tool()
def get_schema(timeout_ms: int = DEFAULT_TIMEOUT_MS) -> dict[str, Any]:
    """Get dataset schema and row metadata."""
    timeout = normalize_timeout_ms(timeout_ms)
    conn: DuckDBPyConnection | None = None
    try:
        conn, timeout_enforced = get_connection(timeout)
        columns = describe_columns(conn)
        row_count = int(
            conn.execute(f"SELECT COUNT(*)::BIGINT FROM {DATA_TABLE}").fetchone()[0]
        )
        data = {
            "rowCount": row_count,
            "columnCount": len(columns),
            "columns": columns,
        }
        meta = {
            "datasetPath": str(Path(PARQUET_PATH)),
            "timeoutMs": timeout,
            "timeoutEnforced": timeout_enforced,
        }
        return success(data, meta)
    except FileNotFoundError:
        return failure(
            "DATASET_NOT_FOUND",
            "Dataset parquet file was not found.",
            {"path": str(Path(PARQUET_PATH))},
        )
    except Exception as exc:
        code = "QUERY_TIMEOUT" if is_timeout_error(exc) else "SCHEMA_QUERY_FAILED"
        message = (
            "Schema request exceeded the configured timeout."
            if code == "QUERY_TIMEOUT"
            else "Failed to read dataset schema."
        )
        return failure(code, message, {"reason": str(exc)})
    finally:
        if conn is not None:
            conn.close()


@mcp.tool()
def query_data(
    sql: str,
    limit: int = DEFAULT_LIMIT,
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
) -> dict[str, Any]:
    """Run a bounded read-only SQL query against the BKS dataset (table name: data)."""
    if not isinstance(sql, str) or not sql.strip():
        return failure("MISSING_SQL", "sql field is required")

    cleaned, sql_error = validate_read_only_sql(sql)
    if sql_error:
        return failure("UNSAFE_SQL", sql_error)
    if cleaned is None:
        return failure("UNSAFE_SQL", "Invalid SQL query")

    bounded_limit = normalize_limit(limit)
    timeout = normalize_timeout_ms(timeout_ms)
    stmt_type = statement_type(cleaned)

    conn: DuckDBPyConnection | None = None
    start = time.perf_counter()
    try:
        conn, timeout_enforced = get_connection(timeout)
        if stmt_type in {"SELECT", "WITH"}:
            bounded_sql = (
                f"SELECT * FROM ({cleaned}) AS _bks_query_result LIMIT {bounded_limit}"
            )
        else:
            bounded_sql = cleaned

        result = conn.execute(bounded_sql)
        columns = [desc[0] for desc in (result.description or [])]
        raw_rows = result.fetchall()
        rows = [[to_json_value(item) for item in row] for row in raw_rows]

        may_be_truncated = stmt_type in {"SELECT", "WITH"} and len(rows) == bounded_limit
        if stmt_type not in {"SELECT", "WITH"} and len(rows) > bounded_limit:
            rows = rows[:bounded_limit]

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return success(
            {"columns": columns, "rows": rows},
            {
                "limit": bounded_limit,
                "rowCount": len(rows),
                "statementType": stmt_type,
                "timeoutMs": timeout,
                "timeoutEnforced": timeout_enforced,
                "durationMs": elapsed_ms,
                "mayBeTruncated": may_be_truncated,
            },
        )
    except FileNotFoundError:
        return failure(
            "DATASET_NOT_FOUND",
            "Dataset parquet file was not found.",
            {"path": str(Path(PARQUET_PATH))},
        )
    except Exception as exc:
        code = "QUERY_TIMEOUT" if is_timeout_error(exc) else "QUERY_FAILED"
        message = (
            "Query exceeded the configured timeout."
            if code == "QUERY_TIMEOUT"
            else "Failed to execute SQL query."
        )
        return failure(code, message, {"reason": str(exc)})
    finally:
        if conn is not None:
            conn.close()


@mcp.tool()
def get_stats(
    column: str,
    top_n: int = 10,
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
) -> dict[str, Any]:
    """Get typed summary statistics for one column."""
    if not isinstance(column, str) or not column.strip():
        return failure("MISSING_COLUMN", "column is required")

    requested_column = column.strip()
    bounded_top_n = normalize_top_n(top_n, default=10)
    timeout = normalize_timeout_ms(timeout_ms)

    conn: DuckDBPyConnection | None = None
    try:
        conn, timeout_enforced = get_connection(timeout)
        columns = describe_columns(conn)
        try:
            column_name = resolve_column_name(requested_column, columns)
        except KeyError:
            return failure(
                "COLUMN_NOT_FOUND",
                f"Column '{requested_column}' was not found.",
            )
        except ValueError as exc:
            return failure("AMBIGUOUS_COLUMN", str(exc))

        column_info = next(item for item in columns if item["name"] == column_name)
        column_ident = quote_ident(column_name)

        totals = conn.execute(
            f"SELECT COUNT(*)::BIGINT AS total, "
            f"COUNT({column_ident})::BIGINT AS non_null "
            f"FROM {DATA_TABLE}"
        ).fetchone()
        total = int(totals[0])
        non_null = int(totals[1])
        nulls = total - non_null
        null_ratio = round((nulls / total), 6) if total else 0.0

        if is_numeric_type(column_info["type"]):
            numeric_row = conn.execute(
                f"SELECT AVG({column_ident}) AS mean, "
                f"STDDEV_SAMP({column_ident}) AS stddev, "
                f"MIN({column_ident}) AS min, "
                f"quantile_cont({column_ident}, 0.25) AS p25, "
                f"quantile_cont({column_ident}, 0.5) AS median, "
                f"quantile_cont({column_ident}, 0.75) AS p75, "
                f"MAX({column_ident}) AS max "
                f"FROM {DATA_TABLE} "
                f"WHERE {column_ident} IS NOT NULL"
            ).fetchone()
            stats = {
                "mean": to_json_value(numeric_row[0]),
                "stddev": to_json_value(numeric_row[1]),
                "min": to_json_value(numeric_row[2]),
                "p25": to_json_value(numeric_row[3]),
                "median": to_json_value(numeric_row[4]),
                "p75": to_json_value(numeric_row[5]),
                "max": to_json_value(numeric_row[6]),
            }
            logical_type = "numeric"
        else:
            distinct_count = int(
                conn.execute(
                    f"SELECT COUNT(DISTINCT {column_ident})::BIGINT "
                    f"FROM {DATA_TABLE} "
                    f"WHERE {column_ident} IS NOT NULL"
                ).fetchone()[0]
            )
            top_rows = conn.execute(
                f"SELECT CAST({column_ident} AS VARCHAR) AS value, "
                f"COUNT(*)::BIGINT AS count "
                f"FROM {DATA_TABLE} "
                f"WHERE {column_ident} IS NOT NULL "
                f"GROUP BY 1 "
                f"ORDER BY count DESC, value ASC "
                f"LIMIT ?",
                [bounded_top_n],
            ).fetchall()

            top_categories = []
            for value, count in top_rows:
                count_int = int(count)
                top_categories.append(
                    {
                        "value": to_json_value(value),
                        "count": count_int,
                        "percent": round((count_int / non_null) * 100, 4)
                        if non_null
                        else 0.0,
                    }
                )

            stats = {
                "distinctCount": distinct_count,
                "topCategories": top_categories,
                "topN": bounded_top_n,
                "truncated": distinct_count > len(top_categories),
            }
            logical_type = "categorical"

        return success(
            {
                "column": column_name,
                "columnType": column_info["type"],
                "logicalType": logical_type,
                "totalCount": total,
                "nonNullCount": non_null,
                "nullCount": nulls,
                "nullRatio": null_ratio,
                "stats": stats,
            },
            {
                "timeoutMs": timeout,
                "timeoutEnforced": timeout_enforced,
            },
        )
    except FileNotFoundError:
        return failure(
            "DATASET_NOT_FOUND",
            "Dataset parquet file was not found.",
            {"path": str(Path(PARQUET_PATH))},
        )
    except Exception as exc:
        code = "QUERY_TIMEOUT" if is_timeout_error(exc) else "STATS_QUERY_FAILED"
        message = (
            "Stats request exceeded the configured timeout."
            if code == "QUERY_TIMEOUT"
            else "Failed to compute column statistics."
        )
        return failure(code, message, {"reason": str(exc)})
    finally:
        if conn is not None:
            conn.close()


@mcp.tool()
def cross_tabulate(
    x_column: str,
    y_column: str,
    top_n: int = DEFAULT_TOP_N,
    include_nulls: bool = False,
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
) -> dict[str, Any]:
    """Build a cross-tab matrix with marginal totals for two columns."""
    if not isinstance(x_column, str) or not x_column.strip():
        return failure("MISSING_X_COLUMN", "x_column is required")
    if not isinstance(y_column, str) or not y_column.strip():
        return failure("MISSING_Y_COLUMN", "y_column is required")

    requested_x = x_column.strip()
    requested_y = y_column.strip()
    bounded_top_n = normalize_top_n(top_n)
    timeout = normalize_timeout_ms(timeout_ms)

    conn: DuckDBPyConnection | None = None
    try:
        conn, timeout_enforced = get_connection(timeout)
        columns = describe_columns(conn)

        try:
            x_name = resolve_column_name(requested_x, columns)
        except KeyError:
            return failure("COLUMN_NOT_FOUND", f"Column '{requested_x}' was not found.")
        except ValueError as exc:
            return failure("AMBIGUOUS_COLUMN", str(exc))

        try:
            y_name = resolve_column_name(requested_y, columns)
        except KeyError:
            return failure("COLUMN_NOT_FOUND", f"Column '{requested_y}' was not found.")
        except ValueError as exc:
            return failure("AMBIGUOUS_COLUMN", str(exc))

        x_ident = quote_ident(x_name)
        y_ident = quote_ident(y_name)

        if include_nulls:
            x_expr = f"COALESCE(CAST({x_ident} AS VARCHAR), '{NULL_LABEL}')"
            y_expr = f"COALESCE(CAST({y_ident} AS VARCHAR), '{NULL_LABEL}')"
            where_clause = ""
        else:
            x_expr = f"CAST({x_ident} AS VARCHAR)"
            y_expr = f"CAST({y_ident} AS VARCHAR)"
            where_clause = f"WHERE {x_ident} IS NOT NULL AND {y_ident} IS NOT NULL"

        base_sql = (
            f"SELECT {x_expr} AS x_value, {y_expr} AS y_value "
            f"FROM {DATA_TABLE} {where_clause}"
        )

        distinct_row = conn.execute(
            "WITH base AS (" + base_sql + ") "
            "SELECT COUNT(DISTINCT x_value)::BIGINT, "
            "COUNT(DISTINCT y_value)::BIGINT, "
            "COUNT(*)::BIGINT FROM base"
        ).fetchone()
        x_distinct = int(distinct_row[0])
        y_distinct = int(distinct_row[1])
        base_row_count = int(distinct_row[2])

        x_rows = conn.execute(
            "WITH base AS (" + base_sql + ") "
            "SELECT x_value, COUNT(*)::BIGINT AS count "
            "FROM base GROUP BY 1 "
            "ORDER BY count DESC, x_value ASC "
            "LIMIT ?",
            [bounded_top_n],
        ).fetchall()
        y_rows = conn.execute(
            "WITH base AS (" + base_sql + ") "
            "SELECT y_value, COUNT(*)::BIGINT AS count "
            "FROM base GROUP BY 1 "
            "ORDER BY count DESC, y_value ASC "
            "LIMIT ?",
            [bounded_top_n],
        ).fetchall()

        x_values = [to_json_value(row[0]) for row in x_rows]
        y_values = [to_json_value(row[0]) for row in y_rows]
        x_set = set(x_values)
        y_set = set(y_values)

        pair_rows = conn.execute(
            "WITH base AS (" + base_sql + ") "
            "SELECT x_value, y_value, COUNT(*)::BIGINT AS count "
            "FROM base GROUP BY 1, 2"
        ).fetchall()

        cell_counts: dict[tuple[Any, Any], int] = {}
        row_totals: dict[Any, int] = {value: 0 for value in x_values}
        column_totals: dict[Any, int] = {value: 0 for value in y_values}

        for x_value_raw, y_value_raw, count_raw in pair_rows:
            x_value = to_json_value(x_value_raw)
            y_value = to_json_value(y_value_raw)
            if x_value not in x_set or y_value not in y_set:
                continue
            count_int = int(count_raw)
            cell_counts[(x_value, y_value)] = count_int
            row_totals[x_value] += count_int
            column_totals[y_value] += count_int

        matrix = [
            [cell_counts.get((x_value, y_value), 0) for y_value in y_values]
            for x_value in x_values
        ]
        cells = [
            {"x": x_value, "y": y_value, "count": cell_counts[(x_value, y_value)]}
            for x_value in x_values
            for y_value in y_values
            if (x_value, y_value) in cell_counts
        ]
        row_totals_list = [
            {"x": x_value, "count": row_totals[x_value]} for x_value in x_values
        ]
        column_totals_list = [
            {"y": y_value, "count": column_totals[y_value]} for y_value in y_values
        ]
        grand_total = sum(row_totals.values())

        return success(
            {
                "xColumn": x_name,
                "yColumn": y_name,
                "xValues": x_values,
                "yValues": y_values,
                "matrix": matrix,
                "cells": cells,
                "rowTotals": row_totals_list,
                "columnTotals": column_totals_list,
                "grandTotal": grand_total,
                "baseRowCount": base_row_count,
            },
            {
                "topN": bounded_top_n,
                "includeNulls": include_nulls,
                "xDistinctCount": x_distinct,
                "yDistinctCount": y_distinct,
                "xTruncated": x_distinct > len(x_values),
                "yTruncated": y_distinct > len(y_values),
                "timeoutMs": timeout,
                "timeoutEnforced": timeout_enforced,
            },
        )
    except FileNotFoundError:
        return failure(
            "DATASET_NOT_FOUND",
            "Dataset parquet file was not found.",
            {"path": str(Path(PARQUET_PATH))},
        )
    except Exception as exc:
        code = "QUERY_TIMEOUT" if is_timeout_error(exc) else "CROSSTAB_QUERY_FAILED"
        message = (
            "Cross-tab request exceeded the configured timeout."
            if code == "QUERY_TIMEOUT"
            else "Failed to compute cross-tabulation."
        )
        return failure(code, message, {"reason": str(exc)})
    finally:
        if conn is not None:
            conn.close()


@mcp.tool()
def search_columns(query: str, limit: int = 25) -> dict[str, Any]:
    """Search for columns by case-insensitive name match."""
    if not isinstance(query, str) or not query.strip():
        return failure("MISSING_QUERY", "query is required")

    term = query.strip().lower()
    bounded_limit = normalize_limit(limit, default=25, maximum=250)

    conn: DuckDBPyConnection | None = None
    try:
        conn, timeout_enforced = get_connection(DEFAULT_TIMEOUT_MS)
        columns = describe_columns(conn)

        ranked: list[tuple[int, str, dict[str, Any]]] = []
        for column in columns:
            name = column["name"]
            lowered = name.lower()
            if term not in lowered:
                continue
            if lowered == term:
                score = 0
            elif lowered.startswith(term):
                score = 1
            else:
                score = 2
            ranked.append((score, lowered, column))

        ranked.sort(key=lambda item: (item[0], item[1]))
        matches = [
            {
                "name": item["name"],
                "type": item["type"],
                "nullable": item["nullable"],
            }
            for _, _, item in ranked[:bounded_limit]
        ]

        return success(
            {
                "query": query,
                "matchCount": len(matches),
                "totalMatches": len(ranked),
                "matches": matches,
            },
            {
                "limit": bounded_limit,
                "timeoutMs": DEFAULT_TIMEOUT_MS,
                "timeoutEnforced": timeout_enforced,
            },
        )
    except FileNotFoundError:
        return failure(
            "DATASET_NOT_FOUND",
            "Dataset parquet file was not found.",
            {"path": str(Path(PARQUET_PATH))},
        )
    except Exception as exc:
        code = "QUERY_TIMEOUT" if is_timeout_error(exc) else "SEARCH_QUERY_FAILED"
        message = (
            "Column search exceeded the configured timeout."
            if code == "QUERY_TIMEOUT"
            else "Failed to search columns."
        )
        return failure(code, message, {"reason": str(exc)})
    finally:
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    mcp.run(transport=_transport)

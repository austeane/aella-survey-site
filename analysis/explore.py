from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

import duckdb
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PARQUET_PATH = REPO_ROOT / "data" / "BKSPublic.parquet"

# High-traffic columns used by curated presets and onboarding defaults.
HIGH_TRAFFIC_COLUMNS = [
    "age",
    "agreeablenessvariable",
    "biomale",
    "childhood_gender_tolerance",
    "extroversionvariable",
    "givepain",
    "humiliation",
    "lightbondage",
    "multiplepartners",
    "neuroticismvariable",
    "nonconsent",
    "obedience",
    "opennessvariable",
    "politics",
    "powerdynamic",
    "receivepain",
    "sadomasochism",
    "sexcount",
    "spanking",
    "straightness",
]


def quote_identifier(identifier: str) -> str:
    escaped = identifier.replace('"', '""')
    return f'"{escaped}"'


def connect_data(parquet_path: Path = DEFAULT_PARQUET_PATH) -> duckdb.DuckDBPyConnection:
    parquet_path = parquet_path.resolve()
    if not parquet_path.exists():
        raise FileNotFoundError(f"Parquet file not found: {parquet_path}")

    connection = duckdb.connect(database=":memory:")
    source_literal = str(parquet_path).replace("'", "''")
    connection.execute(
        f"CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('{source_literal}')"
    )
    return connection


def run_query(
    connection: duckdb.DuckDBPyConnection,
    sql: str,
    params: Iterable[object] | None = None,
) -> pd.DataFrame:
    if params is None:
        return connection.execute(sql).fetchdf()
    return connection.execute(sql, list(params)).fetchdf()


def column_profile(
    connection: duckdb.DuckDBPyConnection,
    columns: Iterable[str],
) -> list[dict[str, object]]:
    profiles: list[dict[str, object]] = []

    for column in columns:
        quoted = quote_identifier(column)
        describe = connection.execute(f"DESCRIBE SELECT {quoted} FROM data").fetchone()
        if describe is None:
            continue

        metric_row = connection.execute(
            f"""
            SELECT
              count(*)::BIGINT AS total_count,
              count({quoted})::BIGINT AS answered_count,
              approx_count_distinct({quoted})::BIGINT AS distinct_count
            FROM data
            """
        ).fetchone()

        total_count = int(metric_row[0])
        answered_count = int(metric_row[1])
        distinct_count = int(metric_row[2])

        profiles.append(
            {
                "column": column,
                "duckdbType": str(describe[1]),
                "answeredCount": answered_count,
                "missingCount": total_count - answered_count,
                "distinctCount": distinct_count,
            }
        )

    return profiles


def preview_top_values(
    connection: duckdb.DuckDBPyConnection,
    column: str,
    limit: int = 8,
) -> pd.DataFrame:
    quoted = quote_identifier(column)
    return run_query(
        connection,
        f"""
        SELECT
          cast({quoted} AS VARCHAR) AS value,
          count(*)::BIGINT AS count
        FROM data
        WHERE {quoted} IS NOT NULL
        GROUP BY 1
        ORDER BY count DESC, value
        LIMIT ?
        """,
        [limit],
    )


def print_profile_table(rows: list[dict[str, object]]) -> None:
    if not rows:
        print("No rows to display.")
        return

    headers = ["column", "duckdbType", "answeredCount", "missingCount", "distinctCount"]
    widths = {
        header: max(len(header), *(len(str(row.get(header, ""))) for row in rows))
        for header in headers
    }

    def line_for(row: dict[str, object]) -> str:
        return " | ".join(str(row.get(header, "")).ljust(widths[header]) for header in headers)

    divider = "-+-".join("-" * widths[header] for header in headers)

    print(" | ".join(header.ljust(widths[header]) for header in headers))
    print(divider)
    for row in rows:
        print(line_for(row))


def main() -> None:
    parser = argparse.ArgumentParser(description="Quick schema/profile explorer for BKSPublic.parquet")
    parser.add_argument(
        "--parquet",
        type=Path,
        default=DEFAULT_PARQUET_PATH,
        help=f"Path to parquet file (default: {DEFAULT_PARQUET_PATH})",
    )
    parser.add_argument(
        "--show-values",
        action="store_true",
        help="Show top values for each profiled column",
    )
    parser.add_argument(
        "--value-limit",
        type=int,
        default=8,
        help="Number of top values per column when --show-values is used",
    )

    args = parser.parse_args()

    connection = connect_data(args.parquet)
    try:
        row_count = connection.execute("SELECT count(*)::BIGINT FROM data").fetchone()[0]
        print(f"Loaded data from: {args.parquet.resolve()}")
        print(f"Total rows: {int(row_count)}")
        print()

        profile_rows = column_profile(connection, HIGH_TRAFFIC_COLUMNS)
        print("High-traffic column profile")
        print_profile_table(profile_rows)

        if args.show_values:
            print("\nTop values by column")
            for column in HIGH_TRAFFIC_COLUMNS:
                print(f"\n[{column}]")
                try:
                    values = preview_top_values(connection, column, args.value_limit)
                except duckdb.Error as error:
                    print(f"  Failed to fetch values: {error}")
                    continue

                if values.empty:
                    print("  (no answered rows)")
                    continue

                for _, row in values.iterrows():
                    print(f"  {row['value']}: {int(row['count'])}")
    finally:
        connection.close()


if __name__ == "__main__":
    main()

#!/usr/bin/env node

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DuckDBInstance } from "@duckdb/node-api";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const sourcePath =
  process.env.BKS_PARQUET_PATH ??
  resolve(projectRoot, "data", "BKSPublic.parquet");
const columnsPath =
  process.env.BKS_COLUMNS_PATH ??
  resolve(projectRoot, "src", "lib", "schema", "columns.generated.json");
const outputPath =
  process.env.BKS_RELATIONSHIPS_OUTPUT ??
  resolve(projectRoot, "src", "lib", "schema", "relationships.generated.json");

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function normalizeNumber(value, fallback = 0) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

async function main() {
  console.log("Reading column metadata...");
  const columnsRaw = await readFile(columnsPath, "utf8");
  const columnsData = JSON.parse(columnsRaw);
  const allColumns = columnsData.columns;

  // Filter columns: nullRatio < 0.7, approxCardinality < 100, logicalType !== "text"
  const eligibleColumns = allColumns.filter(
    (col) =>
      col.nullRatio < 0.7 &&
      col.approxCardinality < 100 &&
      col.logicalType !== "text"
  );

  console.log(
    `Filtered ${allColumns.length} columns down to ${eligibleColumns.length} eligible columns`
  );

  // Separate into categorical and numeric
  const categoricalColumns = eligibleColumns.filter(
    (col) =>
      (col.logicalType === "categorical" || col.logicalType === "boolean") &&
      col.approxCardinality >= 2 &&
      col.approxCardinality <= 30
  );
  const numericColumns = eligibleColumns.filter(
    (col) => col.logicalType === "numeric"
  );

  console.log(
    `Categorical columns (cardinality 2-30): ${categoricalColumns.length}`
  );
  console.log(`Numeric columns: ${numericColumns.length}`);

  // Initialize DuckDB
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();

  const sourceLiteral = sourcePath.replaceAll("'", "''");
  await connection.run(
    `CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('${sourceLiteral}')`
  );

  // Store all relationships: Map<columnName, Array<{column, metric, value, n}>>
  const relationships = new Map();

  function addRelationship(colA, colB, metric, value, n) {
    if (!Number.isFinite(value) || Math.abs(value) <= 0.05) return;

    for (const [from, to] of [
      [colA, colB],
      [colB, colA],
    ]) {
      if (!relationships.has(from)) {
        relationships.set(from, []);
      }
      relationships.get(from).push({
        column: to,
        metric,
        value: Math.round(Math.abs(value) * 10000) / 10000,
        n,
      });
    }
  }

  // ---------- Numeric x Numeric: Pearson correlation ----------
  console.log("\nComputing numeric correlations...");
  const numericPairCount =
    (numericColumns.length * (numericColumns.length - 1)) / 2;
  console.log(`  Total numeric pairs: ${numericPairCount}`);

  if (numericColumns.length >= 2) {
    // Batch correlations: for each anchor column, compute correlations with all subsequent columns
    for (let i = 0; i < numericColumns.length; i++) {
      const anchor = numericColumns[i];
      const anchorQuoted = quoteIdentifier(anchor.name);
      const targets = numericColumns.slice(i + 1);

      if (targets.length === 0) continue;

      // Process in batches of 50 to avoid overly long queries
      const BATCH_SIZE = 50;
      for (let batchStart = 0; batchStart < targets.length; batchStart += BATCH_SIZE) {
        const batch = targets.slice(batchStart, batchStart + BATCH_SIZE);

        const corrExpressions = batch.map((target, idx) => {
          const targetQuoted = quoteIdentifier(target.name);
          return `corr(${anchorQuoted}, ${targetQuoted}) AS corr_${idx}`;
        });

        const countExpressions = batch.map((target, idx) => {
          const targetQuoted = quoteIdentifier(target.name);
          return `count(*) FILTER (WHERE ${anchorQuoted} IS NOT NULL AND ${targetQuoted} IS NOT NULL)::BIGINT AS n_${idx}`;
        });

        const sql = `
          SELECT ${[...corrExpressions, ...countExpressions].join(", ")}
          FROM data
        `;

        try {
          const reader = await connection.runAndReadAll(sql);
          const row = reader.getRowObjectsJS()[0];
          if (!row) continue;

          for (let idx = 0; idx < batch.length; idx++) {
            const corrVal = normalizeNumber(row[`corr_${idx}`], NaN);
            const nVal = normalizeNumber(row[`n_${idx}`], 0);

            if (nVal >= 500 && Number.isFinite(corrVal)) {
              addRelationship(
                anchor.name,
                batch[idx].name,
                "correlation",
                corrVal,
                nVal
              );
            }
          }
        } catch (err) {
          console.warn(
            `  Warning: correlation batch failed for anchor "${anchor.name}":`,
            err.message
          );
        }
      }

      if ((i + 1) % 10 === 0 || i === numericColumns.length - 1) {
        console.log(
          `  Processed numeric anchor ${i + 1}/${numericColumns.length}`
        );
      }
    }
  }

  // ---------- Categorical x Categorical: Cramer's V ----------
  console.log("\nComputing categorical associations (Cramer's V)...");
  const catPairCount =
    (categoricalColumns.length * (categoricalColumns.length - 1)) / 2;
  console.log(`  Total categorical pairs: ${catPairCount}`);

  // Limit pairs if too many
  const MAX_CAT_PAIRS = 10000;
  let catPairsComputed = 0;
  let catPairsSkipped = 0;

  for (let i = 0; i < categoricalColumns.length; i++) {
    const colA = categoricalColumns[i];
    const colAQuoted = quoteIdentifier(colA.name);

    for (let j = i + 1; j < categoricalColumns.length; j++) {
      if (catPairsComputed >= MAX_CAT_PAIRS) {
        catPairsSkipped++;
        continue;
      }

      const colB = categoricalColumns[j];
      const colBQuoted = quoteIdentifier(colB.name);

      const sql = `
        SELECT
          cast(${colAQuoted} AS VARCHAR) AS a_val,
          cast(${colBQuoted} AS VARCHAR) AS b_val,
          count(*)::BIGINT AS cnt
        FROM data
        WHERE ${colAQuoted} IS NOT NULL AND ${colBQuoted} IS NOT NULL
        GROUP BY 1, 2
      `;

      try {
        const reader = await connection.runAndReadAll(sql);
        const rows = reader.getRowObjectsJS();

        if (rows.length === 0) continue;

        // Compute Cramer's V from the contingency table
        const rowTotals = new Map();
        const colTotals = new Map();
        let total = 0;

        for (const row of rows) {
          const aVal = String(row.a_val ?? "NULL");
          const bVal = String(row.b_val ?? "NULL");
          const cnt = normalizeNumber(row.cnt);

          rowTotals.set(aVal, (rowTotals.get(aVal) ?? 0) + cnt);
          colTotals.set(bVal, (colTotals.get(bVal) ?? 0) + cnt);
          total += cnt;
        }

        const r = rowTotals.size;
        const c = colTotals.size;

        if (total <= 0 || r < 2 || c < 2) continue;

        let chiSquare = 0;
        const observed = new Map();
        for (const row of rows) {
          const aVal = String(row.a_val ?? "NULL");
          const bVal = String(row.b_val ?? "NULL");
          observed.set(`${aVal}\0${bVal}`, normalizeNumber(row.cnt));
        }

        for (const [aVal, aTotal] of rowTotals.entries()) {
          for (const [bVal, bTotal] of colTotals.entries()) {
            const expected = (aTotal * bTotal) / total;
            if (expected <= 0) continue;
            const obs = observed.get(`${aVal}\0${bVal}`) ?? 0;
            chiSquare += ((obs - expected) ** 2) / expected;
          }
        }

        const denom = total * Math.min(r - 1, c - 1);
        if (denom <= 0) continue;

        const cramersV = Math.sqrt(chiSquare / denom);

        addRelationship(
          colA.name,
          colB.name,
          "cramers_v",
          cramersV,
          total
        );

        catPairsComputed++;
      } catch (err) {
        console.warn(
          `  Warning: Cramer's V failed for "${colA.name}" x "${colB.name}":`,
          err.message
        );
      }
    }

    if ((i + 1) % 20 === 0 || i === categoricalColumns.length - 1) {
      console.log(
        `  Processed categorical anchor ${i + 1}/${categoricalColumns.length} (${catPairsComputed} pairs computed)`
      );
    }
  }

  if (catPairsSkipped > 0) {
    console.log(`  Skipped ${catPairsSkipped} pairs due to limit`);
  }

  // ---------- Post-process: keep top 20 per column, sorted by value ----------
  console.log("\nPost-processing results...");

  const finalRelationships = {};
  let totalPairs = 0;

  for (const [colName, rels] of relationships.entries()) {
    // Deduplicate: keep best value per target column
    const bestByTarget = new Map();
    for (const rel of rels) {
      const existing = bestByTarget.get(rel.column);
      if (!existing || rel.value > existing.value) {
        bestByTarget.set(rel.column, rel);
      }
    }

    // Sort by value descending, take top 20
    const sorted = [...bestByTarget.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    if (sorted.length > 0) {
      finalRelationships[colName] = sorted;
      totalPairs += sorted.length;
    }
  }

  const columnCount = Object.keys(finalRelationships).length;

  const payload = {
    generatedAt: new Date().toISOString(),
    columnCount,
    pairCount: totalPairs,
    relationships: finalRelationships,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `\nDone! Wrote ${columnCount} columns with ${totalPairs} total relationship entries to:\n  ${outputPath}`
  );

  connection.closeSync();
}

main().catch((error) => {
  console.error("Failed to compute relationships", error);
  process.exit(1);
});

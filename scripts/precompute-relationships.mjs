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
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function shortValueLabel(value, max = 34) {
  if (!value) return "Unknown";
  const text = String(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function clusterLabelPrefix(tag) {
  if (tag === "fetish") return "Fetish";
  if (tag === "demographic") return "Demographic";
  if (tag === "ocean") return "Personality";
  if (tag === "derived") return "Derived";
  return "General";
}

async function main() {
  console.log("Reading column metadata...");
  const columnsRaw = await readFile(columnsPath, "utf8");
  const columnsData = JSON.parse(columnsRaw);
  const allColumns = columnsData.columns;
  const byColumnName = new Map(allColumns.map((column) => [column.name, column]));

  const eligibleColumns = allColumns.filter(
    (col) =>
      col.nullRatio < 0.7 &&
      col.approxCardinality < 100 &&
      col.logicalType !== "text",
  );

  console.log(
    `Filtered ${allColumns.length} columns down to ${eligibleColumns.length} eligible columns`,
  );

  const categoricalColumns = eligibleColumns.filter(
    (col) =>
      (col.logicalType === "categorical" || col.logicalType === "boolean") &&
      col.approxCardinality >= 2 &&
      col.approxCardinality <= 30,
  );
  const numericColumns = eligibleColumns.filter((col) => col.logicalType === "numeric");

  console.log(
    `Categorical columns (cardinality 2-30): ${categoricalColumns.length}`,
  );
  console.log(`Numeric columns: ${numericColumns.length}`);

  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();

  const sourceLiteral = sourcePath.replaceAll("'", "''");
  await connection.run(
    `CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('${sourceLiteral}')`,
  );

  /** @type {Map<string, Array<{column: string, metric: string, value: number, direction?: "positive"|"negative", n: number, topPattern?: string}>>} */
  const relationships = new Map();

  function addRelationship({
    colA,
    colB,
    metric,
    value,
    n,
    direction,
    topPattern,
  }) {
    if (!Number.isFinite(value) || Math.abs(value) <= 0.05) return;

    for (const [from, to] of [
      [colA, colB],
      [colB, colA],
    ]) {
      if (!relationships.has(from)) relationships.set(from, []);
      relationships.get(from).push({
        column: to,
        metric,
        value: Math.round(Math.abs(value) * 10000) / 10000,
        ...(metric === "correlation" ? { direction: value >= 0 ? "positive" : "negative" } : {}),
        n,
        ...(topPattern ? { topPattern } : {}),
      });
    }
  }

  console.log("\nComputing numeric correlations...");
  const numericPairCount =
    (numericColumns.length * (numericColumns.length - 1)) / 2;
  console.log(`  Total numeric pairs: ${numericPairCount}`);

  if (numericColumns.length >= 2) {
    for (let i = 0; i < numericColumns.length; i += 1) {
      const anchor = numericColumns[i];
      const anchorQuoted = quoteIdentifier(anchor.name);
      const targets = numericColumns.slice(i + 1);
      if (targets.length === 0) continue;

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

          for (let idx = 0; idx < batch.length; idx += 1) {
            const corrVal = normalizeNumber(row[`corr_${idx}`], NaN);
            const nVal = normalizeNumber(row[`n_${idx}`], 0);

            if (nVal >= 500 && Number.isFinite(corrVal)) {
              const anchorDisplay = byColumnName.get(anchor.name)?.displayName ?? anchor.name;
              const targetDisplay = byColumnName.get(batch[idx].name)?.displayName ?? batch[idx].name;
              const topPattern =
                corrVal >= 0
                  ? `Higher ${shortValueLabel(anchorDisplay)} tends to align with higher ${shortValueLabel(targetDisplay)}.`
                  : `Higher ${shortValueLabel(anchorDisplay)} tends to align with lower ${shortValueLabel(targetDisplay)}.`;

              addRelationship({
                colA: anchor.name,
                colB: batch[idx].name,
                metric: "correlation",
                value: corrVal,
                n: nVal,
                topPattern,
              });
            }
          }
        } catch (err) {
          console.warn(
            `  Warning: correlation batch failed for anchor "${anchor.name}":`,
            err.message,
          );
        }
      }

      if ((i + 1) % 10 === 0 || i === numericColumns.length - 1) {
        console.log(
          `  Processed numeric anchor ${i + 1}/${numericColumns.length}`,
        );
      }
    }
  }

  console.log("\nComputing categorical associations (Cramer's V)...");
  const catPairCount =
    (categoricalColumns.length * (categoricalColumns.length - 1)) / 2;
  console.log(`  Total categorical pairs: ${catPairCount}`);

  const MAX_CAT_PAIRS = 12000;
  let catPairsComputed = 0;
  let catPairsSkipped = 0;

  for (let i = 0; i < categoricalColumns.length; i += 1) {
    const colA = categoricalColumns[i];
    const colAQuoted = quoteIdentifier(colA.name);

    for (let j = i + 1; j < categoricalColumns.length; j += 1) {
      if (catPairsComputed >= MAX_CAT_PAIRS) {
        catPairsSkipped += 1;
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

        const rowTotals = new Map();
        const colTotals = new Map();
        const observed = new Map();
        let total = 0;

        for (const row of rows) {
          const aVal = String(row.a_val ?? "NULL");
          const bVal = String(row.b_val ?? "NULL");
          const cnt = normalizeNumber(row.cnt);

          rowTotals.set(aVal, (rowTotals.get(aVal) ?? 0) + cnt);
          colTotals.set(bVal, (colTotals.get(bVal) ?? 0) + cnt);
          observed.set(`${aVal}\0${bVal}`, cnt);
          total += cnt;
        }

        const r = rowTotals.size;
        const c = colTotals.size;
        if (total <= 0 || r < 2 || c < 2) continue;

        let chiSquare = 0;
        let bestPattern = null;

        for (const [aVal, aTotal] of rowTotals.entries()) {
          for (const [bVal, bTotal] of colTotals.entries()) {
            const expected = (aTotal * bTotal) / total;
            if (expected <= 0) continue;

            const obs = observed.get(`${aVal}\0${bVal}`) ?? 0;
            chiSquare += ((obs - expected) ** 2) / expected;

            const lift = obs / expected;
            const score = lift * (obs / total);
            if (obs >= 6 && (!bestPattern || score > bestPattern.score)) {
              bestPattern = { aVal, bVal, lift, score };
            }
          }
        }

        const denom = total * Math.min(r - 1, c - 1);
        if (denom <= 0) continue;

        const cramersV = Math.sqrt(chiSquare / denom);
        const topPattern = bestPattern
          ? `People who chose ${shortValueLabel(bestPattern.aVal)} were ${bestPattern.lift.toFixed(1)}x more likely to also choose ${shortValueLabel(bestPattern.bVal)}.`
          : undefined;

        addRelationship({
          colA: colA.name,
          colB: colB.name,
          metric: "cramers_v",
          value: cramersV,
          n: total,
          topPattern,
        });

        catPairsComputed += 1;
      } catch (err) {
        console.warn(
          `  Warning: Cramer's V failed for "${colA.name}" x "${colB.name}":`,
          err.message,
        );
      }
    }

    if ((i + 1) % 20 === 0 || i === categoricalColumns.length - 1) {
      console.log(
        `  Processed categorical anchor ${i + 1}/${categoricalColumns.length} (${catPairsComputed} pairs computed)`,
      );
    }
  }

  if (catPairsSkipped > 0) {
    console.log(`  Skipped ${catPairsSkipped} pairs due to limit`);
  }

  console.log("\nPost-processing relationships...");

  const finalRelationships = {};
  const degreeByColumn = new Map();
  let totalPairs = 0;

  for (const [colName, rels] of relationships.entries()) {
    const bestByTarget = new Map();
    for (const rel of rels) {
      const existing = bestByTarget.get(rel.column);
      if (!existing || rel.value > existing.value) {
        bestByTarget.set(rel.column, rel);
      }
    }

    const sorted = [...bestByTarget.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    if (sorted.length > 0) {
      finalRelationships[colName] = sorted;
      degreeByColumn.set(colName, sorted.length);
      totalPairs += sorted.length;
    }
  }

  const nodes = Object.keys(finalRelationships);

  /** @type {Map<string, Map<string, number>>} */
  const adjacency = new Map();
  for (const node of nodes) {
    adjacency.set(node, new Map());
  }

  for (const [source, rels] of Object.entries(finalRelationships)) {
    const sourceMap = adjacency.get(source);
    if (!sourceMap) continue;

    for (const rel of rels) {
      const weight = rel.value;
      sourceMap.set(rel.column, Math.max(sourceMap.get(rel.column) ?? 0, weight));

      if (!adjacency.has(rel.column)) adjacency.set(rel.column, new Map());
      const reciprocal = adjacency.get(rel.column);
      reciprocal.set(source, Math.max(reciprocal.get(source) ?? 0, weight));
    }
  }

  console.log("Computing relationship clusters...");
  const labelByNode = new Map(nodes.map((node) => [node, node]));
  const orderedNodes = [...nodes].sort(
    (a, b) => (degreeByColumn.get(b) ?? 0) - (degreeByColumn.get(a) ?? 0),
  );

  const ITERATIONS = 12;
  for (let iter = 0; iter < ITERATIONS; iter += 1) {
    let changed = 0;

    for (const node of orderedNodes) {
      const neighborsMap = adjacency.get(node);
      if (!neighborsMap || neighborsMap.size === 0) continue;

      const weightsByLabel = new Map();
      for (const [neighbor, weight] of neighborsMap.entries()) {
        const label = labelByNode.get(neighbor) ?? neighbor;
        weightsByLabel.set(label, (weightsByLabel.get(label) ?? 0) + weight);
      }

      let bestLabel = labelByNode.get(node) ?? node;
      let bestWeight = -1;
      for (const [label, weight] of weightsByLabel.entries()) {
        if (weight > bestWeight) {
          bestWeight = weight;
          bestLabel = label;
        }
      }

      if (bestLabel !== labelByNode.get(node)) {
        labelByNode.set(node, bestLabel);
        changed += 1;
      }
    }

    if (changed === 0) break;
  }

  const membersByRawLabel = new Map();
  for (const node of nodes) {
    const label = labelByNode.get(node) ?? node;
    if (!membersByRawLabel.has(label)) membersByRawLabel.set(label, []);
    membersByRawLabel.get(label).push(node);
  }

  const rawClusters = [...membersByRawLabel.values()].sort((a, b) => b.length - a.length);

  const clusterIds = rawClusters.map((_, index) => `cluster-${index + 1}`);
  const clusterByColumn = {};
  rawClusters.forEach((members, index) => {
    const clusterId = clusterIds[index];
    for (const member of members) {
      clusterByColumn[member] = clusterId;
    }
  });

  const clusterSummaries = rawClusters.map((members, index) => {
    const clusterId = clusterIds[index];

    const tagCounts = new Map();
    for (const member of members) {
      const tags = byColumnName.get(member)?.tags ?? ["other"];
      for (const tag of tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    let dominantTag = "other";
    let dominantTagCount = -1;
    for (const [tag, count] of tagCounts.entries()) {
      if (count > dominantTagCount) {
        dominantTag = tag;
        dominantTagCount = count;
      }
    }

    const highestDegreeMember = [...members].sort(
      (a, b) => (degreeByColumn.get(b) ?? 0) - (degreeByColumn.get(a) ?? 0),
    )[0];

    const highestDisplay = byColumnName.get(highestDegreeMember)?.displayName ?? highestDegreeMember;
    const label = `${clusterLabelPrefix(dominantTag)} · ${shortValueLabel(highestDisplay, 28)}`;

    const bridgeWeights = new Map();
    for (const member of members) {
      const neighborsMap = adjacency.get(member);
      if (!neighborsMap) continue;
      for (const [neighbor, weight] of neighborsMap.entries()) {
        const otherCluster = clusterByColumn[neighbor];
        if (!otherCluster || otherCluster === clusterId) continue;
        bridgeWeights.set(otherCluster, (bridgeWeights.get(otherCluster) ?? 0) + weight);
      }
    }

    const bridgesTo = [...bridgeWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([bridgeClusterId]) => bridgeClusterId);

    return {
      id: clusterId,
      label,
      members,
      bridgesTo,
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    columnCount: Object.keys(finalRelationships).length,
    pairCount: totalPairs,
    clusters: clusterSummaries,
    clusterByColumn,
    relationships: finalRelationships,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `\nDone! Wrote ${payload.columnCount} columns with ${payload.pairCount} relationship entries and ${clusterSummaries.length} clusters to:\n  ${outputPath}`,
  );

  connection.closeSync();
}

main().catch((error) => {
  console.error("Failed to compute relationships", error);
  process.exit(1);
});

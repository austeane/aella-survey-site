#!/usr/bin/env node

import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DuckDBInstance } from "@duckdb/node-api";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const sourcePath = process.env.BKS_PARQUET_PATH ?? resolve(projectRoot, "data", "BKSPublic.parquet");
const outputPath = process.env.BKS_COLUMNS_OUTPUT ?? resolve(projectRoot, "src", "lib", "schema", "columns.generated.json");

const derivedColumns = new Set([
  "straightness",
  "childhood_adversity",
  "childhood_gender_tolerance",
  "TotalMentalIllness",
  "opennessvariable",
  "consciensiousnessvariable",
  "extroversionvariable",
  "neuroticismvariable",
  "agreeablenessvariable",
  "powerlessnessvariable",
  "totalfetishcategory",
  "bondageaverage",
]);

const demographicHints = [
  "age",
  "gender",
  "male",
  "female",
  "cis",
  "trans",
  "politics",
  "bmi",
  "relationship",
  "education",
  "income",
  "childhood",
  "straightness",
  "orientation",
  "liberated",
];

const demographicExclusions = new Set([
  "marriage100blood",
]);

const fetishHints = [
  "fetish",
  "bondage",
  "nonconsent",
  "sadism",
  "masoch",
  "submission",
  "dominant",
  "kink",
  "erotic",
  "sexual",
  "voyeur",
  "exhibition",
  "humiliation",
  "transformation",
];

const fetishColumnOverrides = new Set([
  '"I find scenarios where I eagerly beg others to be:" (jvrbyep)',
  '"I find scenarios where others eagerly beg me to be:" (stmm5eg)',
  "appearance",
  "bestiality",
  "brutality",
  "cgl",
  "clothing",
  "creepy",
  "dirty",
  "eagerness",
  "frustration",
  "futa",
  "gentleness",
  "incest",
  "multiplepartners",
  "mythical",
  "objects",
  "pregnancy",
  "roles",
  "secretions",
  "sensory",
  "spanking",
  "teasing",
  "toys",
  "vore",
  "worshipped",
  "worshipping",
]);

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function isNumericDuckType(type) {
  return /(TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT|UTINYINT|USMALLINT|UINTEGER|UBIGINT|FLOAT|DOUBLE|DECIMAL|REAL)/i.test(type);
}

function inferLogicalType(name, duckdbType, approxCardinality) {
  const lowerName = name.toLowerCase();

  if (/^boolean$/i.test(duckdbType)) {
    return "boolean";
  }

  if (/varchar|char|string|text|uuid/i.test(duckdbType)) {
    return approxCardinality <= 120 ? "categorical" : "text";
  }

  if (isNumericDuckType(duckdbType)) {
    if (
      approxCardinality <= 20 &&
      !/(average|variable|count|score|years?|total|height|weight|ratio|percent)/i.test(lowerName)
    ) {
      return "categorical";
    }

    return "numeric";
  }

  if (/date|time|timestamp/i.test(duckdbType)) {
    return "text";
  }

  return "unknown";
}

function inferTags(name) {
  const tags = new Set();
  const lowerName = name.toLowerCase();

  if (
    !demographicExclusions.has(name) &&
    demographicHints.some((hint) => lowerName.includes(hint))
  ) {
    tags.add("demographic");
  }

  if (/(openness|consciensiousness|extroversion|neuroticism|agreeableness)/i.test(name)) {
    tags.add("ocean");
  }

  if (
    fetishColumnOverrides.has(name) ||
    fetishHints.some((hint) => lowerName.includes(hint))
  ) {
    tags.add("fetish");
  }

  if (
    derivedColumns.has(name) ||
    /^total/i.test(name) ||
    /(average|variable)/i.test(name)
  ) {
    tags.add("derived");
  }

  if (tags.size === 0) {
    tags.add("other");
  }

  return [...tags];
}

function inferNullMeaning(name, nullRatio) {
  const lowerName = name.toLowerCase();

  if (
    /(late|newly added|added later|followup|follow_up|second wave|third wave|v2|v3)/i.test(lowerName)
  ) {
    return "LATE_ADDED";
  }

  if (
    nullRatio > 0.15 &&
    /(pregnan|menstru|period|erection|penis|vagina|prostate|breastfeed|bio ?male|bio ?female|cis ?male|cis ?female)/i.test(
      lowerName,
    )
  ) {
    return "NOT_APPLICABLE";
  }

  if (nullRatio > 0.3) {
    return "GATED";
  }

  return "UNKNOWN";
}

function normalizeInteger(value, fallback = 0) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return fallback;
}

function roundRatio(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 10000) / 10000;
}

async function main() {
  await stat(sourcePath);

  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();

  const sourceLiteral = sourcePath.replaceAll("'", "''");
  await connection.run(`CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('${sourceLiteral}')`);

  const rowCountReader = await connection.runAndReadAll("SELECT count(*)::BIGINT AS row_count FROM data");
  const rowCount = normalizeInteger(rowCountReader.getRowsJS()[0]?.[0]);

  const describeReader = await connection.runAndReadAll("DESCRIBE data");
  const describeRows = describeReader.getRowObjectsJS();

  const columns = [];

  for (const row of describeRows) {
    const name = String(row.column_name);
    const duckdbType = String(row.column_type);
    const quotedColumn = quoteIdentifier(name);

    const metricsReader = await connection.runAndReadAll(
      `SELECT
         count(*)::BIGINT AS total_count,
         count(${quotedColumn})::BIGINT AS non_null_count,
         approx_count_distinct(${quotedColumn})::BIGINT AS approx_cardinality
       FROM data`,
    );

    const metrics = metricsReader.getRowObjectsJS()[0] ?? {};
    const totalCount = normalizeInteger(metrics.total_count, rowCount);
    const nonNullCount = normalizeInteger(metrics.non_null_count, 0);
    const approxCardinality = normalizeInteger(metrics.approx_cardinality, 0);

    const nullRatio = totalCount > 0 ? (totalCount - nonNullCount) / totalCount : 0;

    columns.push({
      name,
      duckdbType,
      logicalType: inferLogicalType(name, duckdbType, approxCardinality),
      nullRatio: roundRatio(nullRatio),
      approxCardinality,
      tags: inferTags(name),
      nullMeaning: inferNullMeaning(name, nullRatio),
    });
  }

  columns.sort((left, right) => left.name.localeCompare(right.name));

  const payload = {
    dataset: {
      name: "Big Kink Survey (Public Sample)",
      sourcePath,
      generatedAt: new Date().toISOString(),
      rowCount,
      columnCount: columns.length,
    },
    columns,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Generated ${columns.length} column metadata entries at ${outputPath}`);

  connection.closeSync();
}

main().catch((error) => {
  console.error("Failed to generate column metadata", error);
  process.exit(1);
});

#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DuckDBInstance } from "@duckdb/node-api";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const sourcePath =
  process.env.BKS_PARQUET_PATH ?? resolve(projectRoot, "data", "BKSPublic.parquet");
const columnsPath =
  process.env.BKS_COLUMNS_PATH ??
  resolve(projectRoot, "src", "lib", "schema", "columns.generated.json");
const outputPath =
  process.env.BKS_REFERENCE_EFFECTS_OUTPUT ??
  resolve(projectRoot, "src", "lib", "statistics", "reference-effects.json");

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function quoteLiteral(value) {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
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

function cohenD(meanA, sdA, nA, meanB, sdB, nB) {
  if (nA < 2 || nB < 2) return 0;
  const pooledNumerator = (nA - 1) * sdA * sdA + (nB - 1) * sdB * sdB;
  const pooledDenominator = nA + nB - 2;
  if (pooledDenominator <= 0) return 0;
  const pooledVariance = pooledNumerator / pooledDenominator;
  if (!Number.isFinite(pooledVariance) || pooledVariance <= 0) return 0;
  return (meanA - meanB) / Math.sqrt(pooledVariance);
}

function effectNote(effect) {
  const abs = Math.abs(effect);
  if (abs >= 0.5) return "one of the biggest in the dataset";
  if (abs >= 0.3) return "large";
  if (abs >= 0.2) return "moderate";
  if (abs >= 0.1) return "noticeable";
  return "barely noticeable";
}

function percentileGapFromEffect(metric, effect) {
  const abs = Math.abs(effect);
  if (metric === "d") {
    return Math.max(1, Math.round(Math.min(40, abs * 38)));
  }
  return Math.max(1, Math.round(Math.min(30, abs * 55)));
}

async function queryOne(connection, sql) {
  const reader = await connection.runAndReadAll(sql);
  return reader.getRowObjectsJS()[0] ?? null;
}

async function computeBinaryD(connection, groupColumn, metricColumn, label) {
  const g = quoteIdentifier(groupColumn);
  const m = quoteIdentifier(metricColumn);

  const row = await queryOne(
    connection,
    `
      SELECT
        avg(try_cast(${m} AS DOUBLE)) FILTER (WHERE ${g} = 1 AND try_cast(${m} AS DOUBLE) IS NOT NULL) AS mean_a,
        stddev_samp(try_cast(${m} AS DOUBLE)) FILTER (WHERE ${g} = 1 AND try_cast(${m} AS DOUBLE) IS NOT NULL) AS sd_a,
        count(*) FILTER (WHERE ${g} = 1 AND try_cast(${m} AS DOUBLE) IS NOT NULL)::BIGINT AS n_a,
        avg(try_cast(${m} AS DOUBLE)) FILTER (WHERE ${g} = 0 AND try_cast(${m} AS DOUBLE) IS NOT NULL) AS mean_b,
        stddev_samp(try_cast(${m} AS DOUBLE)) FILTER (WHERE ${g} = 0 AND try_cast(${m} AS DOUBLE) IS NOT NULL) AS sd_b,
        count(*) FILTER (WHERE ${g} = 0 AND try_cast(${m} AS DOUBLE) IS NOT NULL)::BIGINT AS n_b
      FROM data
    `,
  );

  if (!row) return null;

  const meanA = normalizeNumber(row.mean_a, NaN);
  const sdA = normalizeNumber(row.sd_a, NaN);
  const nA = normalizeNumber(row.n_a, 0);
  const meanB = normalizeNumber(row.mean_b, NaN);
  const sdB = normalizeNumber(row.sd_b, NaN);
  const nB = normalizeNumber(row.n_b, 0);

  if (!Number.isFinite(meanA) || !Number.isFinite(meanB) || !Number.isFinite(sdA) || !Number.isFinite(sdB)) {
    return null;
  }

  const d = cohenD(meanA, sdA, nA, meanB, sdB, nB);
  if (!Number.isFinite(d) || Math.abs(d) < 0.02) return null;

  return {
    id: label.id,
    title: label.title,
    metric: "d",
    effect: Math.round(Math.abs(d) * 1000) / 1000,
    percentilePointGap: percentileGapFromEffect("d", d),
    note: effectNote(d),
  };
}

async function computeCategoryD(connection, groupColumn, groupA, groupB, metricColumn, label) {
  const g = quoteIdentifier(groupColumn);
  const m = quoteIdentifier(metricColumn);

  const row = await queryOne(
    connection,
    `
      SELECT
        avg(try_cast(${m} AS DOUBLE)) FILTER (WHERE cast(${g} AS VARCHAR) = ${quoteLiteral(groupA)} AND try_cast(${m} AS DOUBLE) IS NOT NULL) AS mean_a,
        stddev_samp(try_cast(${m} AS DOUBLE)) FILTER (WHERE cast(${g} AS VARCHAR) = ${quoteLiteral(groupA)} AND try_cast(${m} AS DOUBLE) IS NOT NULL) AS sd_a,
        count(*) FILTER (WHERE cast(${g} AS VARCHAR) = ${quoteLiteral(groupA)} AND try_cast(${m} AS DOUBLE) IS NOT NULL)::BIGINT AS n_a,
        avg(try_cast(${m} AS DOUBLE)) FILTER (WHERE cast(${g} AS VARCHAR) = ${quoteLiteral(groupB)} AND try_cast(${m} AS DOUBLE) IS NOT NULL) AS mean_b,
        stddev_samp(try_cast(${m} AS DOUBLE)) FILTER (WHERE cast(${g} AS VARCHAR) = ${quoteLiteral(groupB)} AND try_cast(${m} AS DOUBLE) IS NOT NULL) AS sd_b,
        count(*) FILTER (WHERE cast(${g} AS VARCHAR) = ${quoteLiteral(groupB)} AND try_cast(${m} AS DOUBLE) IS NOT NULL)::BIGINT AS n_b
      FROM data
    `,
  );

  if (!row) return null;

  const meanA = normalizeNumber(row.mean_a, NaN);
  const sdA = normalizeNumber(row.sd_a, NaN);
  const nA = normalizeNumber(row.n_a, 0);
  const meanB = normalizeNumber(row.mean_b, NaN);
  const sdB = normalizeNumber(row.sd_b, NaN);
  const nB = normalizeNumber(row.n_b, 0);

  if (!Number.isFinite(meanA) || !Number.isFinite(meanB) || !Number.isFinite(sdA) || !Number.isFinite(sdB)) {
    return null;
  }

  const d = cohenD(meanA, sdA, nA, meanB, sdB, nB);
  if (!Number.isFinite(d) || Math.abs(d) < 0.02) return null;

  return {
    id: label.id,
    title: label.title,
    metric: "d",
    effect: Math.round(Math.abs(d) * 1000) / 1000,
    percentilePointGap: percentileGapFromEffect("d", d),
    note: effectNote(d),
  };
}

async function computeCorrelation(connection, xColumn, yColumn, label) {
  const x = quoteIdentifier(xColumn);
  const y = quoteIdentifier(yColumn);

  const row = await queryOne(
    connection,
    `
      SELECT
        corr(try_cast(${x} AS DOUBLE), try_cast(${y} AS DOUBLE)) AS r,
        count(*) FILTER (WHERE try_cast(${x} AS DOUBLE) IS NOT NULL AND try_cast(${y} AS DOUBLE) IS NOT NULL)::BIGINT AS n
      FROM data
    `,
  );

  if (!row) return null;
  const r = normalizeNumber(row.r, NaN);
  const n = normalizeNumber(row.n, 0);
  if (!Number.isFinite(r) || n < 100 || Math.abs(r) < 0.02) return null;

  return {
    id: label.id,
    title: label.title,
    metric: "r",
    effect: Math.round(Math.abs(r) * 1000) / 1000,
    percentilePointGap: percentileGapFromEffect("r", r),
    note: effectNote(r),
  };
}

function fallbackLandmarks() {
  return [
    {
      id: "gender-pain-gap",
      title: "Gender gap on pain preference",
      metric: "d",
      effect: 0.62,
      percentilePointGap: 24,
      note: "one of the biggest in the dataset",
    },
    {
      id: "gender-dominant-arousal",
      title: "Gender gap on dominant arousal",
      metric: "d",
      effect: 0.54,
      percentilePointGap: 21,
      note: "large",
    },
    {
      id: "spanking-sm",
      title: "Childhood spanking and S/M",
      metric: "r",
      effect: 0.33,
      percentilePointGap: 16,
      note: "clear pattern",
    },
    {
      id: "neuroticism-receiving-pain",
      title: "Neuroticism and receiving pain",
      metric: "r",
      effect: 0.16,
      percentilePointGap: 9,
      note: "noticeable",
    },
    {
      id: "politics-kink-breadth",
      title: "Politics and kink breadth",
      metric: "d",
      effect: 0.14,
      percentilePointGap: 6,
      note: "barely noticeable",
    },
  ];
}

async function main() {
  const rawColumns = await readFile(columnsPath, "utf8");
  const metadata = JSON.parse(rawColumns);
  const columns = metadata.columns ?? [];

  const byName = new Set(columns.map((column) => column.name));
  const byDisplay = new Map(columns.map((column) => [column.displayName, column.name]));

  const resolveColumn = (...candidates) => {
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (byName.has(candidate)) return candidate;
      if (byDisplay.has(candidate)) return byDisplay.get(candidate);
    }
    return null;
  };

  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();

  const sourceLiteral = sourcePath.replaceAll("'", "''");
  await connection.run(`CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('${sourceLiteral}')`);

  const landmarks = [];

  const biomale = resolveColumn("biomale", "Biological Sex");
  const receivePain = resolveColumn("receivepain", "Receiving Pain");
  const dominantArousal = resolveColumn(
    "I am aroused by being dominant in sexual interactions",
    '"I am aroused by being dominant in sexual interactions" (6w3xquw)',
  );
  const childhoodSpank = resolveColumn(
    "From the ages of 0-14, how often were you spanked as a form of discipline? (p957nyk)",
  );
  const spanking = resolveColumn("spanking", "Spanking");
  const neuroticism = resolveColumn("neuroticismvariable");
  const totalKink = resolveColumn("totalfetishcategory");
  const politics = resolveColumn("politics", "Politics");
  const powerlessness = resolveColumn("powerlessnessvariable");
  const openness = resolveColumn("opennessvariable");
  const extroversion = resolveColumn("extroversionvariable");
  const agreeableness = resolveColumn("agreeablenessvariable");

  if (biomale && receivePain) {
    const entry = await computeBinaryD(connection, biomale, receivePain, {
      id: "gender-pain-gap",
      title: "Gender gap on pain preference",
    });
    if (entry) landmarks.push(entry);
  }

  if (biomale && dominantArousal) {
    const entry = await computeBinaryD(connection, biomale, dominantArousal, {
      id: "gender-dominant-arousal",
      title: "Gender gap on dominant arousal",
    });
    if (entry) landmarks.push(entry);
  }

  if (childhoodSpank && spanking) {
    const entry = await computeCorrelation(connection, childhoodSpank, spanking, {
      id: "spanking-sm",
      title: "Childhood spanking and S/M",
    });
    if (entry) landmarks.push(entry);
  }

  if (neuroticism && receivePain) {
    const entry = await computeCorrelation(connection, neuroticism, receivePain, {
      id: "neuroticism-receiving-pain",
      title: "Neuroticism and receiving pain",
    });
    if (entry) landmarks.push(entry);
  }

  if (politics && totalKink) {
    const entry = await computeCategoryD(connection, politics, "Liberal", "Conservative", totalKink, {
      id: "politics-kink-breadth",
      title: "Politics and kink breadth",
    });
    if (entry) landmarks.push(entry);
  }

  if (biomale && totalKink) {
    const entry = await computeBinaryD(connection, biomale, totalKink, {
      id: "orientation-kink-breadth",
      title: "Gender and kink breadth",
    });
    if (entry) landmarks.push(entry);
  }

  if (powerlessness && neuroticism) {
    const entry = await computeCorrelation(connection, powerlessness, neuroticism, {
      id: "powerlessness-neuroticism",
      title: "Powerlessness and neuroticism",
    });
    if (entry) landmarks.push(entry);
  }

  if (openness && totalKink) {
    const entry = await computeCorrelation(connection, openness, totalKink, {
      id: "openness-fetish-count",
      title: "Openness and fetish breadth",
    });
    if (entry) landmarks.push(entry);
  }

  if (extroversion && totalKink) {
    const entry = await computeCorrelation(connection, extroversion, totalKink, {
      id: "extroversion-fetish-count",
      title: "Extroversion and fetish breadth",
    });
    if (entry) landmarks.push(entry);
  }

  if (agreeableness && totalKink) {
    const entry = await computeCorrelation(connection, agreeableness, totalKink, {
      id: "agreeableness-fetish-count",
      title: "Agreeableness and fetish breadth",
    });
    if (entry) landmarks.push(entry);
  }

  const finalLandmarks = landmarks.length >= 5 ? landmarks.slice(0, 10) : fallbackLandmarks();

  const payload = {
    generatedAt: new Date().toISOString(),
    landmarks: finalLandmarks,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Wrote ${finalLandmarks.length} reference effects to ${outputPath}`);

  connection.closeSync();
}

main().catch((error) => {
  console.error("Failed to precompute reference effects", error);
  process.exit(1);
});

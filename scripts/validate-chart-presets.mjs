#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DuckDBInstance } from '@duckdb/node-api';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const parquetPath = resolve(projectRoot, 'data', 'BKSPublic.parquet');
const findingsPath = resolve(projectRoot, 'analysis', 'findings.json');

function toNumber(value) {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return Number(value ?? 0);
}

async function loadPresets() {
  const raw = await readFile(findingsPath, 'utf8');
  const parsed = JSON.parse(raw);
  const presets = Array.isArray(parsed.featuredPresets) ? parsed.featuredPresets : [];

  return presets.map((preset) => ({
    id: String(preset.id),
    chartType: String(preset.chartType),
    sql: String(preset.sql),
  }));
}

async function main() {
  const presets = await loadPresets();
  if (presets.length === 0) {
    console.error('No presets found in analysis/findings.json');
    process.exit(1);
  }

  const instance = await DuckDBInstance.create(':memory:');
  const connection = await instance.connect();

  const parquetLiteral = parquetPath.replaceAll("'", "''");
  await connection.run(`CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('${parquetLiteral}')`);

  let failed = false;

  for (const preset of presets) {
    try {
      const reader = await connection.runAndReadAll(preset.sql);
      const rowCount = toNumber(reader.getRowsJS().length);
      const columns = Object.keys(reader.getColumnsObjectJS());

      if (rowCount <= 0) {
        failed = true;
        console.error(`FAIL ${preset.id} rows=0 columns=[${columns.join(', ')}]`);
        continue;
      }

      console.log(`OK   ${preset.id} rows=${rowCount} columns=[${columns.join(', ')}]`);
    } catch (error) {
      failed = true;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAIL ${preset.id} query-error: ${message}`);
    }
  }

  connection.closeSync();
  instance.closeSync();

  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Validation failed', error);
  process.exit(1);
});

#!/usr/bin/env node

import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const sourcePath = process.env.BKS_PARQUET_PATH ?? resolve(projectRoot, "data", "BKSPublic.parquet");
const targetPath = process.env.BKS_PUBLIC_PARQUET_PATH ?? resolve(projectRoot, "public", "BKSPublic.parquet");

async function main() {
  await stat(sourcePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
  console.log(`Copied parquet file to ${targetPath}`);
}

main().catch((error) => {
  console.error("Failed to sync parquet into public/", error);
  process.exit(1);
});

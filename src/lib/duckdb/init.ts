import * as duckdb from "@duckdb/duckdb-wasm";

import duckdbMvpWasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbMvpWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdbEhWasm from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdbEhWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

const PARQUET_URL = "/BKSPublic.parquet";

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

async function createDb(): Promise<duckdb.AsyncDuckDB> {
  const bundles: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: duckdbMvpWasm,
      mainWorker: duckdbMvpWorker,
    },
    eh: {
      mainModule: duckdbEhWasm,
      mainWorker: duckdbEhWorker,
    },
  };

  const bundle = await duckdb.selectBundle(bundles);

  const logger = new duckdb.ConsoleLogger();
  const worker = new Worker(bundle.mainWorker!);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  await db.registerFileURL("BKSPublic.parquet", PARQUET_URL, duckdb.DuckDBDataProtocol.HTTP, false);

  const conn = await db.connect();
  await conn.query(
    `CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('BKSPublic.parquet')`,
  );
  await conn.close();

  return db;
}

export function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) {
    dbPromise = createDb();
  }
  return dbPromise;
}

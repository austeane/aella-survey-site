import * as duckdb from "@duckdb/duckdb-wasm";

import duckdbMvpWasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbMvpWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdbEhWasm from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdbEhWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

const PARQUET_URL = "/BKSPublic.parquet";

export type DuckDBInitPhase =
  | "idle"
  | "downloading-wasm"
  | "initializing"
  | "loading-parquet"
  | "ready";

type PhaseListener = (phase: DuckDBInitPhase) => void;

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
let currentPhase: DuckDBInitPhase = "idle";
const phaseListeners = new Set<PhaseListener>();

function setPhase(phase: DuckDBInitPhase): void {
  currentPhase = phase;
  for (const listener of phaseListeners) {
    listener(phase);
  }
}

export function subscribeDuckDBPhase(listener: PhaseListener): () => void {
  phaseListeners.add(listener);
  listener(currentPhase);
  return () => {
    phaseListeners.delete(listener);
  };
}

async function createDb(): Promise<duckdb.AsyncDuckDB> {
  setPhase("downloading-wasm");
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

  setPhase("initializing");
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  setPhase("loading-parquet");
  await db.registerFileURL("BKSPublic.parquet", PARQUET_URL, duckdb.DuckDBDataProtocol.HTTP, false);

  const conn = await db.connect();
  await conn.query(
    `CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('BKSPublic.parquet')`,
  );
  await conn.close();

  setPhase("ready");
  return db;
}

export function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) {
    dbPromise = createDb().catch((error) => {
      setPhase("idle");
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

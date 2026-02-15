import { appendFile, mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import type { AnalyticsEventV1 } from "@/lib/api/contracts";

const ANALYTICS_FILE_PREFIX = "events-";
const ANALYTICS_FILE_SUFFIX = ".jsonl";

let writeQueue: Promise<void> = Promise.resolve();

function resolveAnalyticsDir(): string {
  return process.env.BKS_ANALYTICS_DIR ?? resolve(process.cwd(), "data", "analytics");
}

function utcDateStamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function analyticsFilePath(date: Date): string {
  return resolve(
    resolveAnalyticsDir(),
    `${ANALYTICS_FILE_PREFIX}${utcDateStamp(date)}${ANALYTICS_FILE_SUFFIX}`,
  );
}

function eventsToJsonLines(events: AnalyticsEventV1[]): string {
  return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
}

async function ensureAnalyticsDirExists(): Promise<void> {
  await mkdir(resolveAnalyticsDir(), { recursive: true });
}

export function analyticsGlobPath(): string {
  return resolve(resolveAnalyticsDir(), `${ANALYTICS_FILE_PREFIX}*${ANALYTICS_FILE_SUFFIX}`);
}

export async function hasAnalyticsFiles(): Promise<boolean> {
  try {
    const fileNames = await readdir(resolveAnalyticsDir());
    return fileNames.some(
      (fileName) =>
        fileName.startsWith(ANALYTICS_FILE_PREFIX) && fileName.endsWith(ANALYTICS_FILE_SUFFIX),
    );
  } catch {
    return false;
  }
}

export async function appendEvents(events: AnalyticsEventV1[]): Promise<void> {
  if (events.length === 0) {
    return;
  }

  writeQueue = writeQueue
    .catch(() => {
      // Keep the queue alive after write failures.
    })
    .then(async () => {
      await ensureAnalyticsDirExists();
      await appendFile(analyticsFilePath(new Date()), eventsToJsonLines(events), "utf8");
    });

  await writeQueue;
}

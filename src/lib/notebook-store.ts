export interface NotebookEntry {
  id: string;
  title: string;
  sourceUrl?: string;
  queryDefinition: {
    type: "crosstab" | "profile" | "sql" | "stats";
    params: Record<string, unknown>;
  };
  resultsSnapshot: {
    columns?: string[];
    rows?: unknown[][];
    summary?: Record<string, unknown>;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "bks-notebook-entries";

function generateId(): string {
  return crypto.randomUUID();
}

function readEntries(): NotebookEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NotebookEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: NotebookEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getNotebookEntries(): NotebookEntry[] {
  return readEntries();
}

export function getNotebookEntry(id: string): NotebookEntry | null {
  const entries = readEntries();
  return entries.find((entry) => entry.id === id) ?? null;
}

export function addNotebookEntry(
  entry: Omit<NotebookEntry, "id" | "createdAt" | "updatedAt">,
): NotebookEntry {
  const now = new Date().toISOString();
  const newEntry: NotebookEntry = {
    ...entry,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  const entries = readEntries();
  entries.push(newEntry);
  writeEntries(entries);

  return newEntry;
}

export function updateNotebookEntry(
  id: string,
  updates: Partial<Pick<NotebookEntry, "title" | "notes">>,
): NotebookEntry | null {
  const entries = readEntries();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  const updated: NotebookEntry = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  entries[index] = updated;
  writeEntries(entries);

  return updated;
}

export function deleteNotebookEntry(id: string): boolean {
  const entries = readEntries();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return false;

  entries.splice(index, 1);
  writeEntries(entries);

  return true;
}

export function exportNotebookAsJson(): string {
  const entries = readEntries();
  return JSON.stringify(entries, null, 2);
}

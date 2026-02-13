import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getNotebookEntries,
  updateNotebookEntry,
  deleteNotebookEntry,
  exportNotebookAsJson,
  type NotebookEntry,
} from "@/lib/notebook-store";

export const Route = createFileRoute("/notebook")({
  component: NotebookPage,
});

function formatDateline(iso: string): string {
  const date = new Date(iso);
  return date
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .toUpperCase();
}

function resultsSummaryText(entry: NotebookEntry): string {
  const { resultsSnapshot } = entry;

  if (resultsSnapshot.rows && resultsSnapshot.rows.length > 0) {
    const colCount = resultsSnapshot.columns?.length ?? 0;
    return `${resultsSnapshot.rows.length} row${resultsSnapshot.rows.length === 1 ? "" : "s"}${colCount > 0 ? `, ${colCount} column${colCount === 1 ? "" : "s"}` : ""}`;
  }

  if (resultsSnapshot.summary && Object.keys(resultsSnapshot.summary).length > 0) {
    return `${Object.keys(resultsSnapshot.summary).length} summary field${Object.keys(resultsSnapshot.summary).length === 1 ? "" : "s"}`;
  }

  return "No results snapshot";
}

function NotebookPage() {
  const [entries, setEntries] = useState<NotebookEntry[]>(() =>
    getNotebookEntries().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [editNotesValue, setEditNotesValue] = useState("");

  const refreshEntries = useCallback(() => {
    setEntries(
      getNotebookEntries().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }, []);

  const handleTitleClick = useCallback((entry: NotebookEntry) => {
    setEditingTitleId(entry.id);
    setEditTitleValue(entry.title);
  }, []);

  const handleTitleBlur = useCallback(
    (id: string) => {
      updateNotebookEntry(id, { title: editTitleValue });
      setEditingTitleId(null);
      refreshEntries();
    },
    [editTitleValue, refreshEntries],
  );

  const handleNotesClick = useCallback((entry: NotebookEntry) => {
    setEditingNotesId(entry.id);
    setEditNotesValue(entry.notes);
  }, []);

  const handleNotesBlur = useCallback(
    (id: string) => {
      updateNotebookEntry(id, { notes: editNotesValue });
      setEditingNotesId(null);
      refreshEntries();
    },
    [editNotesValue, refreshEntries],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm("Delete this notebook entry? This cannot be undone.")) return;
      deleteNotebookEntry(id);
      refreshEntries();
    },
    [refreshEntries],
  );

  const handleExport = useCallback(() => {
    const json = exportNotebookAsJson();
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `bks-notebook-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(href);
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Research Notebook</h1>
        <p className="page-subtitle">
          Saved findings from explorations, profiles, and SQL queries.
        </p>
      </header>

      <section className="editorial-panel space-y-4">
        <SectionHeader number="01" title="Entries" />

        {entries.length === 0 ? (
          <div className="alert--warn alert">
            No entries yet. Add findings from Explore, Profile, or SQL pages.
          </div>
        ) : (
          <div>
            {entries.map((entry) => (
              <div key={entry.id} className="caveat-item">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {editingTitleId === entry.id ? (
                      <Input
                        autoFocus
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onBlur={() => handleTitleBlur(entry.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleTitleBlur(entry.id);
                        }}
                      />
                    ) : (
                      <h3
                        className="caveat-title cursor-pointer"
                        onClick={() => handleTitleClick(entry)}
                        title="Click to edit title"
                      >
                        {entry.title}
                      </h3>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="null-badge">
                        {entry.queryDefinition.type}
                      </span>
                      <span className="dateline">
                        {formatDateline(entry.createdAt)}
                      </span>
                      {entry.sourceUrl && (entry.sourceUrl.startsWith("/") || entry.sourceUrl.startsWith("http")) ? (
                        <a
                          className="mono-value text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
                          href={entry.sourceUrl}
                        >
                          Open source
                        </a>
                      ) : null}
                    </div>

                    <p className="mono-value mt-1.5 text-[var(--ink-faded)]">
                      {resultsSummaryText(entry)}
                    </p>

                    <div className="mt-2">
                      {editingNotesId === entry.id ? (
                        <Textarea
                          autoFocus
                          className="min-h-[60px]"
                          value={editNotesValue}
                          onChange={(e) => setEditNotesValue(e.target.value)}
                          onBlur={() => handleNotesBlur(entry.id)}
                        />
                      ) : (
                        <p
                          className="caveat-description cursor-pointer"
                          onClick={() => handleNotesClick(entry)}
                          title="Click to edit notes"
                        >
                          {entry.notes || "Click to add notes..."}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                    type="button"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="raised-panel space-y-4">
        <SectionHeader number="02" title="Export" />
        <Button
          variant="default"
          onClick={handleExport}
          disabled={entries.length === 0}
          type="button"
        >
          Export as JSON
        </Button>
      </section>
    </div>
  );
}

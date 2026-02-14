import { createFileRoute, Link } from "@tanstack/react-router";

import { SectionHeader } from "@/components/section-header";

const CLAUDE_DESKTOP_MCP_CONFIG = `{
  "mcpServers": {
    "bks": {
      "type": "streamable-http",
      "url": "https://bks-mcp-server-production.up.railway.app/mcp"
    }
  }
}`;

const CURSOR_MCP_CONFIG = `{
  "mcpServers": {
    "bks": {
      "transport": "streamable-http",
      "url": "https://bks-mcp-server-production.up.railway.app/mcp"
    }
  }
}`;

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <header className="page-header">
        <h1 className="page-title">About This Project</h1>
        <p className="page-subtitle">
          Interactive research explorer for a large publicly available dataset
          on human sexuality, kinks, and personality.
        </p>
      </header>

      <section className="editorial-panel space-y-5">
        <SectionHeader number="01" title="The Survey" />

        <p>
          The Big Kink Survey was created and administered by{" "}
          <a
            href="https://aella.substack.com/p/heres-my-big-kink-survey-dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
          >
            Aella
          </a>
          , collecting responses from hundreds of thousands of participants.
          Topics span sexual interests and kinks, personality traits (OCEAN
          model), demographics, political orientation, relationship structures,
          and psychological characteristics.
        </p>

        <p>
          The publicly released dataset powering this explorer is an anonymized
          subset of the original responses. To protect participant privacy, the
          published data is limited to respondents aged 18–32 from Western
          countries (US, Canada, and Europe), and has been processed with
          aggressive binning, demographic column removal, and noise injection.
        </p>

        <p>
          These privacy measures attenuate correlations by roughly 15–30%
          compared to the original, depending on the variable. The dataset
          supports directional exploration and pattern discovery, not precise
          point estimates.
        </p>
      </section>

      <section className="editorial-panel space-y-5">
        <SectionHeader number="02" title="The Dataset We Work With" />

        <div className="stat-grid grid-cols-1 md:grid-cols-3">
          <div className="stat-cell">
            <span className="stat-cell-value">~15,500</span>
            <span className="stat-cell-label">Respondents</span>
          </div>
          <div className="stat-cell">
            <span className="stat-cell-value">365</span>
            <span className="stat-cell-label">Questions</span>
          </div>
          <div className="stat-cell">
            <span className="stat-cell-value">5</span>
            <span className="stat-cell-label">Variable Categories</span>
          </div>
        </div>

        <p>
          The columns span five broad categories: <strong>demographic</strong>{" "}
          variables (age, gender, orientation, politics, religion),{" "}
          <strong>OCEAN</strong> personality traits and sub-scales,{" "}
          <strong>fetish</strong> interest ratings across dozens of categories,{" "}
          <strong>derived</strong> composite scores, and{" "}
          <strong>other</strong> variables covering relationship style,
          mental health indicators, and behavioral patterns.
        </p>

        <p>
          Not every respondent answered every question. Many columns have
          significant missingness: some questions were conditionally shown
          (gated), some were added partway through the survey (late-added),
          and some are missing for reasons we can only label unknown. This
          explorer surfaces missingness metadata throughout so you can judge
          reliability yourself.
        </p>
      </section>

      <section className="editorial-panel space-y-5">
        <SectionHeader number="03" title="What This Explorer Does" />

        <p>
          This tool loads the full parquet dataset into{" "}
          <strong>DuckDB-WASM</strong> directly in your browser. Every query
          runs locally. You can explore the full dataset without setting up a
          local analysis environment.
        </p>

        <div className="space-y-3 border-l-2 border-[var(--rule)] pl-4">
          <div>
            <Link
              to="/"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Home
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Start with curated findings and plain-language takeaways.
            </span>
          </div>
          <div>
            <Link
              to="/explore"
              search={{ x: undefined, y: undefined }}
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Explore
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Compare two questions visually, adjust counting mode, and drill into selected groups.
            </span>
          </div>
          <div>
            <Link
              to="/columns"
              search={{ column: undefined, q: undefined, tags: undefined, sort: undefined }}
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Browse Topics
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Browse and search all 365 questions with topic filters and data-note summaries.
            </span>
          </div>
          <div>
            <Link
              to="/profile"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Build a Profile
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Define one or two groups and see what is unusually common in each.
            </span>
          </div>
          <div>
            <Link
              to="/relationships"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              What's Connected?
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Precomputed question-to-question connection strength rankings.
            </span>
          </div>
          <div>
            <Link
              to="/data-quality"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Data Quality
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Deep diagnostics: missing answers, caveats, and question metadata.
            </span>
          </div>
          <div>
            <Link
              to="/sql"
              search={{ sql: undefined }}
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              SQL Console
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Write arbitrary read-only DuckDB SQL against the dataset with
              templates, click-to-insert column names, and CSV export.
            </span>
          </div>
          <div>
            <Link
              to="/notebook"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Notebook
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Save interesting findings from any page and export them as JSON.
            </span>
          </div>
        </div>
      </section>

      <section className="editorial-panel space-y-5">
        <SectionHeader number="04" title="Try This" />

        <div className="space-y-3 border-l-2 border-[var(--rule)] pl-4">
          <div>
            <Link
              to="/explore"
              search={{ x: "straightness", y: "politics" }}
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Explore orientation vs politics
            </Link>
          </div>
          <div>
            <Link
              to="/explore"
              search={{ x: "biomale", y: "Personally, your preferred relationship style is: (4jib23m)" }}
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Compare gender and relationship style
            </Link>
          </div>
          <div>
            <Link
              to="/relationships"
              search={{ column: "straightness" }}
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Jump to strongest associations for straightness
            </Link>
          </div>
        </div>
      </section>

      <section className="editorial-panel space-y-5">
        <SectionHeader number="05" title="Caveats & Interpretation" />

        <ul className="list-none space-y-3 pl-0">
          <li className="border-l-2 border-[var(--accent)] pl-3">
            <strong>Self-selected sample.</strong> Respondents opted in — this
            is not a probability sample of any population. Patterns describe
            this group of respondents, not humanity at large.
          </li>
          <li className="border-l-2 border-[var(--accent)] pl-3">
            <strong>Attenuated correlations.</strong> The anonymization process
            (noise injection, binning) weakens real relationships. If you see a
            moderate association, the true association in the original data was
            likely stronger.
          </li>
          <li className="border-l-2 border-[var(--accent)] pl-3">
            <strong>Missingness is informative.</strong> A column with 60% null
            values tells you something. The pattern of who answered may itself
            be meaningful. Check the missingness badges throughout the explorer.
          </li>
        </ul>
      </section>

      <section className="editorial-panel space-y-5">
        <SectionHeader number="06" title="Credits & Links" />

        <div className="space-y-3">
          <p>
            <strong>Dataset creator:</strong>{" "}
            <a
              href="https://aella.substack.com/p/heres-my-big-kink-survey-dataset"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Aella — "Here's My Big Kink Survey Dataset"
            </a>
          </p>
          <p>
            <strong>Data host:</strong>{" "}
            <a
              href="https://zenodo.org/records/18625249"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Zenodo (DOI: 10.5281/zenodo.18625249)
            </a>
          </p>
          <p>
            <strong>Take the survey:</strong>{" "}
            <a
              href="https://www.guidedtrack.com/programs/u4m797m/run"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              GuidedTrack — Big Kink Survey
            </a>
          </p>
          <p>
            <strong>Explorer built with:</strong>{" "}
            <span className="mono-value">
              TanStack Start, React, DuckDB-WASM, Tailwind
            </span>
          </p>
        </div>
      </section>

      <section className="editorial-panel space-y-5">
        <SectionHeader number="07" title="For AI Agents" />

        <p>
          This explorer exposes both a REST API and an MCP server so AI clients
          can inspect schema metadata, retrieve summaries, and run bounded
          read-only queries against the same dataset that powers the UI.
        </p>

        <div className="space-y-2 border-l-2 border-[var(--accent)] pl-3">
          <span className="mono-label text-[var(--ink-faded)]">MCP SERVER</span>
          <a
            href="https://bks-mcp-server-production.up.railway.app/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="mono-value text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
          >
            https://bks-mcp-server-production.up.railway.app/mcp
          </a>
        </div>

        <div className="space-y-2 border-l-2 border-[var(--rule)] pl-4">
          <p>
            <span className="mono-value">get_schema</span>
            <span className="ml-2 text-[var(--ink-faded)]">
              Return dataset row/column counts and column metadata.
            </span>
          </p>
          <p>
            <span className="mono-value">get_stats</span>
            <span className="ml-2 text-[var(--ink-faded)]">
              Compute typed summary statistics for one column.
            </span>
          </p>
          <p>
            <span className="mono-value">cross_tabulate</span>
            <span className="ml-2 text-[var(--ink-faded)]">
              Build an x/y cross-tab matrix with marginals.
            </span>
          </p>
          <p>
            <span className="mono-value">query_data</span>
            <span className="ml-2 text-[var(--ink-faded)]">
              Execute bounded read-only DuckDB SQL.
            </span>
          </p>
          <p>
            <span className="mono-value">search_columns</span>
            <span className="ml-2 text-[var(--ink-faded)]">
              Find columns by partial name.
            </span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="mono-label text-[var(--ink-faded)]">
              Claude Desktop config
            </p>
            <pre className="overflow-x-auto border border-[var(--rule)] bg-[var(--sidebar-bg)] p-4 text-sm leading-6 text-[var(--ink-light)]">
              <code className="font-['JetBrains_Mono',monospace]">
                {CLAUDE_DESKTOP_MCP_CONFIG}
              </code>
            </pre>
          </div>

          <div className="space-y-2">
            <p className="mono-label text-[var(--ink-faded)]">Cursor config</p>
            <pre className="overflow-x-auto border border-[var(--rule)] bg-[var(--sidebar-bg)] p-4 text-sm leading-6 text-[var(--ink-light)]">
              <code className="font-['JetBrains_Mono',monospace]">
                {CURSOR_MCP_CONFIG}
              </code>
            </pre>
          </div>
        </div>

        <div className="space-y-2 border-l-2 border-[var(--rule)] pl-4">
          <p className="mono-label text-[var(--ink-faded)]">
            REST fallback endpoints
          </p>
          <p>
            <span className="mono-value">GET /api/schema</span>
            <span className="ml-2 text-[var(--ink-faded)]">
              Dataset metadata + column definitions.
            </span>
          </p>
          <p>
            <span className="mono-value">POST /api/query</span>
            <span className="ml-2 text-[var(--ink-faded)]">
              Bounded read-only SQL query execution.
            </span>
          </p>
          <p>
            <span className="mono-value">GET /api/stats/:column</span>
            <span className="ml-2 text-[var(--ink-faded)]">
              Numeric/categorical summary stats for one field.
            </span>
          </p>
          <p>
            <span className="mono-value">GET /api/crosstab</span>
            <span className="ml-2 text-[var(--ink-faded)]">
              Grouped counts for two selected columns.
            </span>
          </p>
        </div>

        <p>
          Machine-readable endpoint for agent discovery:{" "}
          <a
            href="/llms.txt"
            className="mono-value text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
          >
            /llms.txt
          </a>
        </p>
      </section>
    </div>
  );
}

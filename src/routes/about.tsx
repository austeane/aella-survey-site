import { createFileRoute, Link } from "@tanstack/react-router";

import { SectionHeader } from "@/components/section-header";

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
            <span className="stat-value">~15,500</span>
            <span className="stat-label">Respondents</span>
          </div>
          <div className="stat-cell">
            <span className="stat-value">365</span>
            <span className="stat-label">Columns</span>
          </div>
          <div className="stat-cell">
            <span className="stat-value">5</span>
            <span className="stat-label">Variable Categories</span>
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
              Dashboard
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Dataset shape, caveats, missingness, and high-signal variables.
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
              — Cross-tabulate any two variables with normalization, Cramer's V
              association strength, demographic filters, and cell drilldown.
            </span>
          </div>
          <div>
            <Link
              to="/columns"
              search={{ column: undefined, q: undefined, tags: undefined, sort: undefined }}
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Columns
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Browse and search all 365 columns with tag filters, sort by
              missingness or cardinality, and inspect individual variable
              distributions.
            </span>
          </div>
          <div>
            <Link
              to="/profile"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Profile
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Define a demographic cohort and see what over-indexes against the
              full dataset. Compare two cohorts side by side.
            </span>
          </div>
          <div>
            <Link
              to="/relationships"
              className="text-[var(--accent)] underline decoration-[var(--rule)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              Relationships
            </Link>
            <span className="mono-value ml-2 text-[var(--ink-faded)]">
              — Precomputed Cramer's V and Pearson correlations ranked by
              association strength.
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
        <SectionHeader number="04" title="Caveats & Interpretation" />

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
            <strong>Small-cell suppression.</strong> This explorer suppresses
            counts below 10 to prevent identification of small groups. If you
            see "[suppressed]" in a table, the count was too low to display
            safely.
          </li>
          <li className="border-l-2 border-[var(--accent)] pl-3">
            <strong>Missingness is informative.</strong> A column with 60% null
            values tells you something. The pattern of who answered may itself
            be meaningful. Check the missingness badges throughout the explorer.
          </li>
        </ul>
      </section>

      <section className="editorial-panel space-y-5">
        <SectionHeader number="05" title="Credits & Links" />

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
            <strong>Explorer built with:</strong>{" "}
            <span className="mono-value">
              TanStack Start, React, DuckDB-WASM, Tailwind
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}

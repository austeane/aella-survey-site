# Analysis Workspace

Reproducible data exploration + curated findings generation for the Big Kink Survey parquet.

## What this workspace provides

- `analysis/explore.py`: schema/type profile + quick top-value inspection for high-traffic columns.
- `analysis/build_findings.py`: executes curated finding queries and writes:
  - `analysis/findings.json`
  - `docs/schema/interesting-findings.md`
- `analysis/toolkit.py`: **statistical analysis toolkit** with rigorous methods:
  - **Effect sizes**: Cohen's d, Cramér's V, Pearson r with confidence intervals
  - **Bootstrap**: confidence intervals for means, group differences
  - **Multivariate controls**: OLS regression controlling for confounds
  - **Interaction tests**: two-way ANOVA for factor interactions
  - **Clustering**: K-means profiling with elbow method
  - **Scanning**: automated pairwise correlation and group-difference ranking
  - **Missingness diagnostics**: per-group missingness rates, pairwise overlap
  - **Robustness**: winsorized means, multi-binning sensitivity checks
- `analysis/tests/`: pytest guardrails for findings and toolkit.
- `analysis/swarm/`: output from parallel exploration agents.

## Prerequisites

- `uv` installed (`uv --version`)

## Bootstrap

```bash
uv sync --project analysis
```

## Commands

Run exploratory profiling:

```bash
uv run --project analysis python analysis/explore.py --show-values
```

Build curated findings artifacts:

```bash
uv run --project analysis python analysis/build_findings.py
```

Run all tests:

```bash
uv run --project analysis pytest analysis/tests -v
```

## Using the Toolkit

```python
from analysis.toolkit import load_data, bootstrap_ci, cohens_d, scan_group_diffs

# Load specific columns
df = load_columns(["biomale", "sadomasochism", "politics"])

# Bootstrap confidence interval
ci = bootstrap_ci(df["sadomasochism"])
# → {"estimate": 3.40, "ci_low": 3.36, "ci_high": 3.43, "n": 5217}

# Effect size between groups
d = cohens_d(
    df.loc[df["biomale"] == 1, "sadomasochism"],
    df.loc[df["biomale"] == 0, "sadomasochism"],
)
# → -0.114 (small effect)

# Scan all outcomes by a grouping variable
diffs = scan_group_diffs(df, "politics", ["sadomasochism"])
# → DataFrame sorted by effect size

# Controlled regression
from analysis.toolkit import controlled_means
cm = controlled_means(df, "sadomasochism", "politics", ["biomale", "straightness"])
# → adjusted coefficients, R², p-values

# Interaction test (two-way ANOVA)
from analysis.toolkit import interaction_test
ix = interaction_test(df, "sadomasochism", "politics", "sex")
# → F-tests for main effects and interaction

# Clustering
from analysis.toolkit import cluster_profiles
# Use a focused set of columns (all-NaN rows are dropped)
result = cluster_profiles(df, columns=["sadomasochism", "nonconsent", "lightbondage"], n_clusters=4)

# Robustness check with different binnings
from analysis.toolkit import compare_binnings
bins = compare_binnings(df, "agreeablenessvariable", "lightbondage")
# → tertiles, quartiles, quintiles all computed
```

## Notes

- All SQL is run against `data/BKSPublic.parquet` via an in-memory DuckDB view named `data`.
- `analysis/findings.json` is the canonical machine-readable source for featured findings, home question cards, page defaults, and plain-language term mappings.
- **Clustering caveat**: `cluster_profiles()` drops rows with ANY NaN in selected columns. With many kink columns, this can reduce N dramatically due to gated questions. Use a focused column subset (5-10 columns) for meaningful clusters.
- The toolkit is designed for agent use — all functions return plain dicts/DataFrames, no plotting.

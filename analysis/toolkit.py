"""Statistical analysis toolkit for the Big Kink Survey.

Provides reusable functions for rigorous analysis beyond simple GROUP BY averages.
All functions work with pandas DataFrames pulled from the parquet via DuckDB.

Usage:
    from analysis.toolkit import load_data, bootstrap_ci, cohens_d, cramers_v
    conn, df = load_data()
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import duckdb
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from analysis.explore import DEFAULT_PARQUET_PATH, connect_data, quote_identifier

# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_data(
    parquet_path: Path = DEFAULT_PARQUET_PATH,
    columns: list[str] | None = None,
) -> tuple[duckdb.DuckDBPyConnection, pd.DataFrame]:
    """Load the parquet into a DuckDB connection and return a full DataFrame.

    Returns (connection, dataframe). The connection has a `data` view.
    If columns is provided, only those columns are loaded into the DataFrame.
    """
    conn = connect_data(parquet_path)
    if columns:
        quoted = ", ".join(quote_identifier(c) for c in columns)
        df = conn.execute(f"SELECT {quoted} FROM data").fetchdf()
    else:
        df = conn.execute("SELECT * FROM data").fetchdf()
    return conn, df


def load_columns(
    columns: list[str],
    parquet_path: Path = DEFAULT_PARQUET_PATH,
) -> pd.DataFrame:
    """Load specific columns into a DataFrame (no connection returned)."""
    conn = connect_data(parquet_path)
    try:
        quoted = ", ".join(quote_identifier(c) for c in columns)
        return conn.execute(f"SELECT {quoted} FROM data").fetchdf()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Effect sizes
# ---------------------------------------------------------------------------

def cohens_d(group_a: pd.Series, group_b: pd.Series) -> float:
    """Compute Cohen's d effect size between two groups.

    Returns the standardized mean difference. Convention:
    |d| < 0.2 = negligible, 0.2-0.5 = small, 0.5-0.8 = medium, > 0.8 = large.
    """
    a = group_a.dropna()
    b = group_b.dropna()
    if len(a) < 2 or len(b) < 2:
        return float("nan")
    pooled_std = np.sqrt(((len(a) - 1) * a.std() ** 2 + (len(b) - 1) * b.std() ** 2) / (len(a) + len(b) - 2))
    if pooled_std == 0:
        return 0.0
    return float((a.mean() - b.mean()) / pooled_std)


def cramers_v(x: pd.Series, y: pd.Series) -> float:
    """Compute Cramér's V association between two categorical Series.

    Returns a value between 0 (no association) and 1 (perfect association).
    """
    x_clean = x.dropna()
    y_clean = y.dropna()
    common = x_clean.index.intersection(y_clean.index)
    if len(common) < 10:
        return float("nan")
    contingency = pd.crosstab(x_clean[common], y_clean[common])
    chi2 = stats.chi2_contingency(contingency)[0]
    n = contingency.sum().sum()
    min_dim = min(contingency.shape) - 1
    if min_dim == 0 or n == 0:
        return 0.0
    return float(np.sqrt(chi2 / (n * min_dim)))


def pearson_with_ci(
    x: pd.Series,
    y: pd.Series,
    confidence: float = 0.95,
) -> dict[str, float]:
    """Pearson correlation with confidence interval via Fisher z-transform."""
    mask = x.notna() & y.notna()
    x_clean = x[mask].astype(float)
    y_clean = y[mask].astype(float)
    n = len(x_clean)
    if n < 10:
        return {"r": float("nan"), "p": float("nan"), "ci_low": float("nan"), "ci_high": float("nan"), "n": n}
    r, p = stats.pearsonr(x_clean, y_clean)
    # Fisher z-transform for CI
    z = np.arctanh(r)
    se = 1 / np.sqrt(n - 3)
    z_crit = stats.norm.ppf((1 + confidence) / 2)
    ci_low = np.tanh(z - z_crit * se)
    ci_high = np.tanh(z + z_crit * se)
    return {"r": float(r), "p": float(p), "ci_low": float(ci_low), "ci_high": float(ci_high), "n": n}


# ---------------------------------------------------------------------------
# Bootstrap confidence intervals
# ---------------------------------------------------------------------------

def bootstrap_ci(
    series: pd.Series,
    stat_func=np.mean,
    n_boot: int = 2000,
    confidence: float = 0.95,
    seed: int = 42,
) -> dict[str, float]:
    """Bootstrap confidence interval for any statistic.

    Args:
        series: Data to bootstrap.
        stat_func: Statistic function (default: np.mean).
        n_boot: Number of bootstrap resamples.
        confidence: Confidence level.
        seed: Random seed for reproducibility.

    Returns dict with keys: estimate, ci_low, ci_high, n.
    """
    data = series.dropna().values
    n = len(data)
    if n < 5:
        return {"estimate": float("nan"), "ci_low": float("nan"), "ci_high": float("nan"), "n": n}

    rng = np.random.default_rng(seed)
    boot_stats = np.array([
        stat_func(rng.choice(data, size=n, replace=True))
        for _ in range(n_boot)
    ])
    alpha = (1 - confidence) / 2
    ci_low, ci_high = np.quantile(boot_stats, [alpha, 1 - alpha])
    return {
        "estimate": float(stat_func(data)),
        "ci_low": float(ci_low),
        "ci_high": float(ci_high),
        "n": n,
    }


def bootstrap_diff(
    group_a: pd.Series,
    group_b: pd.Series,
    stat_func=np.mean,
    n_boot: int = 2000,
    confidence: float = 0.95,
    seed: int = 42,
) -> dict[str, float]:
    """Bootstrap confidence interval for the DIFFERENCE in a statistic between two groups.

    Returns dict with: diff, ci_low, ci_high, n_a, n_b, significant (CI excludes 0).
    """
    a = group_a.dropna().values
    b = group_b.dropna().values
    if len(a) < 5 or len(b) < 5:
        return {"diff": float("nan"), "ci_low": float("nan"), "ci_high": float("nan"),
                "n_a": len(a), "n_b": len(b), "significant": False}

    rng = np.random.default_rng(seed)
    diffs = np.array([
        stat_func(rng.choice(a, size=len(a), replace=True)) -
        stat_func(rng.choice(b, size=len(b), replace=True))
        for _ in range(n_boot)
    ])
    alpha = (1 - confidence) / 2
    ci_low, ci_high = np.quantile(diffs, [alpha, 1 - alpha])
    return {
        "diff": float(stat_func(a) - stat_func(b)),
        "ci_low": float(ci_low),
        "ci_high": float(ci_high),
        "n_a": len(a),
        "n_b": len(b),
        "significant": bool(ci_low > 0 or ci_high < 0),
    }


# ---------------------------------------------------------------------------
# Multivariate controls
# ---------------------------------------------------------------------------

def controlled_means(
    df: pd.DataFrame,
    outcome: str,
    predictor: str,
    controls: list[str],
) -> dict[str, Any]:
    """Compare outcome across predictor levels, controlling for covariates via OLS.

    Uses dummy-coded regression: outcome ~ predictor + controls.
    Returns the adjusted effect of each predictor level vs reference.
    """
    import statsmodels.formula.api as smf

    subset = df[[outcome, predictor] + controls].dropna()
    if len(subset) < 30:
        return {"error": "Too few complete cases", "n": len(subset)}

    # Ensure predictor is categorical
    subset[predictor] = subset[predictor].astype(str)
    for c in controls:
        if subset[c].dtype == object:
            subset[c] = subset[c].astype("category")

    formula = f"Q('{outcome}') ~ C(Q('{predictor}'))"
    for c in controls:
        if subset[c].dtype.name == "category":
            formula += f" + C(Q('{c}'))"
        else:
            formula += f" + Q('{c}')"

    model = smf.ols(formula, data=subset).fit()
    return {
        "n": len(subset),
        "r_squared": float(model.rsquared),
        "predictor_coeffs": {
            k: {"coef": float(v), "pvalue": float(model.pvalues[k])}
            for k, v in model.params.items()
            if predictor in k
        },
        "summary_snippet": str(model.summary().tables[1]),
    }


# ---------------------------------------------------------------------------
# Missingness diagnostics
# ---------------------------------------------------------------------------

def missingness_by_group(
    df: pd.DataFrame,
    target_column: str,
    group_column: str,
) -> pd.DataFrame:
    """Check if missingness in target_column differs by group_column.

    Returns a DataFrame with group, n_total, n_missing, pct_missing.
    Useful for detecting gated-column bias.
    """
    grouped = df.groupby(group_column).agg(
        n_total=(target_column, "size"),
        n_missing=(target_column, lambda x: x.isna().sum()),
    ).reset_index()
    grouped["pct_missing"] = (grouped["n_missing"] / grouped["n_total"] * 100).round(1)
    return grouped


def missingness_matrix(
    df: pd.DataFrame,
    columns: list[str],
) -> pd.DataFrame:
    """Pairwise missingness overlap matrix.

    Cell (i,j) = fraction of rows where BOTH columns i and j are non-null.
    Diagonal = fraction non-null for that column.
    """
    result = pd.DataFrame(index=columns, columns=columns, dtype=float)
    n = len(df)
    for i, ci in enumerate(columns):
        for j, cj in enumerate(columns):
            if i == j:
                result.loc[ci, cj] = float(df[ci].notna().sum()) / n
            else:
                result.loc[ci, cj] = float((df[ci].notna() & df[cj].notna()).sum()) / n
    return result


# ---------------------------------------------------------------------------
# Clustering / segmentation
# ---------------------------------------------------------------------------

KINK_INTENSITY_COLUMNS = [
    "sadomasochism", "lightbondage", "mediumbondage", "extremebondage",
    "nonconsent", "humiliation", "obedience", "powerdynamic",
    "genderplay", "multiplepartners", "gentleness",
    "exhibitionself", "exhibitionother", "voyeurself", "voyeurother",
    "brutality", "creepy", "dirty", "vore", "bestiality",
    "receivepain", "givepain", "clothing", "eagerness",
    "mentalalteration", "pregnancy", "transform", "abnormalbody",
    "cunnilingus", "secretions", "sensory", "incest", "agegap",
    "cgl", "futa", "supernatural", "mythical", "normalsex",
]


def cluster_profiles(
    df: pd.DataFrame,
    columns: list[str] | None = None,
    n_clusters: int = 5,
    seed: int = 42,
) -> dict[str, Any]:
    """K-means clustering on kink intensity columns.

    Returns cluster assignments and per-cluster mean profiles.
    Rows with any NaN in the selected columns are dropped.
    """
    cols = columns or KINK_INTENSITY_COLUMNS
    available = [c for c in cols if c in df.columns]
    subset = df[available].dropna()

    if len(subset) < n_clusters * 10:
        return {"error": "Too few complete rows for clustering", "n": len(subset)}

    scaler = StandardScaler()
    scaled = scaler.fit_transform(subset)

    km = KMeans(n_clusters=n_clusters, random_state=seed, n_init=10)
    labels = km.fit_predict(scaled)

    subset = subset.copy()
    subset["cluster"] = labels

    profiles = subset.groupby("cluster")[available].mean().round(2)
    sizes = subset["cluster"].value_counts().sort_index()

    return {
        "n_rows": len(subset),
        "n_clusters": n_clusters,
        "cluster_sizes": sizes.to_dict(),
        "cluster_profiles": profiles.to_dict(orient="index"),
        "labels": labels,
        "inertia": float(km.inertia_),
    }


def find_optimal_k(
    df: pd.DataFrame,
    columns: list[str] | None = None,
    k_range: range = range(2, 11),
    seed: int = 42,
) -> list[dict[str, Any]]:
    """Elbow method: compute inertia for a range of k values."""
    cols = columns or KINK_INTENSITY_COLUMNS
    available = [c for c in cols if c in df.columns]
    subset = df[available].dropna()

    scaler = StandardScaler()
    scaled = scaler.fit_transform(subset)

    results = []
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=seed, n_init=10)
        km.fit(scaled)
        results.append({"k": k, "inertia": float(km.inertia_), "n": len(subset)})
    return results


# ---------------------------------------------------------------------------
# Pairwise association scanning
# ---------------------------------------------------------------------------

def scan_correlations(
    df: pd.DataFrame,
    x_columns: list[str],
    y_columns: list[str],
) -> pd.DataFrame:
    """Compute Pearson r for every (x, y) pair. Returns sorted by |r|.

    Only numeric columns are correlated. Pairs with < 100 shared non-null
    observations are skipped.
    """
    rows = []
    for xc in x_columns:
        if xc not in df.columns:
            continue
        for yc in y_columns:
            if yc not in df.columns or xc == yc:
                continue
            mask = df[xc].notna() & df[yc].notna()
            n = mask.sum()
            if n < 100:
                continue
            r, p = stats.pearsonr(df.loc[mask, xc].astype(float), df.loc[mask, yc].astype(float))
            rows.append({"x": xc, "y": yc, "r": round(r, 4), "abs_r": round(abs(r), 4), "p": p, "n": int(n)})
    return pd.DataFrame(rows).sort_values("abs_r", ascending=False).reset_index(drop=True)


def scan_group_diffs(
    df: pd.DataFrame,
    group_column: str,
    outcome_columns: list[str],
) -> pd.DataFrame:
    """For a categorical grouping variable, compute mean outcome by group and effect size.

    Returns a DataFrame sorted by largest effect size (max_diff / pooled_std).
    """
    groups = df[group_column].dropna().unique()
    if len(groups) < 2 or len(groups) > 10:
        return pd.DataFrame()

    rows = []
    for oc in outcome_columns:
        if oc not in df.columns:
            continue
        group_means = {}
        group_ns = {}
        for g in sorted(groups):
            vals = df.loc[df[group_column] == g, oc].dropna()
            if len(vals) < 20:
                continue
            group_means[str(g)] = float(vals.mean())
            group_ns[str(g)] = len(vals)
        if len(group_means) < 2:
            continue
        max_diff = max(group_means.values()) - min(group_means.values())
        overall_std = df[oc].dropna().std()
        effect = max_diff / overall_std if overall_std > 0 else 0
        rows.append({
            "outcome": oc,
            "max_diff": round(max_diff, 3),
            "effect_size": round(effect, 3),
            "group_means": group_means,
            "group_ns": group_ns,
        })
    return pd.DataFrame(rows).sort_values("effect_size", ascending=False).reset_index(drop=True)


# ---------------------------------------------------------------------------
# Interaction effects
# ---------------------------------------------------------------------------

def interaction_test(
    df: pd.DataFrame,
    outcome: str,
    factor_a: str,
    factor_b: str,
) -> dict[str, Any]:
    """Test for interaction between two categorical factors on a numeric outcome.

    Uses two-way ANOVA (Type II) via statsmodels.
    Returns main effects and interaction F-test results.
    """
    import statsmodels.formula.api as smf
    from statsmodels.stats.anova import anova_lm

    subset = df[[outcome, factor_a, factor_b]].dropna()
    subset[factor_a] = subset[factor_a].astype(str)
    subset[factor_b] = subset[factor_b].astype(str)

    if len(subset) < 30:
        return {"error": "Too few observations", "n": len(subset)}

    formula = f"Q('{outcome}') ~ C(Q('{factor_a}')) * C(Q('{factor_b}'))"
    model = smf.ols(formula, data=subset).fit()
    anova = anova_lm(model, typ=2)

    results = {}
    for idx in anova.index:
        if "Residual" in str(idx):
            continue
        results[str(idx)] = {
            "F": round(float(anova.loc[idx, "F"]), 3) if not pd.isna(anova.loc[idx, "F"]) else None,
            "p": float(anova.loc[idx, "PR(>F)"]) if not pd.isna(anova.loc[idx, "PR(>F)"]) else None,
        }

    # Cell means
    cell_means = subset.groupby([factor_a, factor_b])[outcome].agg(["mean", "count"]).round(3)

    return {
        "n": len(subset),
        "anova": results,
        "cell_means": cell_means.to_dict(orient="index"),
    }


# ---------------------------------------------------------------------------
# Robustness checks
# ---------------------------------------------------------------------------

def winsorized_mean(series: pd.Series, limits: tuple[float, float] = (0.05, 0.05)) -> float:
    """Winsorized mean — trims extreme values instead of removing them."""
    clean = series.dropna().values
    if len(clean) < 10:
        return float("nan")
    return float(stats.mstats.winsorize(clean, limits=limits).mean())


def compare_binnings(
    df: pd.DataFrame,
    numeric_col: str,
    outcome_col: str,
    bin_schemes: dict[str, list[float]] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    """Check if results are robust to different binning of a numeric variable.

    Default bin schemes: tertiles, quartiles, quintiles.
    """
    if bin_schemes is None:
        vals = df[numeric_col].dropna()
        bin_schemes = {
            "tertiles": list(np.quantile(vals, [0, 1/3, 2/3, 1])),
            "quartiles": list(np.quantile(vals, [0, 0.25, 0.5, 0.75, 1])),
            "quintiles": list(np.quantile(vals, [0, 0.2, 0.4, 0.6, 0.8, 1])),
        }

    results = {}
    for scheme_name, bins in bin_schemes.items():
        df_temp = df[[numeric_col, outcome_col]].dropna().copy()
        df_temp["bin"] = pd.cut(df_temp[numeric_col], bins=bins, include_lowest=True)
        grouped = df_temp.groupby("bin", observed=True)[outcome_col].agg(["mean", "count"])
        results[scheme_name] = [
            {"bin": str(idx), "mean": round(float(row["mean"]), 3), "n": int(row["count"])}
            for idx, row in grouped.iterrows()
        ]
    return results

"""Tests for the statistical analysis toolkit."""
from __future__ import annotations

from pathlib import Path
import sys

import numpy as np
import pandas as pd
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from analysis.toolkit import (
    bootstrap_ci,
    bootstrap_diff,
    cohens_d,
    cramers_v,
    load_columns,
    pearson_with_ci,
    scan_correlations,
    scan_group_diffs,
    missingness_by_group,
    winsorized_mean,
    compare_binnings,
    KINK_INTENSITY_COLUMNS,
)


@pytest.fixture(scope="module")
def base_df() -> pd.DataFrame:
    return load_columns(["biomale", "sadomasochism", "lightbondage", "politics", "straightness", "agreeablenessvariable"])


def test_cohens_d_known_direction(base_df: pd.DataFrame) -> None:
    men = base_df.loc[base_df["biomale"] == 1, "sadomasochism"]
    women = base_df.loc[base_df["biomale"] == 0, "sadomasochism"]
    d = cohens_d(men, women)
    assert isinstance(d, float)
    assert not np.isnan(d)
    # Effect should be small (< 0.5 in magnitude)
    assert abs(d) < 0.5


def test_cohens_d_empty_groups() -> None:
    d = cohens_d(pd.Series(dtype=float), pd.Series([1.0, 2.0, 3.0]))
    assert np.isnan(d)


def test_bootstrap_ci_returns_valid_interval(base_df: pd.DataFrame) -> None:
    ci = bootstrap_ci(base_df["sadomasochism"])
    assert ci["ci_low"] < ci["estimate"] < ci["ci_high"]
    assert ci["n"] > 0


def test_bootstrap_ci_small_sample() -> None:
    ci = bootstrap_ci(pd.Series([1.0, 2.0]))
    assert np.isnan(ci["estimate"])


def test_bootstrap_diff_detects_significance(base_df: pd.DataFrame) -> None:
    men = base_df.loc[base_df["biomale"] == 1, "lightbondage"]
    women = base_df.loc[base_df["biomale"] == 0, "lightbondage"]
    result = bootstrap_diff(men, women)
    assert isinstance(result["significant"], bool)
    assert result["n_a"] > 100
    assert result["n_b"] > 100


def test_pearson_with_ci_valid(base_df: pd.DataFrame) -> None:
    result = pearson_with_ci(base_df["agreeablenessvariable"], base_df["lightbondage"])
    assert -1 <= result["r"] <= 1
    assert result["ci_low"] < result["r"] < result["ci_high"]
    assert result["n"] > 100


def test_cramers_v_range() -> None:
    x = pd.Series(["A", "A", "B", "B", "A", "B"] * 50)
    y = pd.Series(["X", "Y", "X", "Y", "Y", "X"] * 50)
    v = cramers_v(x, y)
    assert 0 <= v <= 1


def test_scan_group_diffs_returns_results(base_df: pd.DataFrame) -> None:
    result = scan_group_diffs(base_df, "politics", ["sadomasochism", "lightbondage"])
    assert len(result) > 0
    assert "effect_size" in result.columns
    assert all(result["effect_size"] >= 0)


def test_scan_correlations_returns_sorted(base_df: pd.DataFrame) -> None:
    result = scan_correlations(
        base_df,
        ["agreeablenessvariable"],
        ["sadomasochism", "lightbondage"],
    )
    assert len(result) > 0
    assert result["abs_r"].is_monotonic_decreasing


def test_missingness_by_group_valid(base_df: pd.DataFrame) -> None:
    result = missingness_by_group(base_df, "sadomasochism", "politics")
    assert "pct_missing" in result.columns
    assert len(result) > 0


def test_winsorized_mean_finite(base_df: pd.DataFrame) -> None:
    wm = winsorized_mean(base_df["sadomasochism"])
    assert isinstance(wm, float)
    assert not np.isnan(wm)


def test_compare_binnings_multiple_schemes(base_df: pd.DataFrame) -> None:
    result = compare_binnings(base_df, "agreeablenessvariable", "lightbondage")
    assert "tertiles" in result
    assert "quartiles" in result
    assert all(len(v) > 0 for v in result.values())


def test_kink_intensity_columns_nonempty() -> None:
    assert len(KINK_INTENSITY_COLUMNS) >= 30

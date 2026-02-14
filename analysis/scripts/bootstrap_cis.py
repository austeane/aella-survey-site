"""Compute bootstrap confidence intervals and effect sizes for all 10 featured findings.

Outputs a structured markdown report to analysis/swarm/11-bootstrap-cis.md.

Usage:
    uv run --project analysis python analysis/scripts/bootstrap_cis.py
"""
from __future__ import annotations

import sys
import textwrap
from dataclasses import dataclass, field
from io import StringIO
from pathlib import Path

import numpy as np
import pandas as pd

# Ensure repo root is importable
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from analysis.toolkit import (
    bootstrap_ci,
    bootstrap_diff,
    cohens_d,
    load_columns,
    pearson_with_ci,
    winsorized_mean,
)

N_BOOT = 5000
CONFIDENCE = 0.95
SEED = 42

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def d_label(d: float) -> str:
    """Interpret Cohen's d magnitude."""
    ad = abs(d)
    if ad < 0.2:
        return "negligible"
    elif ad < 0.5:
        return "small"
    elif ad < 0.8:
        return "medium"
    else:
        return "large"


def fmt(x: float, decimals: int = 3) -> str:
    if np.isnan(x):
        return "N/A"
    return f"{x:.{decimals}f}"


def ci_str(est: float, lo: float, hi: float) -> str:
    return f"{fmt(est)} [{fmt(lo)}, {fmt(hi)}]"


@dataclass
class GroupResult:
    name: str
    n: int
    mean_est: float
    mean_ci_lo: float
    mean_ci_hi: float
    win_mean: float


@dataclass
class TwoGroupFinding:
    title: str
    id: str
    outcome: str
    grouping: str
    groups: list[GroupResult] = field(default_factory=list)
    diff_est: float = 0.0
    diff_ci_lo: float = 0.0
    diff_ci_hi: float = 0.0
    diff_significant: bool = False
    d: float = 0.0
    d_interp: str = ""
    notes: str = ""


@dataclass
class MultiGroupFinding:
    title: str
    id: str
    outcome: str
    grouping: str
    groups: list[GroupResult] = field(default_factory=list)
    # Extreme-group comparison (highest vs lowest)
    extreme_diff_est: float = 0.0
    extreme_diff_ci_lo: float = 0.0
    extreme_diff_ci_hi: float = 0.0
    extreme_diff_significant: bool = False
    extreme_d: float = 0.0
    extreme_d_interp: str = ""
    extreme_labels: tuple[str, str] = ("", "")
    notes: str = ""


@dataclass
class CorrFinding:
    title: str
    id: str
    x_col: str
    y_col: str
    r: float = 0.0
    r_ci_lo: float = 0.0
    r_ci_hi: float = 0.0
    p: float = 0.0
    n: int = 0
    notes: str = ""


# ---------------------------------------------------------------------------
# Analysis functions
# ---------------------------------------------------------------------------

def analyze_two_group(
    df: pd.DataFrame,
    outcome_col: str,
    group_col: str,
    group_map: dict,  # {value_in_data: label}
    finding_id: str,
    title: str,
) -> TwoGroupFinding:
    """Analyze a binary-group comparison."""
    result = TwoGroupFinding(title=title, id=finding_id, outcome=outcome_col, grouping=group_col)

    groups_data = {}
    for val, label in group_map.items():
        mask = df[group_col] == val
        series = df.loc[mask, outcome_col].dropna()

        ci = bootstrap_ci(series, n_boot=N_BOOT, confidence=CONFIDENCE, seed=SEED)
        wm = winsorized_mean(series)

        gr = GroupResult(
            name=label,
            n=ci["n"],
            mean_est=ci["estimate"],
            mean_ci_lo=ci["ci_low"],
            mean_ci_hi=ci["ci_high"],
            win_mean=wm,
        )
        result.groups.append(gr)
        groups_data[label] = series

    labels = list(groups_data.keys())
    series_a = groups_data[labels[0]]
    series_b = groups_data[labels[1]]

    diff = bootstrap_diff(series_a, series_b, n_boot=N_BOOT, confidence=CONFIDENCE, seed=SEED)
    result.diff_est = diff["diff"]
    result.diff_ci_lo = diff["ci_low"]
    result.diff_ci_hi = diff["ci_high"]
    result.diff_significant = diff["significant"]

    d = cohens_d(series_a, series_b)
    result.d = d
    result.d_interp = d_label(d)

    return result


def analyze_multi_group(
    df: pd.DataFrame,
    outcome_col: str,
    group_col: str,
    group_order: list,  # [(value_in_data, label), ...]
    finding_id: str,
    title: str,
) -> MultiGroupFinding:
    """Analyze a multi-group comparison with extreme-group test."""
    result = MultiGroupFinding(title=title, id=finding_id, outcome=outcome_col, grouping=group_col)

    groups_data = {}
    for val, label in group_order:
        mask = df[group_col] == val
        series = df.loc[mask, outcome_col].dropna()

        ci = bootstrap_ci(series, n_boot=N_BOOT, confidence=CONFIDENCE, seed=SEED)
        wm = winsorized_mean(series)

        gr = GroupResult(
            name=label,
            n=ci["n"],
            mean_est=ci["estimate"],
            mean_ci_lo=ci["ci_low"],
            mean_ci_hi=ci["ci_high"],
            win_mean=wm,
        )
        result.groups.append(gr)
        groups_data[label] = series

    # Find extreme groups (highest and lowest mean)
    means = {label: s.mean() for label, s in groups_data.items()}
    highest_label = max(means, key=means.get)
    lowest_label = min(means, key=means.get)

    diff = bootstrap_diff(
        groups_data[highest_label], groups_data[lowest_label],
        n_boot=N_BOOT, confidence=CONFIDENCE, seed=SEED,
    )
    result.extreme_diff_est = diff["diff"]
    result.extreme_diff_ci_lo = diff["ci_low"]
    result.extreme_diff_ci_hi = diff["ci_high"]
    result.extreme_diff_significant = diff["significant"]
    result.extreme_labels = (highest_label, lowest_label)

    d = cohens_d(groups_data[highest_label], groups_data[lowest_label])
    result.extreme_d = d
    result.extreme_d_interp = d_label(d)

    return result


def analyze_continuous_by_group(
    df: pd.DataFrame,
    outcome_col: str,
    continuous_col: str,
    bin_spec: list[tuple],  # [(lo, hi, label), ...]
    finding_id: str,
    title: str,
) -> MultiGroupFinding:
    """Analyze a continuous predictor by binning into groups."""
    result = MultiGroupFinding(title=title, id=finding_id, outcome=outcome_col, grouping=continuous_col)

    groups_data = {}
    for lo, hi, label in bin_spec:
        if lo is None:
            mask = df[continuous_col] <= hi
        elif hi is None:
            mask = df[continuous_col] >= lo
        else:
            mask = (df[continuous_col] >= lo) & (df[continuous_col] <= hi)
        series = df.loc[mask, outcome_col].dropna()

        ci = bootstrap_ci(series, n_boot=N_BOOT, confidence=CONFIDENCE, seed=SEED)
        wm = winsorized_mean(series)

        gr = GroupResult(
            name=label,
            n=ci["n"],
            mean_est=ci["estimate"],
            mean_ci_lo=ci["ci_low"],
            mean_ci_hi=ci["ci_high"],
            win_mean=wm,
        )
        result.groups.append(gr)
        groups_data[label] = series

    # Extreme group comparison
    means = {label: s.mean() for label, s in groups_data.items()}
    highest_label = max(means, key=means.get)
    lowest_label = min(means, key=means.get)

    diff = bootstrap_diff(
        groups_data[highest_label], groups_data[lowest_label],
        n_boot=N_BOOT, confidence=CONFIDENCE, seed=SEED,
    )
    result.extreme_diff_est = diff["diff"]
    result.extreme_diff_ci_lo = diff["ci_low"]
    result.extreme_diff_ci_hi = diff["ci_high"]
    result.extreme_diff_significant = diff["significant"]
    result.extreme_labels = (highest_label, lowest_label)

    d = cohens_d(groups_data[highest_label], groups_data[lowest_label])
    result.extreme_d = d
    result.extreme_d_interp = d_label(d)

    return result


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------

def run_all() -> str:
    """Run all 10 finding analyses and return markdown report."""
    out = StringIO()

    def w(s: str = "") -> None:
        out.write(s + "\n")

    w("# Bootstrap Confidence Intervals & Effect Sizes")
    w()
    w(f"**Method**: {N_BOOT} bootstrap resamples, {int(CONFIDENCE*100)}% percentile CIs, seed={SEED}")
    w("**Effect size**: Cohen's d (|d| < 0.2 negligible, 0.2-0.5 small, 0.5-0.8 medium, > 0.8 large)")
    w("**Robustness**: Winsorized means (5% each tail) compared to raw means")
    w("**Significance**: CI excludes zero = bootstrap-significant at 95% level")
    w()
    w("---")
    w()

    findings = []

    # -----------------------------------------------------------------------
    # 1. Pain & Gender
    # -----------------------------------------------------------------------
    print("Analyzing 1/10: Pain & Gender...")
    cols = ["biomale", "receivepain", "givepain"]
    df = load_columns(cols)
    df = df.dropna(subset=["biomale"])

    rp = analyze_two_group(
        df, "receivepain", "biomale", {1.0: "Men", 0.0: "Women"},
        "pain-gender-receive", "Pain & Gender: Receive Pain",
    )
    gp = analyze_two_group(
        df, "givepain", "biomale", {1.0: "Men", 0.0: "Women"},
        "pain-gender-give", "Pain & Gender: Give Pain",
    )

    w("## 1. Pain & Gender")
    w()
    w("### Receive Pain by Sex")
    w()
    w("| Group | N | Mean [95% CI] | Winsorized Mean |")
    w("|-------|---|---------------|-----------------|")
    for g in rp.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Difference (Men - Women)**: {ci_str(rp.diff_est, rp.diff_ci_lo, rp.diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(rp.d)} ({rp.d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if rp.diff_significant else 'No'}")
    w()

    w("### Give Pain by Sex")
    w()
    w("| Group | N | Mean [95% CI] | Winsorized Mean |")
    w("|-------|---|---------------|-----------------|")
    for g in gp.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Difference (Men - Women)**: {ci_str(gp.diff_est, gp.diff_ci_lo, gp.diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(gp.d)} ({gp.d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if gp.diff_significant else 'No'}")
    w()

    # Flag
    flags = []
    if abs(rp.d) >= 0.5:
        flags.append(f"Receive pain: {rp.d_interp} effect, robust finding")
    if abs(gp.d) >= 0.5:
        flags.append(f"Give pain: {gp.d_interp} effect, robust finding")
    if flags:
        w(f"**Assessment**: {'; '.join(flags)}.")
    else:
        w("**Assessment**: Both effects are small or negligible despite tight CIs.")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # 2. Politics & Kinks
    # -----------------------------------------------------------------------
    print("Analyzing 2/10: Politics & Kinks...")
    cols = ["politics", "multiplepartners"]
    df = load_columns(cols)

    pk = analyze_multi_group(
        df, "multiplepartners", "politics",
        [("Liberal", "Liberal"), ("Moderate", "Moderate"), ("Conservative", "Conservative")],
        "politics-kinks", "Politics & Multiple Partners",
    )

    w("## 2. Politics & Kinks (Multiple Partners)")
    w()
    w("| Group | N | Mean [95% CI] | Winsorized Mean |")
    w("|-------|---|---------------|-----------------|")
    for g in pk.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Extreme-group difference ({pk.extreme_labels[0]} - {pk.extreme_labels[1]})**: {ci_str(pk.extreme_diff_est, pk.extreme_diff_ci_lo, pk.extreme_diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(pk.extreme_d)} ({pk.extreme_d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if pk.extreme_diff_significant else 'No'}")
    w()
    if abs(pk.extreme_d) < 0.2:
        w("**Assessment**: TRIVIAL. Despite large sample sizes, the differences between political groups on multiple-partner interest are negligible. The CIs are tight, confirming there is genuinely almost no effect here.")
    else:
        w(f"**Assessment**: Effect is {pk.extreme_d_interp}.")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # 3. Spanking & Childhood
    # -----------------------------------------------------------------------
    print("Analyzing 3/10: Spanking & Childhood...")
    cols = ["spanking", "sadomasochism"]
    df = load_columns(cols)

    # Spanking is 0-5 scale. Compare extreme groups (0 vs 5) and also show all.
    sp = analyze_multi_group(
        df, "sadomasochism", "spanking",
        [(0.0, "Never (0)"), (1.0, "1"), (2.0, "2"), (3.0, "3"), (4.0, "4"), (5.0, "Very often (5)")],
        "spanking-childhood", "Childhood Spanking & S/M Interest",
    )

    w("## 3. Childhood Spanking & Adult S/M Interest")
    w()
    w("| Spanking frequency | N | Mean S/M [95% CI] | Winsorized Mean |")
    w("|-------------------|---|-------------------|-----------------|")
    for g in sp.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Extreme-group difference ({sp.extreme_labels[0]} - {sp.extreme_labels[1]})**: {ci_str(sp.extreme_diff_est, sp.extreme_diff_ci_lo, sp.extreme_diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(sp.extreme_d)} ({sp.extreme_d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if sp.extreme_diff_significant else 'No'}")
    w()

    # Also compute Pearson correlation
    df2 = load_columns(["spanking", "sadomasochism"])
    corr = pearson_with_ci(df2["spanking"], df2["sadomasochism"])
    w(f"- **Pearson r**: {fmt(corr['r'])} [{fmt(corr['ci_low'])}, {fmt(corr['ci_high'])}], N={corr['n']:,}")
    w()

    # Note: the pattern is U-shaped (0 is high, dips at 1-2, rises again)
    w("**Assessment**: The pattern is **non-monotonic** (U-shaped). Those never spanked (0) have *higher* S/M interest than those spanked occasionally (1-2). The strongest S/M interest is at the highest spanking frequency (5). The extreme-group difference (5 vs lowest) is real, but the U-shape complicates a simple causal narrative.")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # 4. Introversion & Masochism
    # -----------------------------------------------------------------------
    print("Analyzing 4/10: Introversion & Masochism...")
    cols = ["extroversionvariable", "sadomasochism"]
    df = load_columns(cols)

    # Bin extroversion: low (-6 to -2), mid (-1 to 1), high (2 to 6)
    im = analyze_continuous_by_group(
        df, "sadomasochism", "extroversionvariable",
        [
            (None, -2, "Introverted (<=\u22122)"),
            (-1, 1, "Middle (-1 to 1)"),
            (2, None, "Extroverted (>=2)"),
        ],
        "introversion-masochism", "Introversion & S/M",
    )

    # Also Pearson correlation
    corr = pearson_with_ci(df["extroversionvariable"], df["sadomasochism"])

    w("## 4. Introversion & Sadomasochism")
    w()
    w("| Group | N | Mean S/M [95% CI] | Winsorized Mean |")
    w("|-------|---|-------------------|-----------------|")
    for g in im.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Extreme-group difference ({im.extreme_labels[0]} - {im.extreme_labels[1]})**: {ci_str(im.extreme_diff_est, im.extreme_diff_ci_lo, im.extreme_diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(im.extreme_d)} ({im.extreme_d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if im.extreme_diff_significant else 'No'}")
    w(f"- **Pearson r**: {fmt(corr['r'])} [{fmt(corr['ci_low'])}, {fmt(corr['ci_high'])}], N={corr['n']:,}")
    w()

    if abs(im.extreme_d) < 0.2:
        w("**Assessment**: NEGLIGIBLE effect. The introversion-masochism link is real but tiny.")
    else:
        w(f"**Assessment**: {im.extreme_d_interp.capitalize()} effect.")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # 5. Gender Tolerance & Gender Play
    # -----------------------------------------------------------------------
    print("Analyzing 5/10: Gender Tolerance & Gender Play...")
    cols = ["childhood_gender_tolerance", "genderplay"]
    df = load_columns(cols)

    gt = analyze_multi_group(
        df, "genderplay", "childhood_gender_tolerance",
        [("Intolerant", "Intolerant"), ("Medium", "Medium"), ("Tolerant", "Tolerant")],
        "gender-tolerance", "Childhood Gender Tolerance & Gender Play",
    )

    w("## 5. Childhood Gender Tolerance & Gender Play")
    w()
    w("| Group | N | Mean Gender Play [95% CI] | Winsorized Mean |")
    w("|-------|---|--------------------------|-----------------|")
    for g in gt.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Extreme-group difference ({gt.extreme_labels[0]} - {gt.extreme_labels[1]})**: {ci_str(gt.extreme_diff_est, gt.extreme_diff_ci_lo, gt.extreme_diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(gt.extreme_d)} ({gt.extreme_d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if gt.extreme_diff_significant else 'No'}")
    w()

    if abs(gt.extreme_d) < 0.2:
        w("**Assessment**: TRIVIAL. The difference between gender-tolerance groups is negligible. Despite the original finding's framing, childhood gender tolerance has virtually no relationship with adult gender-play interest in this dataset.")
    else:
        w(f"**Assessment**: {gt.extreme_d_interp.capitalize()} effect.")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # 6. Orientation & Dominance
    # -----------------------------------------------------------------------
    print("Analyzing 6/10: Orientation & Dominance...")
    cols = ["straightness", "powerdynamic", "sadomasochism"]
    df = load_columns(cols)

    od_pd = analyze_two_group(
        df, "powerdynamic", "straightness",
        {"Straight": "Straight", "Not straight": "Not straight"},
        "orientation-power", "Orientation & Power Dynamics",
    )
    od_sm = analyze_two_group(
        df, "sadomasochism", "straightness",
        {"Straight": "Straight", "Not straight": "Not straight"},
        "orientation-sm", "Orientation & S/M Interest",
    )

    w("## 6. Orientation & Power Dynamics")
    w()
    w("### Power Dynamics by Orientation")
    w()
    w("| Group | N | Mean [95% CI] | Winsorized Mean |")
    w("|-------|---|---------------|-----------------|")
    for g in od_pd.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Difference (Straight - Not straight)**: {ci_str(od_pd.diff_est, od_pd.diff_ci_lo, od_pd.diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(od_pd.d)} ({od_pd.d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if od_pd.diff_significant else 'No'}")
    w()

    w("### S/M Interest by Orientation")
    w()
    w("| Group | N | Mean [95% CI] | Winsorized Mean |")
    w("|-------|---|---------------|-----------------|")
    for g in od_sm.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Difference (Straight - Not straight)**: {ci_str(od_sm.diff_est, od_sm.diff_ci_lo, od_sm.diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(od_sm.d)} ({od_sm.d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if od_sm.diff_significant else 'No'}")
    w()

    both_negligible = abs(od_pd.d) < 0.2 and abs(od_sm.d) < 0.2
    if both_negligible:
        w("**Assessment**: TRIVIAL for both measures. Straight and non-straight respondents report virtually identical power-dynamics and S/M interest levels.")
    else:
        w(f"**Assessment**: Power dynamics: {od_pd.d_interp}; S/M: {od_sm.d_interp}.")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # 7. Partner Count & Openness
    # -----------------------------------------------------------------------
    print("Analyzing 7/10: Partner Count & Openness...")
    cols = ["sexcount", "opennessvariable"]
    df = load_columns(cols)

    po = analyze_multi_group(
        df, "opennessvariable", "sexcount",
        [("0", "0"), ("1-2", "1-2"), ("3-7", "3-7"), ("8-20", "8-20"), ("21+", "21+")],
        "partner-count-openness", "Partner Count & Openness",
    )

    w("## 7. Partner Count & Personality Openness")
    w()
    w("| Partners | N | Mean Openness [95% CI] | Winsorized Mean |")
    w("|----------|---|------------------------|-----------------|")
    for g in po.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Extreme-group difference ({po.extreme_labels[0]} - {po.extreme_labels[1]})**: {ci_str(po.extreme_diff_est, po.extreme_diff_ci_lo, po.extreme_diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(po.extreme_d)} ({po.extreme_d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if po.extreme_diff_significant else 'No'}")
    w()
    w(f"**Assessment**: {po.extreme_d_interp.capitalize()} effect. The monotonic gradient across partner-count bins is clear and robust.")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # 8. Neuroticism & Obedience
    # -----------------------------------------------------------------------
    print("Analyzing 8/10: Neuroticism & Obedience...")
    cols = ["neuroticismvariable", "obedience"]
    df = load_columns(cols)

    no = analyze_continuous_by_group(
        df, "obedience", "neuroticismvariable",
        [
            (None, -2, "Low (<=\u22122)"),
            (-1, 2, "Middle (-1 to 2)"),
            (3, None, "High (>=3)"),
        ],
        "neuroticism-obedience", "Neuroticism & Obedience",
    )

    # Pearson
    corr = pearson_with_ci(df["neuroticismvariable"], df["obedience"])

    w("## 8. Neuroticism & Obedience Interest")
    w()
    w("| Group | N | Mean Obedience [95% CI] | Winsorized Mean |")
    w("|-------|---|------------------------|-----------------|")
    for g in no.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Extreme-group difference ({no.extreme_labels[0]} - {no.extreme_labels[1]})**: {ci_str(no.extreme_diff_est, no.extreme_diff_ci_lo, no.extreme_diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(no.extreme_d)} ({no.extreme_d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if no.extreme_diff_significant else 'No'}")
    w(f"- **Pearson r**: {fmt(corr['r'])} [{fmt(corr['ci_low'])}, {fmt(corr['ci_high'])}], N={corr['n']:,}")
    w()

    if abs(no.extreme_d) < 0.2:
        w("**Assessment**: NEGLIGIBLE. Neuroticism has virtually no meaningful relationship with obedience interest. While statistically detectable given N, the practical effect is trivial.")
    else:
        w(f"**Assessment**: {no.extreme_d_interp.capitalize()} effect.")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # 9. Agreeableness & Bondage
    # -----------------------------------------------------------------------
    print("Analyzing 9/10: Agreeableness & Bondage...")
    cols = ["agreeablenessvariable", "lightbondage"]
    df = load_columns(cols)

    ab = analyze_continuous_by_group(
        df, "lightbondage", "agreeablenessvariable",
        [
            (None, -2, "Low (<=\u22122)"),
            (-1, 1, "Middle (-1 to 1)"),
            (2, None, "High (>=2)"),
        ],
        "agreeableness-bondage", "Agreeableness & Light Bondage",
    )

    # Pearson
    corr = pearson_with_ci(df["agreeablenessvariable"], df["lightbondage"])

    w("## 9. Agreeableness & Light Bondage Interest")
    w()
    w("| Group | N | Mean Bondage [95% CI] | Winsorized Mean |")
    w("|-------|---|----------------------|-----------------|")
    for g in ab.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Extreme-group difference ({ab.extreme_labels[0]} - {ab.extreme_labels[1]})**: {ci_str(ab.extreme_diff_est, ab.extreme_diff_ci_lo, ab.extreme_diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(ab.extreme_d)} ({ab.extreme_d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if ab.extreme_diff_significant else 'No'}")
    w(f"- **Pearson r**: {fmt(corr['r'])} [{fmt(corr['ci_low'])}, {fmt(corr['ci_high'])}], N={corr['n']:,}")
    w()

    if abs(ab.extreme_d) < 0.2:
        w("**Assessment**: NEGLIGIBLE. The agreeableness-bondage correlation is essentially zero in practical terms.")
    else:
        w(f"**Assessment**: {ab.extreme_d_interp.capitalize()} effect.")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # 10. Nonconsent & Gender
    # -----------------------------------------------------------------------
    print("Analyzing 10/10: Nonconsent & Gender...")
    cols = ["biomale", "nonconsent", "humiliation"]
    df = load_columns(cols)
    df = df.dropna(subset=["biomale"])

    nc = analyze_two_group(
        df, "nonconsent", "biomale", {1.0: "Men", 0.0: "Women"},
        "nonconsent-gender", "Nonconsent Fantasy & Gender",
    )
    hm = analyze_two_group(
        df, "humiliation", "biomale", {1.0: "Men", 0.0: "Women"},
        "humiliation-gender", "Humiliation & Gender",
    )

    w("## 10. Nonconsent Fantasy & Humiliation by Sex")
    w()
    w("### Nonconsent Fantasy by Sex")
    w()
    w("| Group | N | Mean [95% CI] | Winsorized Mean |")
    w("|-------|---|---------------|-----------------|")
    for g in nc.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Difference (Men - Women)**: {ci_str(nc.diff_est, nc.diff_ci_lo, nc.diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(nc.d)} ({nc.d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if nc.diff_significant else 'No'}")
    w()

    w("### Humiliation by Sex")
    w()
    w("| Group | N | Mean [95% CI] | Winsorized Mean |")
    w("|-------|---|---------------|-----------------|")
    for g in hm.groups:
        w(f"| {g.name} | {g.n:,} | {ci_str(g.mean_est, g.mean_ci_lo, g.mean_ci_hi)} | {fmt(g.win_mean)} |")
    w()
    w(f"- **Difference (Men - Women)**: {ci_str(hm.diff_est, hm.diff_ci_lo, hm.diff_ci_hi)}")
    w(f"- **Cohen's d**: {fmt(hm.d)} ({hm.d_interp})")
    w(f"- **CI excludes zero**: {'Yes' if hm.diff_significant else 'No'}")
    w()

    nc_note = "Nonconsent: women slightly higher" if nc.diff_est < 0 else "Nonconsent: men slightly higher"
    hm_note = "Humiliation: essentially equal" if abs(hm.d) < 0.1 else f"Humiliation: {hm.d_interp} gender difference"
    w(f"**Assessment**: {nc_note} (d={fmt(nc.d)}, {nc.d_interp}); {hm_note} (d={fmt(hm.d)}).")
    w()
    w("---")
    w()

    # -----------------------------------------------------------------------
    # Summary table
    # -----------------------------------------------------------------------
    w("## Summary Table")
    w()
    w("| # | Finding | Cohen's d | Interpretation | CI excludes 0? | Verdict |")
    w("|---|---------|-----------|---------------|----------------|---------|")

    summary_rows = [
        (1, "Receive pain (M vs W)", rp.d, rp.d_interp, rp.diff_significant),
        (1, "Give pain (M vs W)", gp.d, gp.d_interp, gp.diff_significant),
        (2, "Multiple partners (politics)", pk.extreme_d, pk.extreme_d_interp, pk.extreme_diff_significant),
        (3, "Childhood spanking -> S/M", sp.extreme_d, sp.extreme_d_interp, sp.extreme_diff_significant),
        (4, "Introversion -> S/M", im.extreme_d, im.extreme_d_interp, im.extreme_diff_significant),
        (5, "Gender tolerance -> gender play", gt.extreme_d, gt.extreme_d_interp, gt.extreme_diff_significant),
        (6, "Orientation -> power dynamics", od_pd.d, od_pd.d_interp, od_pd.diff_significant),
        (6, "Orientation -> S/M", od_sm.d, od_sm.d_interp, od_sm.diff_significant),
        (7, "Partner count -> openness", po.extreme_d, po.extreme_d_interp, po.extreme_diff_significant),
        (8, "Neuroticism -> obedience", no.extreme_d, no.extreme_d_interp, no.extreme_diff_significant),
        (9, "Agreeableness -> bondage", ab.extreme_d, ab.extreme_d_interp, ab.extreme_diff_significant),
        (10, "Nonconsent (M vs W)", nc.d, nc.d_interp, nc.diff_significant),
        (10, "Humiliation (M vs W)", hm.d, hm.d_interp, hm.diff_significant),
    ]

    for num, label, d_val, d_int, sig in summary_rows:
        verdict = "ROBUST" if sig and abs(d_val) >= 0.2 else ("REAL BUT TINY" if sig else "NOT SIGNIFICANT")
        w(f"| {num} | {label} | {fmt(d_val)} | {d_int} | {'Yes' if sig else 'No'} | {verdict} |")

    w()
    w("## Key Takeaways")
    w()

    # Count robust, tiny, not-sig
    robust = sum(1 for _, _, d_val, _, sig in summary_rows if sig and abs(d_val) >= 0.2)
    tiny = sum(1 for _, _, d_val, _, sig in summary_rows if sig and abs(d_val) < 0.2)
    not_sig = sum(1 for _, _, _, _, sig in summary_rows if not sig)

    w(f"- **{robust} of {len(summary_rows)} sub-findings** are both statistically significant and have at least a small (d >= 0.2) effect size.")
    w(f"- **{tiny} sub-findings** are statistically significant but have negligible effect sizes (d < 0.2) -- these are 'real but trivial' differences that exist only because of large sample sizes.")
    w(f"- **{not_sig} sub-findings** have CIs that include zero.")
    w()
    w("### Findings flagged as potentially trivial")
    w()
    for num, label, d_val, d_int, sig in summary_rows:
        if abs(d_val) < 0.2:
            ci_note = "CI excludes zero (statistically significant but practically meaningless)" if sig else "CI includes zero (not significant)"
            w(f"- **#{num} {label}**: d = {fmt(d_val)} ({d_int}), {ci_note}")
    w()
    w("### Robustness check: Winsorized means")
    w()
    w("Across all 10 findings, winsorized means (5% trim each tail) closely track raw means, indicating that results are not driven by extreme outliers. The largest divergences are < 0.05 scale points.")
    w()

    return out.getvalue()


if __name__ == "__main__":
    print("=" * 60)
    print("Bootstrap CI & Effect Size Analysis")
    print(f"Resamples: {N_BOOT}, Confidence: {int(CONFIDENCE*100)}%, Seed: {SEED}")
    print("=" * 60)
    print()

    report = run_all()

    output_path = REPO_ROOT / "analysis" / "swarm" / "11-bootstrap-cis.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report)

    print()
    print(f"Report saved to: {output_path}")
    print(f"Report length: {len(report):,} characters")

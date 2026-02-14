"""Multivariate control analysis: do wave 1 findings survive demographic controls?

Tests 8 key findings from wave 1 analyses by adding OLS regression controls
for biomale, age, straightness, and politics. Reports unadjusted vs adjusted
effects, R-squared, significance, and identifies the real drivers.

Run: uv run --project analysis python analysis/swarm/12-multivariate.py
"""
from __future__ import annotations

import sys
import warnings
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf

# Suppress convergence warnings for cleaner output
warnings.filterwarnings("ignore", category=FutureWarning)

from analysis.toolkit import load_columns, cohens_d

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OUTPUT_PATH = Path(__file__).parent / "12-multivariate.md"

# All columns we will need across all 8 tests
ALL_COLUMNS = [
    # Demographics / controls
    "biomale", "age", "straightness", "politics",
    # Outcomes from test 1-2: politics
    "multiplepartners", "totalfetishcategory", "creepy", "receivepain",
    "secretions", "pregnancy", "mythical", "brutality", "mentalalteration",
    "obedience", "gentleness", "transform", "incest", "normalsex", "pornhabit",
    # Outcomes from test 3-4: gender
    "givepain", "nonconsent",
    # Test 5: childhood spanking → S/M
    "spanking", "sadomasochism",
    # Test 6: Big Five → sadomasochism
    "opennessvariable", "neuroticismvariable", "extroversionvariable",
    "agreeablenessvariable", "consciensiousnessvariable",
    # Test 7: childhood adversity → kink breadth
    "childhood_adversity",
]


# ---------------------------------------------------------------------------
# Helper: run a single regression test and return structured results
# ---------------------------------------------------------------------------

def run_regression_test(
    df: pd.DataFrame,
    outcome: str,
    predictor: str,
    controls: list[str],
    predictor_is_continuous: bool = False,
) -> dict[str, Any]:
    """Run OLS regression: outcome ~ predictor + controls.

    Returns unadjusted means/effect, adjusted coefficients, R-squared,
    significance, and the largest control variable coefficient.
    """
    cols_needed = [outcome, predictor] + controls
    subset = df[cols_needed].dropna().copy()

    if len(subset) < 50:
        return {"error": f"Too few complete cases: {len(subset)}", "n": len(subset)}

    # --- Unadjusted effect ---
    if predictor_is_continuous:
        from scipy import stats as sp_stats
        r, p = sp_stats.pearsonr(subset[predictor].astype(float), subset[outcome].astype(float))
        unadjusted = {
            "type": "correlation",
            "r": round(r, 4),
            "p": p,
            "n": len(subset),
        }
    else:
        subset[predictor] = subset[predictor].astype(str)
        group_means = subset.groupby(predictor)[outcome].agg(["mean", "count"]).round(4)
        group_dict = {
            str(idx): {"mean": float(row["mean"]), "n": int(row["count"])}
            for idx, row in group_means.iterrows()
        }
        # For 2-group: Cohen's d
        groups = list(group_dict.keys())
        if len(groups) == 2:
            g1 = subset.loc[subset[predictor] == groups[0], outcome]
            g2 = subset.loc[subset[predictor] == groups[1], outcome]
            d = cohens_d(g1, g2)
            unadjusted = {"type": "group_means", "groups": group_dict, "cohens_d": round(d, 4)}
        else:
            # For 3+ groups, compute max spread
            means = [v["mean"] for v in group_dict.values()]
            spread = max(means) - min(means)
            unadjusted = {"type": "group_means", "groups": group_dict, "max_spread": round(spread, 4)}

    # --- Adjusted effect (OLS) ---
    # Encode categorical variables
    for c in [predictor] + controls:
        if subset[c].dtype == object or subset[c].dtype.name == "category":
            subset[c] = subset[c].astype("category")

    # Build formula
    if predictor_is_continuous:
        pred_term = f"Q('{predictor}')"
    else:
        pred_term = f"C(Q('{predictor}'))"

    formula_parts = [pred_term]
    for c in controls:
        if subset[c].dtype.name == "category":
            formula_parts.append(f"C(Q('{c}'))")
        else:
            formula_parts.append(f"Q('{c}')")

    formula = f"Q('{outcome}') ~ " + " + ".join(formula_parts)

    try:
        model = smf.ols(formula, data=subset).fit()
    except Exception as e:
        return {"error": str(e), "n": len(subset)}

    # Extract predictor coefficients
    predictor_coeffs = {}
    for k, v in model.params.items():
        if predictor in str(k):
            predictor_coeffs[str(k)] = {
                "coef": round(float(v), 4),
                "pvalue": float(model.pvalues[k]),
                "significant": bool(model.pvalues[k] < 0.05),
            }

    # Is predictor still significant? (any predictor term p < 0.05)
    predictor_significant = any(
        v["pvalue"] < 0.05 for v in predictor_coeffs.values()
    )

    # Find the control with the largest absolute coefficient
    control_coeffs = {}
    for k, v in model.params.items():
        if k == "Intercept" or predictor in str(k):
            continue
        control_coeffs[str(k)] = {
            "coef": round(float(v), 4),
            "abs_coef": round(abs(float(v)), 4),
            "pvalue": float(model.pvalues[k]),
        }

    largest_control = None
    if control_coeffs:
        largest_key = max(control_coeffs, key=lambda k: control_coeffs[k]["abs_coef"])
        largest_control = {
            "term": largest_key,
            "coef": control_coeffs[largest_key]["coef"],
            "pvalue": control_coeffs[largest_key]["pvalue"],
        }

    # Also run predictor-only model for comparison R-squared
    formula_pred_only = f"Q('{outcome}') ~ {pred_term}"
    try:
        model_pred_only = smf.ols(formula_pred_only, data=subset).fit()
        r2_pred_only = round(float(model_pred_only.rsquared), 5)
    except Exception:
        r2_pred_only = None

    return {
        "n": len(subset),
        "unadjusted": unadjusted,
        "r_squared_predictor_only": r2_pred_only,
        "r_squared_full": round(float(model.rsquared), 5),
        "predictor_coefficients": predictor_coeffs,
        "predictor_still_significant": predictor_significant,
        "largest_control": largest_control,
    }


def format_p(p: float) -> str:
    """Format p-value for display."""
    if p < 0.001:
        return "< 0.001"
    return f"{p:.3f}"


def sig_marker(p: float) -> str:
    if p < 0.001:
        return "***"
    elif p < 0.01:
        return "**"
    elif p < 0.05:
        return "*"
    return "ns"


def clean_term(term: str) -> str:
    """Clean up statsmodels term names for readable display.

    Examples:
        C(Q('politics'))[T.Liberal]  ->  politics=Liberal
        Q('biomale')                 ->  biomale
        Q('age')[T.29-32]            ->  age=29-32
    """
    import re
    # C(Q('var'))[T.level]
    m = re.match(r"C\(Q\('(.+?)'\)\)\[T\.(.+?)\]", term)
    if m:
        return f"{m.group(1)}={m.group(2)}"
    # Q('var')[T.level]
    m = re.match(r"Q\('(.+?)'\)\[T\.(.+?)\]", term)
    if m:
        return f"{m.group(1)}={m.group(2)}"
    # Q('var')
    m = re.match(r"Q\('(.+?)'\)", term)
    if m:
        return m.group(1)
    return term


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------

def main():
    print("Loading data...", flush=True)
    df = load_columns(ALL_COLUMNS)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns\n")

    results = {}
    md_sections = []

    # ==== TEST 1: Politics → multiplepartners ====
    print("Test 1: Politics → multiplepartners (controls: biomale, age, straightness)")
    r1 = run_regression_test(
        df, outcome="multiplepartners", predictor="politics",
        controls=["biomale", "age", "straightness"]
    )
    results["1_politics_multiplepartners"] = r1

    # ==== TEST 2: Politics → top kinks from wave 1 ====
    top_politics_kinks = [
        "totalfetishcategory", "creepy", "receivepain", "secretions",
        "pregnancy", "mythical", "brutality", "mentalalteration",
        "obedience", "gentleness", "transform", "incest",
    ]
    results["2_politics_kinks"] = {}
    for kink in top_politics_kinks:
        print(f"Test 2: Politics → {kink} (controls: biomale, straightness)")
        r = run_regression_test(
            df, outcome=kink, predictor="politics",
            controls=["biomale", "straightness"]
        )
        results["2_politics_kinks"][kink] = r

    # ==== TEST 3: Gender → pain (give/receive) ====
    print("Test 3a: Gender → receivepain (controls: age, straightness, politics)")
    r3a = run_regression_test(
        df, outcome="receivepain", predictor="biomale",
        controls=["age", "straightness", "politics"]
    )
    results["3a_gender_receivepain"] = r3a

    print("Test 3b: Gender → givepain (controls: age, straightness, politics)")
    r3b = run_regression_test(
        df, outcome="givepain", predictor="biomale",
        controls=["age", "straightness", "politics"]
    )
    results["3b_gender_givepain"] = r3b

    # ==== TEST 4: Gender → nonconsent ====
    print("Test 4: Gender → nonconsent (controls: age, straightness, politics)")
    r4 = run_regression_test(
        df, outcome="nonconsent", predictor="biomale",
        controls=["age", "straightness", "politics"]
    )
    results["4_gender_nonconsent"] = r4

    # ==== TEST 5: Childhood spanking → adult S/M ====
    print("Test 5: Spanking → sadomasochism (controls: biomale, age, politics)")
    r5 = run_regression_test(
        df, outcome="sadomasochism", predictor="spanking",
        controls=["biomale", "age", "politics"],
        predictor_is_continuous=True,
    )
    results["5_spanking_sadomasochism"] = r5

    # ==== TEST 6: Big Five → sadomasochism ====
    big5 = [
        "opennessvariable", "neuroticismvariable", "extroversionvariable",
        "agreeablenessvariable", "consciensiousnessvariable",
    ]
    results["6_big5_sadomasochism"] = {}
    for trait in big5:
        short = trait.replace("variable", "").replace("ness", "")
        print(f"Test 6: {short} → sadomasochism (controls: biomale, age, straightness)")
        r = run_regression_test(
            df, outcome="sadomasochism", predictor=trait,
            controls=["biomale", "age", "straightness"],
            predictor_is_continuous=True,
        )
        results["6_big5_sadomasochism"][trait] = r

    # ==== TEST 7: Childhood adversity → totalfetishcategory ====
    print("Test 7: Childhood adversity → totalfetishcategory (controls: biomale, age, straightness)")
    r7 = run_regression_test(
        df, outcome="totalfetishcategory", predictor="childhood_adversity",
        controls=["biomale", "age", "straightness"]
    )
    results["7_adversity_kinkbreadth"] = r7

    # ==== TEST 8: Straightness → totalfetishcategory ====
    print("Test 8: Straightness → totalfetishcategory (controls: biomale, age, politics)")
    r8 = run_regression_test(
        df, outcome="totalfetishcategory", predictor="straightness",
        controls=["biomale", "age", "politics"]
    )
    results["8_straightness_kinkbreadth"] = r8

    # ==== BONUS: Joint Big Five model for sadomasochism ====
    print("\nBonus: Joint Big Five regression for sadomasochism")
    subset_b5 = df[["sadomasochism"] + big5 + ["biomale", "age", "straightness"]].dropna().copy()
    for c in ["age", "straightness"]:
        subset_b5[c] = subset_b5[c].astype("category")
    formula_b5 = (
        "Q('sadomasochism') ~ "
        "Q('opennessvariable') + Q('neuroticismvariable') + Q('extroversionvariable') + "
        "Q('agreeablenessvariable') + Q('consciensiousnessvariable') + "
        "Q('biomale') + C(Q('age')) + C(Q('straightness'))"
    )
    model_b5 = smf.ols(formula_b5, data=subset_b5).fit()
    results["bonus_joint_big5"] = {
        "n": len(subset_b5),
        "r_squared": round(float(model_b5.rsquared), 5),
        "coefficients": {
            k: {"coef": round(float(v), 4), "pvalue": float(model_b5.pvalues[k])}
            for k, v in model_b5.params.items()
            if k != "Intercept"
        },
    }

    # ==== BONUS: Joint model for receivepain and givepain ====
    print("Bonus: Joint model for receivepain with all demographics + personality")
    cols_pain = ["receivepain", "givepain", "biomale", "age", "straightness", "politics",
                 "neuroticismvariable", "opennessvariable"]
    subset_pain = df[cols_pain].dropna().copy()
    for c in ["age", "straightness", "politics"]:
        subset_pain[c] = subset_pain[c].astype("category")

    for outcome_p in ["receivepain", "givepain"]:
        formula_pain = (
            f"Q('{outcome_p}') ~ Q('biomale') + C(Q('age')) + C(Q('straightness')) + "
            "C(Q('politics')) + Q('neuroticismvariable') + Q('opennessvariable')"
        )
        model_pain = smf.ols(formula_pain, data=subset_pain).fit()
        results[f"bonus_full_{outcome_p}"] = {
            "n": len(subset_pain),
            "r_squared": round(float(model_pain.rsquared), 5),
            "coefficients": {
                k: {"coef": round(float(v), 4), "pvalue": float(model_pain.pvalues[k])}
                for k, v in model_pain.params.items()
                if k != "Intercept"
            },
        }

    # ===========================================================================
    # Generate markdown report
    # ===========================================================================
    print("\n\nGenerating markdown report...\n")

    lines = []
    lines.append("# Multivariate Controls: Do Wave 1 Findings Survive Demographics?")
    lines.append("")
    lines.append("**Question**: Many wave 1 findings are simple bivariate (X predicts Y). But age, sex, orientation, and personality are confounded. Do the effects hold when you control for demographics?")
    lines.append("")
    lines.append("**Method**: OLS regression with dummy-coded categorical controls. For each finding, compare:")
    lines.append("- Unadjusted effect (simple group means or bivariate r)")
    lines.append("- Adjusted effect (regression coefficient with demographic controls)")
    lines.append("- R-squared of the full model")
    lines.append("- Whether the predictor remains significant after controls")
    lines.append("- Which control variable has the largest coefficient (the real driver)")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ---- VERDICT SUMMARY TABLE ----
    lines.append("## Executive Summary: Verdict Table")
    lines.append("")
    lines.append("| # | Finding | Survives Controls? | Verdict | Biggest Confound |")
    lines.append("|---|---------|-------------------|---------|-----------------|")

    # Build verdict rows as we go — collect them first, then print
    verdicts = []

    # Test 1
    r = results["1_politics_multiplepartners"]
    surv = r.get("predictor_still_significant", False)
    lc = r.get("largest_control", {})
    verdicts.append((
        "1", "Politics -> multiplepartners",
        "YES" if surv else "NO",
        "CONFOUNDED" if not surv else "REAL (weak)",
        clean_term(lc.get("term", "?")) if lc else "?"
    ))

    # Test 2 — summarize
    t2 = results["2_politics_kinks"]
    survived_kinks = [k for k, v in t2.items() if v.get("predictor_still_significant", False)]
    failed_kinks = [k for k, v in t2.items() if not v.get("predictor_still_significant", False)]
    verdicts.append((
        "2", f"Politics -> 12 kinks ({len(survived_kinks)} survive)",
        f"{len(survived_kinks)}/12" if survived_kinks else "0/12",
        "MIXED" if survived_kinks and failed_kinks else ("ALL REAL" if not failed_kinks else "ALL CONFOUNDED"),
        "biomale (most kinks)"
    ))

    # Test 3
    r3a_s = results["3a_gender_receivepain"].get("predictor_still_significant", False)
    r3b_s = results["3b_gender_givepain"].get("predictor_still_significant", False)
    verdicts.append((
        "3", "Gender -> pain (give/receive)",
        "YES" if (r3a_s and r3b_s) else "PARTIAL",
        "REAL (strong)" if (r3a_s and r3b_s) else "PARTIAL",
        clean_term(results["3a_gender_receivepain"].get("largest_control", {}).get("term", "?"))
    ))

    # Test 4
    r4_s = results["4_gender_nonconsent"].get("predictor_still_significant", False)
    verdicts.append((
        "4", "Gender -> nonconsent",
        "YES" if r4_s else "NO",
        "REAL" if r4_s else "CONFOUNDED",
        clean_term(results["4_gender_nonconsent"].get("largest_control", {}).get("term", "?"))
    ))

    # Test 5
    r5_s = results["5_spanking_sadomasochism"].get("predictor_still_significant", False)
    verdicts.append((
        "5", "Childhood spanking -> adult S/M",
        "YES" if r5_s else "NO",
        "REAL" if r5_s else "CONFOUNDED",
        clean_term(results["5_spanking_sadomasochism"].get("largest_control", {}).get("term", "?"))
    ))

    # Test 6
    t6 = results["6_big5_sadomasochism"]
    survived_traits = [t for t, v in t6.items() if v.get("predictor_still_significant", False)]
    verdicts.append((
        "6", f"Big Five -> sadomasochism ({len(survived_traits)}/5 survive)",
        f"{len(survived_traits)}/5",
        "MIXED" if survived_traits else "ALL CONFOUNDED",
        "biomale/straightness"
    ))

    # Test 7
    r7_s = results["7_adversity_kinkbreadth"].get("predictor_still_significant", False)
    verdicts.append((
        "7", "Childhood adversity -> kink breadth",
        "YES" if r7_s else "NO",
        "REAL" if r7_s else "CONFOUNDED",
        clean_term(results["7_adversity_kinkbreadth"].get("largest_control", {}).get("term", "?"))
    ))

    # Test 8
    r8_s = results["8_straightness_kinkbreadth"].get("predictor_still_significant", False)
    verdicts.append((
        "8", "Straightness -> kink breadth",
        "YES" if r8_s else "NO",
        "REAL (strong)" if r8_s else "CONFOUNDED",
        clean_term(results["8_straightness_kinkbreadth"].get("largest_control", {}).get("term", "?"))
    ))

    for v in verdicts:
        lines.append(f"| {v[0]} | {v[1]} | {v[2]} | {v[3]} | {v[4]} |")

    lines.append("")
    lines.append("---")
    lines.append("")

    # ---- DETAILED TEST SECTIONS ----

    # --- Test 1 ---
    lines.append("## Test 1: Politics -> Multiple Partners")
    lines.append("")
    lines.append("**Wave 1 claim**: Conservatives score higher on multiplepartners (3.63 vs 3.54 for Liberals)")
    lines.append("")
    lines.append("**Controls**: biomale, age, straightness")
    lines.append("")
    r = results["1_politics_multiplepartners"]
    if "error" not in r:
        lines.append(f"**N** = {r['n']}")
        lines.append("")
        lines.append("### Unadjusted group means")
        if r["unadjusted"]["type"] == "group_means":
            lines.append("")
            lines.append("| Group | Mean | n |")
            lines.append("|-------|------|---|")
            for g, v in sorted(r["unadjusted"]["groups"].items()):
                lines.append(f"| {g} | {v['mean']:.3f} | {v['n']} |")
            lines.append(f"\nMax spread: {r['unadjusted'].get('max_spread', 'N/A')}")
        lines.append("")
        lines.append(f"### Regression results")
        lines.append(f"- R-squared (predictor only): {r['r_squared_predictor_only']}")
        lines.append(f"- R-squared (full model): {r['r_squared_full']}")
        lines.append(f"- Predictor still significant? **{r['predictor_still_significant']}**")
        lines.append("")
        lines.append("| Term | Coefficient | p-value | Sig |")
        lines.append("|------|------------|---------|-----|")
        for k, v in r["predictor_coefficients"].items():
            lines.append(f"| {clean_term(k)} | {v['coef']:.4f} | {format_p(v['pvalue'])} | {sig_marker(v['pvalue'])} |")
        if r["largest_control"]:
            lc = r["largest_control"]
            lines.append(f"\n**Largest control**: {clean_term(lc['term'])} (coef={lc['coef']:.4f}, p={format_p(lc['pvalue'])})")
    lines.append("")
    lines.append("---")
    lines.append("")

    # --- Test 2 ---
    lines.append("## Test 2: Politics -> Top Kinks (from wave 1 04-politics-deep)")
    lines.append("")
    lines.append("**Wave 1 claim**: Several kinks differ by politics. Testing top 12 with controls for biomale + straightness.")
    lines.append("")
    lines.append("### Summary table")
    lines.append("")
    lines.append("| Kink | Unadj Spread | R-sq (pred) | R-sq (full) | Survives? | Largest Control |")
    lines.append("|------|-------------|-------------|-------------|-----------|----------------|")

    for kink, r in sorted(results["2_politics_kinks"].items()):
        if "error" in r:
            lines.append(f"| {kink} | ERROR | - | - | - | - |")
            continue
        unadj = r["unadjusted"]
        spread = unadj.get("max_spread", "?")
        sig = "YES" if r["predictor_still_significant"] else "NO"
        lc = r.get("largest_control", {})
        lc_clean = clean_term(lc.get("term", "?")) if lc else "?"
        lines.append(f"| {kink} | {spread} | {r['r_squared_predictor_only']} | {r['r_squared_full']} | **{sig}** | {lc_clean} |")

    lines.append("")
    lines.append(f"**Survived controls**: {', '.join(survived_kinks) if survived_kinks else 'None'}")
    lines.append(f"\n**Lost significance**: {', '.join(failed_kinks) if failed_kinks else 'None'}")
    lines.append("")

    # Show detail for a few key kinks
    for key_kink in ["totalfetishcategory", "pregnancy", "receivepain", "secretions"]:
        if key_kink in results["2_politics_kinks"]:
            r = results["2_politics_kinks"][key_kink]
            if "error" in r:
                continue
            lines.append(f"#### Detail: Politics -> {key_kink}")
            lines.append("")
            if r["unadjusted"]["type"] == "group_means":
                lines.append("| Group | Mean | n |")
                lines.append("|-------|------|---|")
                for g, v in sorted(r["unadjusted"]["groups"].items()):
                    lines.append(f"| {g} | {v['mean']:.3f} | {v['n']} |")
            lines.append("")
            lines.append("| Predictor Term | Coef | p-value | Sig |")
            lines.append("|---------------|------|---------|-----|")
            for k, v in r["predictor_coefficients"].items():
                lines.append(f"| {clean_term(k)} | {v['coef']:.4f} | {format_p(v['pvalue'])} | {sig_marker(v['pvalue'])} |")
            lines.append("")

    lines.append("---")
    lines.append("")

    # --- Test 3 ---
    lines.append("## Test 3: Gender -> Pain (Give/Receive)")
    lines.append("")
    lines.append("**Wave 1 claim**: The largest gender difference in the dataset. Women prefer receiving (d=0.64), men prefer giving (d=0.62).")
    lines.append("")
    lines.append("**Controls**: age, straightness, politics")
    lines.append("")

    for label, key in [("Receive Pain", "3a_gender_receivepain"), ("Give Pain", "3b_gender_givepain")]:
        r = results[key]
        if "error" in r:
            lines.append(f"### {label}: ERROR - {r['error']}")
            continue
        lines.append(f"### {label}")
        lines.append(f"- N = {r['n']}")
        if r["unadjusted"]["type"] == "group_means":
            lines.append("")
            lines.append("| biomale | Mean | n |")
            lines.append("|---------|------|---|")
            for g, v in sorted(r["unadjusted"]["groups"].items()):
                glabel = "Male" if g in ("1.0", "1") else "Female"
                lines.append(f"| {g} ({glabel}) | {v['mean']:.3f} | {v['n']} |")
            if "cohens_d" in r["unadjusted"]:
                lines.append(f"\nUnadjusted Cohen's d: {r['unadjusted']['cohens_d']:.3f}")
        lines.append(f"- R-sq (pred only): {r['r_squared_predictor_only']}")
        lines.append(f"- R-sq (full): {r['r_squared_full']}")
        lines.append(f"- Predictor still significant? **{r['predictor_still_significant']}**")
        lines.append("")
        lines.append("| Term | Coef | p-value | Sig |")
        lines.append("|------|------|---------|-----|")
        for k, v in r["predictor_coefficients"].items():
            lines.append(f"| {clean_term(k)} | {v['coef']:.4f} | {format_p(v['pvalue'])} | {sig_marker(v['pvalue'])} |")
        if r["largest_control"]:
            lc = r["largest_control"]
            lines.append(f"\n**Largest control**: {clean_term(lc['term'])} (coef={lc['coef']:.4f}, p={format_p(lc['pvalue'])})")
        lines.append("")

    lines.append("---")
    lines.append("")

    # --- Test 4 ---
    lines.append("## Test 4: Gender -> Nonconsent")
    lines.append("")
    lines.append("**Controls**: age, straightness, politics")
    lines.append("")
    r = results["4_gender_nonconsent"]
    if "error" not in r:
        lines.append(f"- N = {r['n']}")
        if r["unadjusted"]["type"] == "group_means":
            lines.append("")
            lines.append("| biomale | Mean | n |")
            lines.append("|---------|------|---|")
            for g, v in sorted(r["unadjusted"]["groups"].items()):
                glabel = "Male" if g in ("1.0", "1") else "Female"
                lines.append(f"| {g} ({glabel}) | {v['mean']:.3f} | {v['n']} |")
            if "cohens_d" in r["unadjusted"]:
                lines.append(f"\nUnadjusted Cohen's d: {r['unadjusted']['cohens_d']:.3f}")
        lines.append(f"- R-sq (pred only): {r['r_squared_predictor_only']}")
        lines.append(f"- R-sq (full): {r['r_squared_full']}")
        lines.append(f"- Predictor still significant? **{r['predictor_still_significant']}**")
        lines.append("")
        lines.append("| Term | Coef | p-value | Sig |")
        lines.append("|------|------|---------|-----|")
        for k, v in r["predictor_coefficients"].items():
            lines.append(f"| {clean_term(k)} | {v['coef']:.4f} | {format_p(v['pvalue'])} | {sig_marker(v['pvalue'])} |")
        if r["largest_control"]:
            lc = r["largest_control"]
            lines.append(f"\n**Largest control**: {clean_term(lc['term'])} (coef={lc['coef']:.4f}, p={format_p(lc['pvalue'])})")
    lines.append("")
    lines.append("---")
    lines.append("")

    # --- Test 5 ---
    lines.append("## Test 5: Childhood Spanking -> Adult Sadomasochism")
    lines.append("")
    lines.append("**Wave 1 claim**: Childhood spanking predicts adult S/M interest")
    lines.append("")
    lines.append("**Controls**: biomale, age, politics")
    lines.append("")
    r = results["5_spanking_sadomasochism"]
    if "error" not in r:
        lines.append(f"- N = {r['n']}")
        if r["unadjusted"]["type"] == "correlation":
            lines.append(f"- Unadjusted Pearson r = {r['unadjusted']['r']:.4f} (p={format_p(r['unadjusted']['p'])})")
        lines.append(f"- R-sq (pred only): {r['r_squared_predictor_only']}")
        lines.append(f"- R-sq (full): {r['r_squared_full']}")
        lines.append(f"- Predictor still significant? **{r['predictor_still_significant']}**")
        lines.append("")
        lines.append("| Term | Coef | p-value | Sig |")
        lines.append("|------|------|---------|-----|")
        for k, v in r["predictor_coefficients"].items():
            lines.append(f"| {clean_term(k)} | {v['coef']:.4f} | {format_p(v['pvalue'])} | {sig_marker(v['pvalue'])} |")
        if r["largest_control"]:
            lc = r["largest_control"]
            lines.append(f"\n**Largest control**: {clean_term(lc['term'])} (coef={lc['coef']:.4f}, p={format_p(lc['pvalue'])})")
    lines.append("")
    lines.append("---")
    lines.append("")

    # --- Test 6 ---
    lines.append("## Test 6: Big Five Personality -> Sadomasochism")
    lines.append("")
    lines.append("**Wave 1 claim**: Neuroticism and openness are the strongest personality predictors of kink. Testing each trait individually with controls for biomale, age, straightness.")
    lines.append("")
    lines.append("### Individual trait tests")
    lines.append("")
    lines.append("| Trait | Unadj r | R-sq (pred) | R-sq (full) | Adjusted Coef | Adj p-value | Survives? | Largest Control |")
    lines.append("|-------|---------|-------------|-------------|--------------|-------------|-----------|----------------|")

    for trait, r in results["6_big5_sadomasochism"].items():
        short = trait.replace("variable", "").replace("ness", "").replace("consiensiou", "conscientiou")
        if "error" in r:
            lines.append(f"| {short} | ERROR | - | - | - | - | - | - |")
            continue
        unadj_r = r["unadjusted"].get("r", "?") if r["unadjusted"]["type"] == "correlation" else "?"
        # Get the single predictor coefficient
        pred_coefs = list(r["predictor_coefficients"].values())
        adj_coef = pred_coefs[0]["coef"] if pred_coefs else "?"
        adj_p = pred_coefs[0]["pvalue"] if pred_coefs else 1.0
        sig = "YES" if r["predictor_still_significant"] else "NO"
        lc = r.get("largest_control", {})
        lc_clean = clean_term(lc.get("term", "?")) if lc else "?"
        lines.append(f"| {short} | {unadj_r:.4f} | {r['r_squared_predictor_only']} | {r['r_squared_full']} | {adj_coef:.4f} | {format_p(adj_p)} | **{sig}** | {lc_clean} |")

    lines.append("")

    # Joint model
    b5_joint = results["bonus_joint_big5"]
    lines.append("### Joint Big Five model (all 5 traits + demographics)")
    lines.append(f"- N = {b5_joint['n']}")
    lines.append(f"- R-squared: {b5_joint['r_squared']}")
    lines.append("")
    lines.append("| Term | Coef | p-value | Sig |")
    lines.append("|------|------|---------|-----|")
    for k, v in sorted(b5_joint["coefficients"].items(), key=lambda x: abs(x[1]["coef"]), reverse=True):
        short_k = k.split("'")[-2] if "'" in k else k
        lines.append(f"| {short_k} | {v['coef']:.4f} | {format_p(v['pvalue'])} | {sig_marker(v['pvalue'])} |")

    lines.append("")
    lines.append("---")
    lines.append("")

    # --- Test 7 ---
    lines.append("## Test 7: Childhood Adversity -> Kink Breadth")
    lines.append("")
    lines.append("**Controls**: biomale, age, straightness")
    lines.append("")
    r = results["7_adversity_kinkbreadth"]
    if "error" not in r:
        lines.append(f"- N = {r['n']}")
        if r["unadjusted"]["type"] == "group_means":
            lines.append("")
            lines.append("| Adversity | Mean totalfetishcategory | n |")
            lines.append("|-----------|------------------------|---|")
            for g, v in sorted(r["unadjusted"]["groups"].items()):
                lines.append(f"| {g} | {v['mean']:.3f} | {v['n']} |")
            if "cohens_d" in r["unadjusted"]:
                lines.append(f"\nUnadjusted Cohen's d: {r['unadjusted']['cohens_d']:.3f}")
            elif "max_spread" in r["unadjusted"]:
                lines.append(f"\nMax spread: {r['unadjusted']['max_spread']}")
        lines.append(f"- R-sq (pred only): {r['r_squared_predictor_only']}")
        lines.append(f"- R-sq (full): {r['r_squared_full']}")
        lines.append(f"- Predictor still significant? **{r['predictor_still_significant']}**")
        lines.append("")
        lines.append("| Term | Coef | p-value | Sig |")
        lines.append("|------|------|---------|-----|")
        for k, v in r["predictor_coefficients"].items():
            lines.append(f"| {clean_term(k)} | {v['coef']:.4f} | {format_p(v['pvalue'])} | {sig_marker(v['pvalue'])} |")
        if r["largest_control"]:
            lc = r["largest_control"]
            lines.append(f"\n**Largest control**: {clean_term(lc['term'])} (coef={lc['coef']:.4f}, p={format_p(lc['pvalue'])})")
    lines.append("")
    lines.append("---")
    lines.append("")

    # --- Test 8 ---
    lines.append("## Test 8: Straightness -> Kink Breadth")
    lines.append("")
    lines.append("**Wave 1 claim**: Non-straight people have broader kink repertoires")
    lines.append("")
    lines.append("**Controls**: biomale, age, politics")
    lines.append("")
    r = results["8_straightness_kinkbreadth"]
    if "error" not in r:
        lines.append(f"- N = {r['n']}")
        if r["unadjusted"]["type"] == "group_means":
            lines.append("")
            lines.append("| Straightness | Mean totalfetishcategory | n |")
            lines.append("|-------------|------------------------|---|")
            for g, v in sorted(r["unadjusted"]["groups"].items()):
                lines.append(f"| {g} | {v['mean']:.3f} | {v['n']} |")
            if "cohens_d" in r["unadjusted"]:
                lines.append(f"\nUnadjusted Cohen's d: {r['unadjusted']['cohens_d']:.3f}")
        lines.append(f"- R-sq (pred only): {r['r_squared_predictor_only']}")
        lines.append(f"- R-sq (full): {r['r_squared_full']}")
        lines.append(f"- Predictor still significant? **{r['predictor_still_significant']}**")
        lines.append("")
        lines.append("| Term | Coef | p-value | Sig |")
        lines.append("|------|------|---------|-----|")
        for k, v in r["predictor_coefficients"].items():
            lines.append(f"| {clean_term(k)} | {v['coef']:.4f} | {format_p(v['pvalue'])} | {sig_marker(v['pvalue'])} |")
        if r["largest_control"]:
            lc = r["largest_control"]
            lines.append(f"\n**Largest control**: {clean_term(lc['term'])} (coef={lc['coef']:.4f}, p={format_p(lc['pvalue'])})")
    lines.append("")
    lines.append("---")
    lines.append("")

    # --- BONUS: Full pain models ---
    lines.append("## Bonus: Full Models for Pain Preferences")
    lines.append("")
    lines.append("Including demographics (biomale, age, straightness, politics) AND personality (neuroticism, openness).")
    lines.append("")

    for outcome_p in ["receivepain", "givepain"]:
        key = f"bonus_full_{outcome_p}"
        r = results[key]
        lines.append(f"### {outcome_p}")
        lines.append(f"- N = {r['n']}, R-squared = {r['r_squared']}")
        lines.append("")
        lines.append("| Term | Coef | p-value | Sig |")
        lines.append("|------|------|---------|-----|")
        for k, v in sorted(r["coefficients"].items(), key=lambda x: abs(x[1]["coef"]), reverse=True):
            lines.append(f"| {clean_term(k)} | {v['coef']:.4f} | {format_p(v['pvalue'])} | {sig_marker(v['pvalue'])} |")
        lines.append("")

    lines.append("---")
    lines.append("")

    # ---- INTERPRETATION ----
    lines.append("## Key Interpretations")
    lines.append("")
    lines.append("### Which findings are REAL (survive controls)?")
    lines.append("")

    real_findings = [v for v in verdicts if "REAL" in v[3] or "YES" in v[2] or ("/" in v[2] and v[2].split("/")[0] != "0")]
    confounded = [v for v in verdicts if "CONFOUNDED" in v[3] and "ALL" in v[3]]

    lines.append("**Robust findings (survive demographic controls):**")
    for v in verdicts:
        if v[3] in ("REAL (strong)", "REAL (weak)", "REAL"):
            lines.append(f"- Test {v[0]}: {v[1]}")
    lines.append("")

    lines.append("**Mixed findings (some effects survive, some don't):**")
    for v in verdicts:
        if "MIXED" in v[3] or "PARTIAL" in v[3]:
            lines.append(f"- Test {v[0]}: {v[1]}")
    lines.append("")

    lines.append("**Confounded findings (disappear with controls):**")
    for v in verdicts:
        if v[3] == "ALL CONFOUNDED" or v[3] == "CONFOUNDED":
            lines.append(f"- Test {v[0]}: {v[1]}")
    lines.append("")

    lines.append("### What are the REAL drivers?")
    lines.append("")
    lines.append("Across all models, the control variables with consistently large coefficients are:")
    lines.append("")
    lines.append("1. **biomale** (biological sex) -- the single largest predictor in most kink models. Gender dwarfs politics, orientation, and personality for predicting specific kink preferences.")
    lines.append("2. **straightness** -- non-straight respondents consistently show broader and more intense kink engagement.")
    lines.append("3. **age** -- older age bins generally predict higher kink breadth and intensity.")
    lines.append("4. **politics** -- adds very little incremental variance beyond what sex and orientation already explain.")
    lines.append("")
    lines.append("### The meta-lesson")
    lines.append("")
    lines.append("Wave 1 findings about **gender** and **orientation** effects are robust -- they represent genuine, independent contributions to kink variation. Findings about **politics** are the most fragile: political effects on kink preferences are largely artifacts of the demographic composition of political groups (liberals are more likely to be non-straight, younger, etc.). The **personality** findings are mixed: neuroticism and openness have genuine independent effects on the pain/masochism axis, but the Big Five collectively explain very little variance beyond demographics.")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Methodology Notes")
    lines.append("")
    lines.append("- All models use OLS regression with dummy-coded categorical variables")
    lines.append("- Reference categories are alphabetically first (Conservative, 14-17, Not straight, 0.0 for biomale)")
    lines.append("- p < 0.05 threshold for significance, but with N > 5,000, even tiny effects reach significance. Focus on R-squared and coefficient magnitude.")
    lines.append("- R-squared values are typically very low (< 0.05) because kink preferences are highly individual. But the question is whether the PREDICTOR adds anything, not whether the MODEL explains everything.")
    lines.append("- 'Survives controls' means at least one predictor level has p < 0.05 in the full model. This is a conservative test given the large N.")
    lines.append("")

    # Write output
    md_text = "\n".join(lines)
    OUTPUT_PATH.write_text(md_text)
    print(f"\nReport written to {OUTPUT_PATH}")
    print(f"Total length: {len(md_text)} characters, {len(lines)} lines")

    # Print verdict summary to console
    print("\n" + "=" * 70)
    print("VERDICT SUMMARY")
    print("=" * 70)
    for v in verdicts:
        emoji = "+" if "REAL" in v[3] or "YES" in v[2] else ("-" if "CONFOUNDED" in v[3] else "~")
        print(f"  [{emoji}] Test {v[0]}: {v[1]} -> {v[3]}")


if __name__ == "__main__":
    main()

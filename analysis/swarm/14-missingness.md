# 14. Missingness Bias Diagnosis

**Core question:** The BKS uses gated questions -- if you didn't pass an earlier screening question, downstream kink columns are NA. If missingness differs systematically by gender, orientation, or politics, then group comparisons on gated columns are comparing *different subpopulations*, not the full sample.

**Dataset:** 15,503 rows, 365 columns.

---

## 1. Overall Missingness Rates

Two columns have 0% missingness (asked of everyone): `normalsex` and `totalfetishcategory`. All other kink columns have substantial missing data:

| Column | % Missing | N Missing | Severity |
|---|---|---|---|
| normalsex | 0.0% | 0 | Universal |
| totalfetishcategory | 0.0% | 0 | Universal |
| gentleness | 43.0% | 6,666 | Moderate |
| powerdynamic | 43.2% | 6,704 | Moderate |
| obedience | 43.6% | 6,760 | Moderate |
| lightbondage | 43.9% | 6,801 | Moderate |
| exhibitionself | 56.6% | 8,780 | High |
| multiplepartners | 59.6% | 9,239 | High |
| nonconsent | 63.9% | 9,900 | High |
| sadomasochism | 66.3% | 10,286 | High |
| receivepain | 67.0% | 10,383 | High |
| givepain | 67.0% | 10,383 | High |
| humiliation | 77.1% | 11,955 | Very High |
| secretions | 79.6% | 12,340 | Very High |
| genderplay | 81.8% | 12,675 | Very High |
| incest | 84.4% | 13,079 | Very High |
| bestiality | 90.2% | 13,984 | Extreme |
| brutality | 94.5% | 14,654 | Extreme |
| creepy | 95.6% | 14,816 | Extreme |
| vore | 96.1% | 14,897 | Extreme |
| dirty | 96.9% | 15,016 | Extreme |

Note: `receivepain` and `givepain` have identical missingness (10,383 each) because they share the same gate. Similarly, `powerdynamic` and `obedience` are nearly identical (6,704 vs 6,760).

---

## 2. Differential Missingness by Demographics

### 2a. By Gender (biomale: 0=female n=7,564, 1=male n=7,939)

**Flagged columns (>5pp gender difference in missingness):**

| Column | Male Miss% | Female Miss% | Diff (pp) | Who's more missing? |
|---|---|---|---|---|
| genderplay | 75.9% | 87.9% | 12.0 | Females |
| lightbondage | 49.5% | 38.0% | 11.5 | Males |
| gentleness | 48.4% | 37.4% | 11.0 | Males |
| receivepain | 72.2% | 61.5% | 10.7 | Males |
| givepain | 72.2% | 61.5% | 10.7 | Males |
| sadomasochism | 71.5% | 61.0% | 10.5 | Males |
| incest | 79.9% | 89.0% | 9.1 | Females |
| secretions | 75.3% | 84.1% | 8.8 | Females |
| obedience | 47.8% | 39.2% | 8.6 | Males |
| powerdynamic | 47.4% | 38.9% | 8.5 | Males |
| exhibitionself | 53.8% | 59.6% | 5.8 | Females |

**Pattern:** Most gated kink columns show males missing more often -- meaning *females who passed the gate* are overrepresented in the responder pool for S&M, bondage, pain, obedience, and power dynamics. The exceptions are `genderplay`, `incest`, and `secretions`, where males are overrepresented among responders.

### 2b. By Straightness (Straight n=13,705, Not straight n=1,798)

Only one column exceeds the 5pp threshold:

| Column | Straight Miss% | Not-Straight Miss% | Diff (pp) |
|---|---|---|---|
| genderplay | 82.5% | 76.4% | 6.1 |

Most columns show 1-4pp differences. Straightness-based missingness bias is much smaller than gender-based bias.

### 2c. By Politics (Liberal n=5,046, Moderate n=5,599, Conservative n=4,858)

Two columns exceed 5pp:

| Column | Liberal Miss% | Conservative Miss% | Diff (pp) |
|---|---|---|---|
| obedience | 40.3% | 45.5% | 5.2 |
| powerdynamic | 40.0% | 45.1% | 5.1 |

Liberals are somewhat more likely to have answered power/obedience questions. Other columns show <5pp political differences.

---

## 3. Responders vs Non-Responders: Systematic Differences

For every gated kink column, responders are dramatically kinkier than non-responders (measured by `totalfetishcategory`). This is expected -- the gate selects for interest -- but the effect sizes are large:

| Column | Responder Mean Fetish | Non-Responder Mean Fetish | Cohen's d |
|---|---|---|---|
| creepy | 17.74 | 9.68 | 1.38 |
| brutality | 16.80 | 9.65 | 1.22 |
| dirty | 16.38 | 9.83 | 1.10 |
| bestiality | 15.76 | 9.42 | 1.10 |
| vore | 15.78 | 9.80 | 1.00 |
| incest | 14.33 | 9.24 | 0.88 |
| nonconsent | 13.51 | 8.69 | 0.88 |
| humiliation | 13.92 | 8.89 | 0.88 |
| sadomasochism | 13.11 | 8.48 | 0.82 |
| receivepain/givepain | 13.14 | 8.51 | 0.82 |
| genderplay | 13.92 | 9.17 | 0.82 |
| powerdynamic | 11.99 | 7.48 | 0.80 |
| obedience | 11.99 | 7.51 | 0.79 |
| multiplepartners | 12.41 | 8.03 | 0.78 |
| lightbondage | 11.92 | 7.63 | 0.76 |
| secretions | 13.53 | 9.14 | 0.75 |
| exhibitionself | 12.41 | 8.23 | 0.73 |
| gentleness | 10.95 | 8.83 | 0.35 |

**All Cohen's d values are >0.7 except gentleness.** This means the respondent pool for every gated column is a fundamentally different population -- people who are already substantially kinkier than average.

### Gender composition of responders vs non-responders

For most gated columns, responders skew female:

| Column | % Male (Responders) | % Male (Non-Responders) |
|---|---|---|
| genderplay | 67.5% | 47.6% |
| incest | 65.7% | 48.5% |
| secretions | 62.0% | 48.4% |
| exhibitionself | 54.5% | 48.7% |
| lightbondage | 46.1% | 57.8% |
| sadomasochism | 43.4% | 55.2% |
| receivepain/givepain | 43.1% | 55.2% |
| obedience | 47.4% | 56.1% |
| powerdynamic | 47.5% | 56.1% |

**Critical insight:** For genderplay, incest, and secretions, respondents are disproportionately male. For bondage, S&M, and pain, respondents are disproportionately female. This means any "gender difference" in these kinks is partially an artifact of *who answered*.

---

## 4. Imputation Sensitivity: NA-Excluded vs 0-Imputed

The survey documentation says gated NAs should often be treated as "implicit 0s." Here is what happens when we impute 0 for missing values:

### Gender comparisons (Cohen's d: male vs female)

| Column | d (NA excluded) | d (0-imputed) | Change | Direction Flip? |
|---|---|---|---|---|
| givepain | 0.621 | 0.070 | -0.552 | No but near-zero |
| receivepain | -0.644 | -0.396 | +0.247 | No |
| lightbondage | -0.063 | -0.227 | -0.164 | No |
| gentleness | -0.047 | -0.214 | -0.168 | No |
| incest | 0.078 | 0.243 | +0.165 | No |
| obedience | 0.012 | -0.125 | -0.138 | **YES** |
| sadomasochism | -0.114 | -0.230 | -0.116 | No |
| genderplay | 0.202 | 0.312 | +0.110 | No |
| exhibitionself | -0.025 | 0.084 | +0.109 | **YES** |
| humiliation | -0.003 | 0.055 | +0.057 | **YES** |
| brutality | -0.153 | 0.001 | +0.154 | **YES** |

**Most dramatic changes:**
- **givepain**: Gender effect collapses from d=0.621 to d=0.070 (89% reduction). The apparent large male preference for giving pain almost entirely disappears under 0-imputation.
- **receivepain**: Effect shrinks from d=-0.644 to d=-0.396 (38% reduction). Women still score higher, but less dramatically.
- **obedience**: Direction flips from males slightly higher (d=0.012) to females higher (d=-0.125).
- **exhibitionself**: Direction flips from females slightly higher (d=-0.025) to males higher (d=0.084).
- **brutality**: Direction flips from females higher (d=-0.153) to essentially zero (d=0.001).

### Politics comparisons (Cohen's d: liberal vs conservative)

| Column | d (NA excluded) | d (0-imputed) | Direction Flip? |
|---|---|---|---|
| genderplay | -0.028 | 0.086 | **YES** |
| incest | 0.081 | -0.026 | **YES** |
| lightbondage | 0.012 | 0.048 | No |
| sadomasochism | 0.009 | 0.034 | No |
| receivepain | 0.123 | 0.070 | No |

For genderplay and incest, the political direction *reverses* under 0-imputation. Both had near-zero effects initially, so the reversals involve small effect sizes, but they demonstrate that political comparisons on these columns are unreliable.

---

## 5. Co-Missingness Matrix: Gate Group Identification

Pairwise Jaccard similarity of missingness patterns reveals clear gate groups:

### Perfect co-missingness (shared gate, Jaccard >= 0.95)

| Column A | Column B | Jaccard |
|---|---|---|
| receivepain | givepain | 1.000 |
| powerdynamic | obedience | 0.992 |
| sadomasochism | receivepain | 0.991 |
| sadomasochism | givepain | 0.991 |

**Gate Group 1:** `sadomasochism`, `receivepain`, `givepain` (and likely `spanking`) share a single gate. If you answered one, you answered all three.

**Gate Group 2:** `powerdynamic` and `obedience` share a gate.

### High co-missingness (Jaccard 0.88-0.95)

| Cluster | Columns | Jaccard Range |
|---|---|---|
| Extreme/taboo | vore, dirty, creepy, brutality | 0.93-0.95 |
| Extreme+bestiality | above + bestiality | 0.88-0.93 |
| Taboo+incest | above + incest | 0.83-0.88 |

The extreme taboo columns (vore, dirty, creepy, brutality, bestiality) have heavily overlapping missingness -- they appear to share either a common gate or are positioned sequentially behind similar gates.

---

## 6. Late-Added vs Gated vs Removed Questions

By analyzing missingness patterns across row-order quartiles (proxy for survey completion time):

### Truly gated (uniform missingness across quartiles, Q1-Q4 range <5pp)

| Column | Q1 Miss% | Q4 Miss% | Range | Confirmation |
|---|---|---|---|---|
| brutality | 94.8% | 93.9% | 0.9pp | Responders 7.2 points kinkier |
| vore | 96.1% | 95.6% | 0.4pp | Responders 6.0 points kinkier |
| dirty | 98.0% | 95.4% | 2.6pp | Responders 6.5 points kinkier |
| creepy | 96.8% | 94.7% | 2.1pp | Responders 8.1 points kinkier |
| humiliation | 76.4% | 71.6% | 4.7pp | Responders 5.0 points kinkier |

### Mixed gating + positional effect (Q1-Q4 range >5pp but still kink-correlated)

| Column | Q1 Miss% | Q4 Miss% | Range |
|---|---|---|---|
| incest | 92.3% | 74.6% | 17.7pp |
| genderplay | 89.7% | 73.9% | 15.8pp |
| secretions | 85.5% | 72.2% | 13.3pp |
| bestiality | 94.1% | 86.5% | 7.6pp |

These columns are gated AND show a positional gradient, suggesting either the gate was modified during the survey or there's a confound with respondent characteristics changing over time.

### Removed mid-survey (100% missing in Q3+Q4)

These questions were present early but removed partway through data collection:

| Column | Q1 Miss% | Q2 Miss% | Q3-Q4 | Topic |
|---|---|---|---|---|
| PMS mood symptoms | 49.8% | 63.4% | 100% | Menstrual cycle |
| Vaginal orgasms | 63.3% | 74.4% | 100% | Sexual function |
| Casual hookup experience | 60.0% | 71.8% | 100% | Relationship |
| Relationship endings | 60.0% | 71.8% | 100% | Relationship |
| Hormonal birth control | 77.7% | 82.5% | 100% | Reproductive |
| Menstrual cycle position | 79.4% | 84.1% | 100% | Menstrual cycle |
| Nude male body self-image | 81.9% | 86.8% | 100% | Body image |
| PMS symptoms | 89.1% | 91.6% | 100% | Menstrual cycle |

These are NOT gated by kink interest -- they are menstrual/reproductive questions that were likely removed when the survey was shortened.

### Added mid-survey (100% missing in Q1, present later)

| Column | Q1 Miss% | Q3-Q4 Miss% | Topic |
|---|---|---|---|
| Nude female body self-image | 100% | 74-78% | Body image |
| Admired as woman | 100% | 88-90% | Body image |
| Nude female breasts self-image | 100% | 88-89% | Body image |

---

## 7. Comprehensive Bias Risk Ranking

Combining all metrics into a risk score:

| Rank | Column | Risk Score | Overall Miss% | Gender Diff | Kink Selection d |
|---|---|---|---|---|---|
| 1 | **genderplay** | 30.2 | 81.8% | 12.0pp | 0.82 |
| 2 | **lightbondage** | 25.0 | 43.9% | 11.5pp | 0.76 |
| 3 | **receivepain** | 24.3 | 67.0% | 10.7pp | 0.82 |
| 4 | **givepain** | 24.3 | 67.0% | 10.7pp | 0.82 |
| 5 | **sadomasochism** | 24.0 | 66.3% | 10.5pp | 0.82 |
| 6 | **obedience** | 22.9 | 43.6% | 8.6pp | 0.79 |
| 7 | **powerdynamic** | 22.8 | 43.2% | 8.5pp | 0.80 |
| 8 | multiplepartners | 20.9 | 59.6% | 3.7pp | 0.78 |
| 9 | gentleness | 20.5 | 43.0% | 11.0pp | 0.35 |
| 10 | incest | 19.7 | 84.4% | 9.1pp | 0.88 |

---

## 8. Impact Assessment: Which Findings Are Most Threatened?

### HIGH RISK -- Findings that likely change under imputation

1. **"Men prefer giving pain more than women" (givepain by gender):** d=0.621 collapses to d=0.070 under 0-imputation. The apparent large gender difference is almost entirely an artifact of differential response rates. 89% of the effect disappears.

2. **"Women prefer receiving pain more than men" (receivepain by gender):** d=-0.644 shrinks to d=-0.396. Still significant but overstated by ~38%.

3. **"Genderplay is a male preference" (genderplay by gender):** Effect *increases* from d=0.202 to d=0.312 under 0-imputation (because even more non-responding females get imputed to 0). But 82% of the data is missing, so both estimates are unreliable.

4. **Any political comparison on genderplay or incest:** Direction flips under 0-imputation, though effect sizes are small in both cases.

### MODERATE RISK -- Findings that shift but don't reverse

5. **"Women prefer bondage more than men" (lightbondage by gender):** Effect amplifies from d=-0.063 to d=-0.227 under 0-imputation, because males are disproportionately missing.

6. **"Obedience gender differences" (obedience by gender):** Direction flips from negligible male preference (d=0.012) to small female preference (d=-0.125).

7. **Sadomasochism gender effects:** Double from d=-0.114 to d=-0.230 under 0-imputation.

### LOWER RISK -- Still affected but effects are consistent

8. Columns with >90% missing (vore, dirty, creepy, brutality): Uniform missingness across demographics suggests the gate works similarly for everyone. However, the extreme selection effect (responders are 1.0-1.4 SDs kinkier) means these columns only represent the most interested 4-10% of respondents.

---

## 9. Recommendations

### Mandatory caveats for any finding involving these columns:

| Severity | Columns | Required caveat |
|---|---|---|
| **Must caveat** | givepain, receivepain, sadomasochism, obedience | "Gender comparisons may be biased: 10-11pp differential missingness by gender, and 0-imputation changes effect sizes by 38-89%. Treat gender differences as upper bounds." |
| **Must caveat** | genderplay, incest | "82-84% of data is missing. Responders are a highly self-selected subgroup (d>0.8 kinkier). Results describe the interested minority, not the population." |
| **Should caveat** | lightbondage, powerdynamic, gentleness, exhibitionself | "8-11pp gender differential in missingness. Under 0-imputation, effects shift substantially though direction is preserved." |
| **Note** | multiplepartners, nonconsent, humiliation | "5-8pp gender differential in missingness. Under 0-imputation, effects change modestly (<0.1 d-units)." |
| **Minimal concern** | normalsex, totalfetishcategory | Universal response -- no missingness bias. |

### Analytical recommendations:

1. **Never report raw group means on gated columns without noting the selection effect.** Responders are 0.7-1.4 SDs kinkier than non-responders on totalfetishcategory.

2. **For gender comparisons, always report both NA-excluded and 0-imputed results** as a sensitivity check. If they disagree substantially, flag the finding as unstable.

3. **Treat givepain gender differences as unreliable.** The 89% collapse under 0-imputation is the most dramatic sensitivity failure in the dataset.

4. **For columns with >80% missing (genderplay, incest, bestiality, vore, dirty, creepy, brutality, secretions):** Frame all findings as "among those interested in X" rather than population-level statements.

5. **The sadomasochism/receivepain/givepain gate group** has identical missingness -- any finding that compares these columns is immune to gate bias *between them*, but all three share the same demographic skew (10.5-10.7pp gender differential).

6. **Late-added/removed columns should be excluded from cross-respondent analyses** unless restricted to the time window when they were active. The menstrual/reproductive questions (PMS, birth control, vaginal orgasms) were removed mid-survey and have ~100% missingness in the second half.

7. **For the "mixed" columns (incest, genderplay, secretions)** that show both gating effects and positional gradients (13-18pp range across quartiles), consider whether the gate changed during data collection. These columns may have different effective sample compositions in early vs late respondents.

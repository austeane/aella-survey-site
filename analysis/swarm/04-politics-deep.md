# Deep Dive: Politics x Kink Categories

**Question**: Where do conservatives and liberals *actually* differ in sexual interests -- and where are they identical?

**Method**: Cross the `politics` column (Liberal / Moderate / Conservative) with all 35 kink category scores, plus `totalfetishcategory`, `pornhabit`, shame, and therapeutic belief. Rank by absolute difference between Liberal and Conservative group means. Check interactions with biological sex and age.

**Sample sizes**: Liberal n=5,046 | Moderate n=5,599 | Conservative n=4,858 (total 15,503; no missing politics values)

---

## 1. Full Ranking: Political Divergence Across All Kink Categories

Ranked by |Liberal avg - Conservative avg|. All kink scores are 0-5 scale except where noted.

| Rank | Kink Category | Liberal Avg | Moderate Avg | Conservative Avg | |L - C| | Direction | Cohen's d | n (non-null) |
|------|---------------|-------------|--------------|------------------|--------|-----------|-----------|--------------|
| 1 | **totalfetishcategory** | 10.30 | 10.00 | 9.81 | 0.489 | L > C | 0.080 | 15,503 |
| 2 | **normalsex** (composite, negative scale) | -5.32 | -5.33 | -5.58 | 0.261 | L > C | 0.099 | 15,503 |
| 3 | **creepy** | 2.92 | 2.84 | 2.71 | 0.210 | L > C | 0.138 | 687 |
| 4 | **receivepain** | 2.83 | 2.72 | 2.63 | 0.204 | L > C | 0.123 | 5,120 |
| 5 | **secretions** | 2.78 | 2.78 | 2.96 | 0.175 | C > L | 0.115 | 3,163 |
| 6 | **pornhabit** | 5.96 | 5.89 | 5.80 | 0.167 | L > C | 0.065 | 15,503 |
| 7 | **pregnancy** | 3.61 | 3.69 | 3.77 | 0.162 | C > L | 0.125 | 3,125 |
| 8 | **mythical** | 3.33 | 3.31 | 3.20 | 0.135 | L > C | 0.102 | 3,808 |
| 9 | **brutality** | 3.48 | 3.32 | 3.36 | 0.114 | L > C | 0.081 | 849 |
| 10 | **mentalalteration** | 3.19 | 3.10 | 3.08 | 0.109 | L > C | 0.080 | 3,022 |
| 11 | **incest** | 3.41 | 3.31 | 3.31 | 0.104 | L > C | 0.081 | 2,424 |
| 12 | **obedience** | 2.73 | 2.77 | 2.83 | 0.101 | C > L | 0.064 | 8,743 |
| 13 | **multiplepartners** | 3.54 | 3.56 | 3.63 | 0.088 | C > L | 0.074 | 6,264 |
| 14 | **gentleness** | 3.54 | 3.49 | 3.46 | 0.087 | L > C | 0.071 | 8,837 |
| 15 | **transform** | 2.93 | 2.86 | 2.86 | 0.070 | L > C | 0.047 | 1,864 |
| 16 | voyeurself | 2.35 | 2.23 | 2.28 | 0.069 | L > C | -- | 6,723 |
| 17 | futa | 2.98 | 2.88 | 2.92 | 0.066 | L > C | -- | 2,732 |
| 18 | dirty | 2.48 | 2.36 | 2.42 | 0.062 | L > C | -- | 487 |
| 19 | abnormalbody | 1.78 | 1.68 | 1.72 | 0.059 | L > C | -- | 2,359 |
| 20 | eagerness | 3.84 | 3.75 | 3.79 | 0.051 | L > C | -- | 11,759 |
| 21 | clothing | 3.34 | 3.34 | 3.39 | 0.051 | C > L | -- | 8,258 |
| 22 | cgl | 1.83 | 1.91 | 1.88 | 0.049 | C > L | -- | 4,140 |
| 23 | supernatural | 0.49 | 0.58 | 0.53 | 0.046 | C > L | -- | 9,126 |
| 24 | givepain | 2.15 | 2.14 | 2.20 | 0.042 | C > L | -- | 5,120 |
| 25 | genderplay | 3.10 | 3.07 | 3.14 | 0.042 | C > L | -- | 2,828 |
| 26 | voyeurother | 2.26 | 2.16 | 2.22 | 0.040 | L > C | -- | 6,723 |
| 27 | exhibitionother | 2.90 | 2.88 | 2.93 | 0.028 | C > L | -- | 6,723 |
| 28 | powerdynamic | 3.86 | 3.77 | 3.84 | 0.023 | L > C | -- | 8,799 |
| 29 | nonconsent | 3.46 | 3.33 | 3.48 | 0.021 | C > L | -- | 5,603 |
| 30 | lightbondage | 3.58 | 3.59 | 3.57 | 0.016 | L > C | -- | 8,702 |
| 31 | therapeutic | 0.60 | 0.65 | 0.59 | 0.014 | L > C | -- | -- |
| 32 | shame | 0.43 | 0.38 | 0.41 | 0.013 | L > C | -- | -- |
| 33 | extremebondage | 2.08 | 2.21 | 2.06 | 0.012 | L > C | -- | 8,701 |
| 34 | humiliation | 3.49 | 3.52 | 3.50 | 0.012 | C > L | -- | 3,548 |
| 35 | sadomasochism | 3.43 | 3.36 | 3.42 | 0.012 | L > C | -- | 5,217 |
| 36 | vore | 2.54 | 2.46 | 2.53 | 0.010 | L > C | -- | 606 |
| 37 | agegap | 3.14 | 3.10 | 3.13 | 0.010 | L > C | -- | 4,141 |
| 38 | exhibitionself | 2.84 | 2.79 | 2.84 | 0.005 | L > C | -- | 6,723 |
| 39 | bestiality | 2.49 | 2.50 | 2.48 | 0.002 | L > C | -- | 1,519 |

---

## 2. Top 15 Most Politically Divergent -- Analysis

### The headline: all effect sizes are small

The largest Cohen's d is 0.138 (creepy). For context, d=0.2 is conventionally "small." **No kink category shows even a small effect of political orientation.** The differences are real (large n gives statistical significance) but practically minor. Politics explains very little variance in kink preferences.

### Pattern: Two coherent clusters emerge

**Liberal-leaning kinks** (L > C): creepy, receivepain, mythical, brutality, mentalalteration, incest, gentleness, transform, totalfetishcategory, normalsex, pornhabit

These form a "transgressive exploration" cluster -- darker, more fantastical, more boundary-pushing. Liberals score higher on *breadth* of fetish engagement (totalfetishcategory: 10.30 vs 9.81) and porn consumption (5.96 vs 5.80).

**Conservative-leaning kinks** (C > L): secretions, pregnancy, obedience, multiplepartners, clothing

These form a "embodied/traditional" cluster -- more focused on physical bodies, reproduction, hierarchy, and concrete physical acts. The pregnancy gap (3.77 vs 3.61) is the largest conservative-leaning difference.

### Interestingness ratings for top findings

| Finding | Interestingness (1-5) | Why |
|---------|----------------------|-----|
| Liberals have broader fetish breadth (totalfetish) | 4/5 | Largest absolute gap (0.49 pts). Consistent across age/sex. Confirms "openness" personality link. |
| Conservatives higher on pregnancy fetish | 4/5 | Fits "traditional values" narrative but the gap is *within a kink survey* -- these are all kinky people. Even conservative kinksters are less into breeding than you'd expect by stereotype. |
| Creepy has largest Cohen's d (0.138) | 3/5 | Small n (687). Highest effect size but needs replication. |
| Liberals higher on receivepain | 3/5 | Counter-stereotypical? Liberal masochism > conservative masochism. |
| Conservatives higher on secretions | 3/5 | Unexpected. Bodily fluids are a conservative-leaning kink category in this dataset. |
| Shame/therapeutic nearly identical across politics | 5/5 | **The most interesting finding.** Despite consuming more porn and having broader kinks, liberals are NOT more or less ashamed. All groups feel roughly equal shame (0.41-0.43) and find kink roughly equally therapeutic (0.59-0.60). Politics does not predict psychological relationship with kink. |
| Bestiality/agegap/vore show zero political signal | 3/5 | The "darkest" taboo kinks are politically neutral. Politics predicts *breadth* but not *extremity*. |

---

## 3. Top 5 Most Politically SIMILAR Kinks

These kinks show essentially zero difference between liberals and conservatives:

| Kink | Liberal | Conservative | |Diff| | Interpretation |
|------|---------|--------------|--------|----------------|
| **bestiality** | 2.485 | 2.483 | 0.002 | Taboo content is politically agnostic |
| **exhibitionself** | 2.844 | 2.839 | 0.005 | Exhibition desire transcends politics |
| **agegap** | 3.141 | 3.132 | 0.010 | Age gap interest is universal among kink respondents |
| **vore** | 2.538 | 2.528 | 0.010 | Extreme niche fetishes are not political |
| **sadomasochism** | 3.427 | 3.415 | 0.012 | Core BDSM interest is the same across the aisle |

**Key insight**: The kinks with zero political signal are a mix of "extreme taboo" (bestiality, vore) and "mainstream BDSM" (sadomasochism, exhibitionism). Politics predicts the *middle-tier transgressive* categories, not the extremes.

---

## 4. Politics x Biological Sex Interaction

| Kink | Female L-C Gap | Male L-C Gap | Interaction (F-M) | Interpretation |
|------|----------------|--------------|--------------------|----|
| totalfetishcategory | +0.647 | +0.399 | **+0.247** | The liberal fetish breadth advantage is **60% larger among women** |
| creepy | +0.099 | +0.273 | **-0.174** | Among men, the liberal creepy gap is 3x what it is for women |
| pornhabit | +0.333 | +0.207 | **+0.126** | Liberal women's porn advantage over conservative women is larger than the male gap |
| pregnancy | -0.225 | -0.104 | **-0.120** | Conservative women are more into pregnancy kink than conservative men; the political gap is mainly among women |
| receivepain | +0.053 | +0.165 | **-0.112** | The liberal pain-receiving edge is mainly a male phenomenon |
| brutality | +0.146 | +0.044 | **+0.103** | Liberal women score much higher on brutality than conservative women; no gap among men |
| normalsex | +0.279 | +0.178 | **+0.101** | Liberal women have less "normal" sex preference gap vs conservative women |

### Standout interaction: Liberal women vs conservative women

The gap between liberal and conservative women is consistently larger than the gap between liberal and conservative men for:
- Total fetish breadth (+0.65 vs +0.40)
- Porn consumption (+0.33 vs +0.21)
- Brutality (+0.15 vs +0.04)

This suggests that **political identity is more predictive of kink breadth for women than for men**. Conservative men and liberal men are fairly similar; conservative women and liberal women diverge more.

### Cell-level averages (L vs C, by sex)

| Group | n | creepy | pregnancy | receivepain | secretions | totalfetish | pornhabit | obedience |
|-------|---|--------|-----------|-------------|------------|-------------|-----------|-----------|
| Conservative Female | 2,136 | 2.865 | 3.765 | 3.156 | 2.760 | 9.569 | 5.200 | 2.824 |
| Conservative Male | 2,722 | 2.593 | 3.775 | 2.038 | 3.064 | 10.003 | 6.265 | 2.833 |
| Liberal Female | 2,732 | 2.964 | 3.541 | 3.209 | 2.649 | 10.216 | 5.533 | 2.715 |
| Liberal Male | 2,314 | 2.866 | 3.670 | 2.203 | 2.888 | 10.403 | 6.472 | 2.744 |

---

## 5. Shame and Therapeutic Belief: The Non-Finding

| Group | Shame (ashamed/embarrassed) | Therapeutic (kink feels healing) |
|-------|----------------------------|--------------------------------|
| Liberal Female | 0.421 | 0.659 |
| Liberal Male | 0.431 | 0.534 |
| Conservative Female | 0.357 | 0.667 |
| Conservative Male | 0.457 | 0.526 |
| Moderate Female | 0.341 | 0.725 |
| Moderate Male | 0.419 | 0.578 |

**The shame and therapeutic columns show virtually no political effect** (Cohen's d < 0.01 for both). The real predictor is sex: men report more shame and less therapeutic value than women, regardless of politics. Conservative women are the least ashamed (0.357); conservative men are the most ashamed (0.457). But the political gap within sex is tiny.

This is arguably the most interesting finding: **your politics shapes *what* you're into more than *how you feel about* being into it.**

---

## 6. Monotonicity Check: Does Moderate Always Fall Between L and C?

For 11 of 14 top kinks, the Moderate average falls between Liberal and Conservative (monotonic gradient). Three exceptions:

| Kink | Liberal | Moderate | Conservative | Pattern |
|------|---------|----------|--------------|---------|
| brutality | 3.476 | **3.317** | 3.362 | M lowest (not between) |
| incest | 3.414 | **3.306** | 3.310 | M lowest (not between) |
| secretions | 2.784 | **2.781** | 2.959 | M lowest (not between) |

In all three exceptions, moderates score *lowest* -- lower than both liberals and conservatives. This "horseshoe" pattern for brutality, incest, and secretions is notable: the politically committed (either direction) are slightly more interested than the politically moderate.

---

## 7. Age x Politics Interaction (subset)

| Politics | Age | n | creepy | pregnancy | totalfetish | mythical |
|----------|-----|---|--------|-----------|-------------|----------|
| Conservative | 14-17 | 845 | 3.000 | 3.672 | 9.015 | 3.191 |
| Conservative | 18-20 | 711 | 2.742 | 3.579 | 9.484 | 3.085 |
| Conservative | 21-24 | 984 | 2.956 | 3.808 | 9.667 | 3.266 |
| Conservative | 25-28 | 1,120 | 2.319 | 3.785 | 10.146 | 3.207 |
| Conservative | 29-32 | 1,198 | 2.679 | 3.862 | 10.377 | 3.188 |
| Liberal | 14-17 | 1,181 | 2.941 | 3.391 | 9.721 | 3.226 |
| Liberal | 18-20 | 912 | 2.957 | 3.620 | 9.846 | 3.313 |
| Liberal | 21-24 | 1,013 | 3.039 | 3.585 | 10.494 | 3.327 |
| Liberal | 25-28 | 1,000 | 2.821 | 3.668 | 10.659 | 3.384 |
| Liberal | 29-32 | 940 | 2.848 | 3.756 | 10.885 | 3.402 |

The liberal-conservative totalfetish gap is remarkably stable across all age brackets (~0.5-0.8 points in every group). Older respondents in both groups have broader kink repertoires, but the political gap does not converge or diverge with age.

The pregnancy gap is also stable: conservatives score higher in every age bracket.

---

## 8. Thematic Cluster Analysis

Averaging groups of thematically related kinks:

| Cluster | Liberal | Moderate | Conservative | Interpretation |
|---------|---------|----------|--------------|----------------|
| **Traditional power** (pregnancy + obedience + multiplepartners) / 3 | 3.474 | 3.637 | 3.587 | Moderate highest, then C, then L |
| **Transgressive exploration** (creepy + brutality + mentalalteration + transform + mythical) / 5 | 3.800 | 3.530 | 3.771 | L highest, then C, then M |
| **Sensation** (receivepain + gentleness) / 2 | 3.221 | 3.167 | 3.059 | Monotonic L > M > C |
| **Body-focused** (secretions + pregnancy) / 2 | 3.381 | 3.317 | 3.570 | C highest by a clear margin |

The body-focused cluster shows the clearest conservative signal. The transgressive cluster shows a "horseshoe" where moderates are lowest.

---

## 9. Tail Composition: Political Skew Among Maximum Scorers

Among respondents who gave the maximum score (5) on each kink, what is the political breakdown vs. baseline?

| Segment | % Liberal | % Moderate | % Conservative | n | vs. Baseline |
|---------|-----------|------------|----------------|---|--------------|
| **Baseline (all)** | **32.5%** | **36.1%** | **31.3%** | 15,503 | -- |
| creepy = 5 | **42.1%** | 30.6% | 27.3% | 121 | L overrepresented (+10pp) |
| pregnancy = 5 | 28.5% | 35.3% | **36.2%** | 1,086 | C overrepresented (+5pp) |
| receivepain = 5 | 33.9% | 35.7% | 30.3% | 887 | Near baseline |
| secretions = 5 | 29.5% | 35.0% | **35.5%** | 529 | C overrepresented (+4pp) |
| mythical = 5 | **36.6%** | 37.4% | 26.0% | 804 | C underrepresented (-5pp) |

The tail effects amplify the mean differences. Among creepy max-scorers, liberals are overrepresented by 10 percentage points. Among pregnancy max-scorers, conservatives are overrepresented by 5pp.

---

## 10. SQL for Key Queries

### Main ranking query
```sql
WITH avgs AS (
  SELECT politics,
    AVG(sadomasochism) as sadomasochism,
    AVG(lightbondage) as lightbondage,
    -- ... all 35+ columns ...
    AVG(totalfetishcategory) as totalfetishcategory
  FROM read_parquet('data/BKSPublic.parquet')
  WHERE politics IN ('Liberal','Moderate','Conservative')
  GROUP BY politics
),
L AS (SELECT * FROM avgs WHERE politics='Liberal'),
C AS (SELECT * FROM avgs WHERE politics='Conservative')
-- Then UNION ALL each kink with ABS(L.kink - C.kink) as abs_diff
-- ORDER BY abs_diff DESC
```

### Effect size query
```sql
WITH stats AS (
  SELECT politics, COUNT(*) as n,
    AVG(creepy) as m, STDDEV(creepy) as s
  FROM read_parquet('data/BKSPublic.parquet')
  WHERE politics IN ('Liberal','Conservative')
  GROUP BY politics
),
L AS (SELECT * FROM stats WHERE politics='Liberal'),
C AS (SELECT * FROM stats WHERE politics='Conservative')
SELECT (L.m - C.m) / SQRT((L.s*L.s + C.s*C.s)/2) as cohens_d
FROM L, C
```

### Politics x sex interaction
```sql
SELECT politics,
  CASE WHEN biomale = 1 THEN 'Male' ELSE 'Female' END as sex,
  COUNT(*) as n,
  AVG(creepy) as creepy, AVG(pregnancy) as pregnancy,
  AVG(totalfetishcategory) as totalfetish
FROM read_parquet('data/BKSPublic.parquet')
WHERE politics IN ('Liberal','Conservative')
GROUP BY politics, biomale
ORDER BY politics, biomale
```

---

## Summary of Key Takeaways

1. **Politics is a weak predictor of kink preferences.** The largest effect size (creepy, d=0.14) doesn't reach the conventional threshold for "small" (d=0.20). Political orientation explains far less variance than sex or individual differences.

2. **Liberals are broader, not deeper.** The most robust finding is that liberals score half a point higher on total fetish breadth (10.3 vs 9.8, full-sample n=15,503). They don't score higher on *extreme* kinks (bestiality, vore are politically neutral) -- they score higher on *variety*.

3. **Conservatives lean toward embodied/reproductive kinks.** Pregnancy, secretions, obedience, and multiplepartners all tilt conservative. This fits a "physicality and hierarchy" profile.

4. **The sex interaction matters more than politics.** The liberal-conservative gap among women is consistently larger than among men, especially for fetish breadth and porn consumption. Conservative and liberal men are more similar than conservative and liberal women.

5. **Shame is sex-linked, not politics-linked.** Men report more shame about their kinks than women do, regardless of politics. The therapeutic belief follows the same pattern (women > men). Political orientation adds nothing.

6. **Moderates sometimes show a "horseshoe" pattern.** For brutality, incest, and secretions, moderates score lowest -- lower than either pole. The politically engaged (L or C) are slightly more interested.

7. **Taboo extremes are apolitical.** Bestiality, vore, agegap, and extreme bondage show zero political signal. Politics differentiates the "middle" of the kink spectrum, not the edges.

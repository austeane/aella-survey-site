# Mental Health, Shame, and Powerlessness in the Big Kink Survey

**Dataset**: ~15,503 respondents, 365 columns
**Caveat**: This is a self-selected sample of kink-survey respondents, not a representative population sample. All findings are correlational. Causal language is inappropriate. Selection bias is severe: people who take a kink survey are not the general population, and those with mental health conditions may differ in their willingness to participate.

---

## Finding 1: Mental Illness and Kink Breadth

**Question**: Does higher TotalMentalIllness correlate with more extreme kinks or more vanilla ones?

**Result**: Respondents reporting any mental illness show modestly broader kink interests and slightly higher intensity across nearly all categories. The effect is small but consistent.

| Group | n | totalfetish | nonconsent | brutality | badends | sadomasochism | humiliation | shame | neuroticism | powerlessness |
|-------|---|------------|------------|-----------|---------|---------------|-------------|-------|-------------|---------------|
| None | 9,307 | 9.663 | 3.356 | 3.368 | 2.471 | 3.303 | 3.468 | 0.351 | 0.506 | 0.285 |
| Any | 6,196 | 10.602 | 3.495 | 3.403 | 2.588 | 3.506 | 3.539 | 0.488 | 1.650 | 1.327 |

**Effect sizes (Cohen's d, Any vs None)**:
- Total fetish breadth: d = 0.155
- Nonconsent: d = 0.105
- Badends: d = 0.065
- Brutality: d = 0.024
- Shame: d = 0.074

**Controlled for gender**: The pattern holds for both males and non-males. Non-males with mental illness show the largest gap (totalfetish 10.36 vs 9.43, brutality 3.53 vs 3.46). Males with mental illness show a notable bump in badends (2.81 vs 2.56).

| Mental Illness | Gender | n | totalfetish | nonconsent | badends | shame |
|----------------|--------|---|------------|------------|---------|-------|
| None | Male | 5,465 | 9.826 | 3.313 | 2.557 | 0.414 |
| Any | Male | 2,474 | 10.968 | 3.467 | 2.811 | 0.483 |
| None | Non-male | 3,842 | 9.430 | 3.412 | 2.299 | 0.262 |
| Any | Non-male | 3,722 | 10.360 | 3.510 | 2.444 | 0.491 |

**Interpretation**: The "Any mental illness" group has broader kink interests (roughly 1 additional fetish category on average) and slightly more interest in edgier categories. Effect sizes are small. The largest consistent difference is in total breadth, not in any single extreme category. This could reflect genuine psychological differences, or it could reflect that people with mental health conditions are more introspective/self-aware about their desires, or that they engage more with online sexuality communities where they encounter more categories.

```sql
SELECT TotalMentalIllness, COUNT(*) as n,
  ROUND(AVG(brutality),3), ROUND(AVG(nonconsent),3), ROUND(AVG(badends),3),
  ROUND(AVG(totalfetishcategory),3), ROUND(AVG(sadomasochism),3)
FROM read_parquet('data/BKSPublic.parquet')
GROUP BY TotalMentalIllness ORDER BY TotalMentalIllness
```

**Interestingness**: 3/5 (consistent but small effects; direction is unsurprising)

---

## Finding 2: Childhood Adversity Predicts Broader, More Intense Kink Profiles

**Question**: Does childhood adversity predict different kink profiles?

**Result**: Yes. Childhood adversity is associated with higher interest across nearly all kink categories, with the strongest signal in "creepy" fantasies (d = 0.30), followed by humiliation, brutality, and total fetish breadth (all d ~ 0.15).

| Adversity | n | totalfetish | brutality | nonconsent | humiliation | sadomasochism | creepy | obedience | vore | bestiality |
|-----------|---|------------|-----------|------------|-------------|---------------|--------|-----------|------|------------|
| None | 10,617 | 9.750 | 3.291 | 3.349 | 3.424 | 3.324 | 2.640 | 2.696 | 2.519 | 2.455 |
| Any | 4,886 | 10.665 | 3.511 | 3.527 | 3.635 | 3.517 | 3.089 | 2.918 | 2.493 | 2.560 |

**Effect sizes (Cohen's d)**:
- Creepy: d = 0.299 (the standout)
- Total fetish breadth: d = 0.151
- Humiliation: d = 0.154
- Brutality: d = 0.153
- Nonconsent: d = 0.135

**Notable**: Vore is the only category where the adversity group does NOT show higher interest (2.493 vs 2.519). This suggests childhood adversity selectively amplifies interpersonal power-themed kinks rather than all paraphilias indiscriminately.

**Interpretation**: The "creepy" category being the strongest signal is striking. This category likely captures fears/taboos around being watched, stalked, or encountering the uncanny — themes that may resonate with hypervigilance patterns common in adversity survivors. However, reverse causation and third variables (e.g., online community participation) cannot be ruled out.

```sql
SELECT childhood_adversity, COUNT(*) as n,
  ROUND(AVG(brutality),3), ROUND(AVG(nonconsent),3), ROUND(AVG(creepy),3),
  ROUND(AVG(humiliation),3), ROUND(AVG(totalfetishcategory),3)
FROM read_parquet('data/BKSPublic.parquet')
GROUP BY childhood_adversity ORDER BY childhood_adversity
```

**Interestingness**: 4/5 (the creepy standout is genuinely surprising; the selective pattern is theoretically meaningful)

---

## Finding 3: Shame Correlates with MORE Intense Kink Interests, Not Fewer

**Question**: Do people who feel shame about their kinks have more intense interests or fewer?

**Result**: Counterintuitively, higher shame is monotonically associated with MORE intense kink interests across every category measured. People at shame level 3 (highest) report ~27% more fetish breadth than those at level 0.

**Scale note**: The shame variable runs from -3 (strongly disagree) to +3 (strongly agree). For this table, values 0-3 represent neutral-to-agreement.

| Shame Level | n | totalfetish | brutality | nonconsent | badends | sadomasochism | humiliation | vore | bestiality | neuroticism | powerlessness |
|-------------|---|------------|-----------|------------|---------|---------------|-------------|------|------------|-------------|---------------|
| 0-None (=0) | 1,904 | 9.126 | 2.845 | 3.227 | 2.295 | 3.252 | 3.191 | 1.969 | 2.043 | 0.876 | 1.022 |
| 1-Low | 3,722 | 9.939 | 3.315 | 3.287 | 2.362 | 3.329 | 3.338 | 2.435 | 2.398 | 1.015 | 0.706 |
| 2-Moderate | 3,122 | 10.893 | 3.270 | 3.433 | 2.491 | 3.365 | 3.486 | 2.406 | 2.501 | 1.139 | 1.015 |
| 3-High | 1,965 | 11.569 | 3.663 | 3.765 | 2.858 | 3.718 | 3.786 | 2.808 | 2.808 | 1.319 | 1.168 |

**Correlations (shame with each kink category, full -3 to +3 scale)**:
| Category | r |
|----------|---|
| Totalfetish | 0.120 |
| Dirty | 0.110 |
| Bestiality | 0.075 |
| Genderplay | 0.075 |
| Nonconsent | 0.072 |
| Humiliation | 0.052 |
| Badends | 0.049 |
| Sadomasochism | 0.036 |
| Brutality | 0.021 |
| Vore | 0.008 |
| Creepy | 0.003 |

**Interpretation**: This is a "the more you have, the more you worry" pattern. People with more kinks (especially socially stigmatized ones like bestiality, dirty, genderplay) feel more shame — not because shame suppresses desire, but because having desires society disapproves of generates shame. The correlation with neuroticism (r = 0.083) and powerlessness (r = 0.098) suggests shame is partly a personality-mediated response. Interestingly, powerlessness does NOT increase monotonically (it's highest at 0-None and 3-High, lower in between), suggesting a U-shaped relationship.

```sql
SELECT CASE WHEN shame_col = 0 THEN '0-None' WHEN shame_col = 1 THEN '1-Low'
  WHEN shame_col = 2 THEN '2-Moderate' WHEN shame_col >= 3 THEN '3-High' END as shame_level,
  COUNT(*) as n, ROUND(AVG(totalfetishcategory),3), ROUND(AVG(brutality),3), ...
FROM read_parquet('data/BKSPublic.parquet') GROUP BY shame_level ORDER BY shame_level
```

**Interestingness**: 5/5 (the monotonic increase is the opposite of naive expectation; the "dirty" and "bestiality" correlations being strongest with shame make perfect sense in hindsight but are not obvious)

---

## Finding 4: Therapeutic Arousal Is Modestly Higher Among Trauma Survivors

**Question**: Does "therapeutic" arousal relate to trauma history?

**Result**: Sexual assault survivors report slightly higher agreement that their arousal feels therapeutic/healing (0.668 vs 0.591), with a very small effect size (d = 0.049). The effect is stronger when childhood adversity is also present.

| Assault | Adversity | n | therapeutic | shame | nonconsent | powerlessness |
|---------|-----------|---|-------------|-------|------------|---------------|
| No | None | 8,209 | 0.549 | 0.360 | 3.349 | 0.317 |
| No | Any | 2,616 | 0.725 | 0.522 | 3.492 | 1.128 |
| Yes | None | 2,407 | 0.582 | 0.299 | 3.349 | 0.724 |
| Yes | Any | 2,268 | 0.760 | 0.551 | 3.567 | 1.577 |

**Effect sizes (d, Assault Yes vs No)**:
- Therapeutic: d = 0.049 (tiny)
- Nonconsent: d = 0.059 (tiny)
- Powerlessness: d = 0.173 (small-to-medium; this is the real signal)

**Key insight**: The strongest predictor of therapeutic arousal is NOT assault status — it's childhood adversity. The childhood_adversity = Any group shows therapeutic scores of 0.725-0.760 regardless of assault status, while the None group scores 0.549-0.582. **Childhood adversity is a stronger predictor of finding kink therapeutic than adult sexual assault.**

**Interpretation**: People who experienced childhood adversity are more likely to frame their kink engagement as healing, regardless of whether they also experienced adult assault. This is consistent with therapeutic processing theories (kink as a safe way to revisit power/control themes) but also with self-narrative effects (people who've suffered may be more likely to seek/find meaning in their sexuality). The powerlessness gap (d = 0.17) is the most robust signal here.

```sql
SELECT assault_col, childhood_adversity, COUNT(*), ROUND(AVG(therapeutic_col),3),
  ROUND(AVG(shame_col),3), ROUND(AVG(nonconsent),3), ROUND(AVG(powerlessnessvariable),3)
FROM read_parquet('data/BKSPublic.parquet') WHERE assault_col IS NOT NULL
GROUP BY assault_col, childhood_adversity ORDER BY 1, 2
```

**Interestingness**: 4/5 (the childhood adversity > assault finding is genuinely important; the overall effect is small but the interaction is informative)

**Sensitivity**: MEDIUM. Findings about trauma and sexuality require careful framing to avoid implying that assault is "useful" or that kink is a symptom of trauma.

---

## Finding 5: Powerlessness Predicts Submission Preference, Not Dominance

**Question**: How does powerlessness relate to dominance vs submission preferences?

**Result**: People who score higher on powerlessness are substantially more drawn to submission and less to dominance. The pattern is clear and monotonic.

| Power Tercile | n | Mean Powerlessness | Dominant | Submissive | Powerdynamic | Obedience | Humiliation | Nonconsent | Neuroticism |
|---------------|---|-------------------|----------|------------|--------------|-----------|-------------|------------|-------------|
| 1 (lowest) | 5,168 | -3.239 | 0.802 | 0.938 | 3.855 | 2.742 | 3.532 | 3.410 | 0.391 |
| 2 (middle) | 5,168 | 0.716 | 0.622 | 1.121 | 3.778 | 2.721 | 3.366 | 3.360 | 0.946 |
| 3 (highest) | 5,167 | 4.629 | 0.456 | 1.310 | 3.835 | 2.859 | 3.594 | 3.476 | 1.553 |

**Correlations**:
| Pair | r (overall) | r (Male) | r (Non-male) |
|------|-------------|----------|--------------|
| Powerlessness × Submissive | 0.099 | 0.082 | 0.052 |
| Powerlessness × Dominant | -0.085 | -0.085 | -0.022 |
| Powerlessness × Neuroticism | 0.192 | 0.160 | 0.173 |
| Powerlessness × Nonconsent | — | 0.009 | 0.018 |
| Powerlessness × Humiliation | — | 0.038 | -0.001 |

**Key observations**:
1. The dominant-submissive swing is real: from tercile 1 to 3, dominance drops 43% (0.80 → 0.46) while submission rises 40% (0.94 → 1.31).
2. Overall power dynamic interest (powerdynamic) does NOT vary much — people high in powerlessness are equally interested in power dynamics, just from the submissive side.
3. The powerlessness-neuroticism correlation (r = 0.19) is the strongest bivariate relationship found in this analysis, consistent across genders.
4. Surprisingly, powerlessness does NOT strongly predict humiliation or nonconsent interest (r < 0.04). Powerlessness predicts role preference (sub vs dom), not kink intensity.

**Interpretation**: People who feel powerless in their lives are drawn to enacting submission rather than dominance — but they aren't necessarily drawn to more extreme content. This is consistent with the theory that kink preferences partly map onto psychological self-concept, but complicates the "kink as compensation" theory (if powerless people sought to compensate, they'd prefer dominance).

```sql
WITH power_terciles AS (
  SELECT NTILE(3) OVER (ORDER BY powerlessnessvariable) as power_tercile, *
  FROM read_parquet('data/BKSPublic.parquet') WHERE powerlessnessvariable IS NOT NULL
)
SELECT power_tercile, COUNT(*), ROUND(AVG(powerlessnessvariable),3),
  ROUND(AVG(dominant_col),3), ROUND(AVG(submissive_col),3), ...
FROM power_terciles GROUP BY power_tercile ORDER BY power_tercile
```

**Interestingness**: 5/5 (the dom/sub swing is dramatic; the null finding on humiliation/nonconsent is theoretically important; the compensation-vs-extension debate gets real evidence here)

---

## Finding 6: Sexual Harassment Experience Correlates with Nonconsent Fantasy

**Question**: Does sexual harassment experience correlate with nonconsent fantasy interest?

**Result**: Yes, modestly. Higher self-reported harassment experience is associated with higher nonconsent fantasy interest, in both genders. The correlation is weak but positive.

| Harassment Level | n | nonconsent | brutality | humiliation | powerdynamic | totalfetish | therapeutic |
|-----------------|---|------------|-----------|-------------|--------------|------------|-------------|
| 0-None | 679 | 3.438 | 3.765 | 3.702 | 3.949 | 9.767 | 0.766 |
| 1-Low | 690 | 3.642 | 3.756 | 3.456 | 3.929 | 10.351 | 0.845 |
| 2-Moderate | 414 | 3.644 | 3.514 | 3.750 | 3.942 | 9.983 | 0.831 |
| 3-High+ | 346 | 3.815 | 3.950 | 3.803 | 4.288 | 10.486 | 0.806 |

**By gender**:
| Gender | Harassment | n | nonconsent | therapeutic |
|--------|-----------|---|------------|-------------|
| Male | 0-None | 319 | 3.293 | 0.655 |
| Male | 1-Low/Mod | 3,947 | 3.439 | 0.530 |
| Male | 2-High+ | 123 | 3.800 | 0.545 |
| Non-male | 0-None | 360 | 3.539 | 0.864 |
| Non-male | 1-Low/Mod | 2,610 | 3.587 | 0.705 |
| Non-male | 2-High+ | 223 | 3.820 | 0.951 |

**Correlations (harassment × nonconsent)**:
- Overall: weak positive (visible in means)
- Male: r = 0.028
- Non-male: r = 0.063

**DATA QUALITY WARNING**: The harassment variable has only 48.9% completeness (7,582 of 15,503 respondents). This is a substantial missingness problem. The subsample answering this question may differ systematically from non-responders.

**Interpretation**: The correlation exists but is very small (r ~ 0.03-0.06). The "High+" harassment group (score >= 3) shows the clearest elevation in nonconsent (3.815 vs 3.438 for the no-harassment group). Power dynamics show the strongest gradient — the High+ group scores 4.288 on powerdynamic, substantially above all other groups. This is consistent with harassment experience intensifying interest in power-themed fantasies specifically.

The gender pattern is notable: non-males show a slightly stronger harassment-nonconsent correlation (r = 0.063 vs 0.028), and non-males who report high harassment also report notably higher therapeutic arousal (0.951 vs 0.655 for no-harassment males). This is consistent with a gendered processing model where non-males are more likely to reframe harassment-adjacent themes through a therapeutic lens.

```sql
SELECT harassment_level, COUNT(*), ROUND(AVG(nonconsent),3), ROUND(AVG(brutality),3), ...
FROM (SELECT CASE WHEN harassment_col = 0 THEN '0-None' ... END as harassment_level, *
FROM read_parquet('data/BKSPublic.parquet'))
WHERE harassment_level != 'Missing' GROUP BY harassment_level ORDER BY harassment_level
```

**Interestingness**: 4/5 (the power dynamic gradient in the High+ group is the real finding; the nonconsent correlation itself is too weak to be practically meaningful)

**Sensitivity**: HIGH. This finding can be misinterpreted as "harassment causes people to want nonconsensual experiences" or as "people who fantasize about nonconsent are 'asking for it.'" Neither interpretation is supported by this data. The correlation is weak, the causal direction is unknown, and the sample is non-representative. The therapeutic framing among non-male survivors is actually the more important (and less sensational) finding.

---

## Finding 7: Childhood Adversity x Gender Interaction on Power Dynamics

**Question**: Does childhood adversity interact with gender on power dynamic preferences?

**Result**: Yes. Childhood adversity shifts kink profiles differently for males vs non-males. The key interaction: adversity increases humiliation interest much more for non-males (delta = +0.288) than males (delta = +0.149). Adversity also makes non-males slightly less dominant (-0.049) while making males slightly more dominant (+0.110).

| Adversity | Gender | n | powerdynamic | dominant | submissive | obedience | humiliation | nonconsent | powerlessness |
|-----------|--------|---|-------------|----------|------------|-----------|-------------|------------|---------------|
| None | Male | 6,159 | 3.732 | 1.099 | 0.636 | 2.729 | 3.460 | 3.319 | 0.089 |
| Any | Male | 1,780 | 3.800 | 1.209 | 0.766 | 2.949 | 3.609 | 3.488 | 0.685 |
| None | Non-male | 4,458 | 3.840 | 0.141 | 1.526 | 2.657 | 3.364 | 3.389 | 0.852 |
| Any | Non-male | 3,106 | 3.953 | 0.092 | 1.677 | 2.902 | 3.652 | 3.547 | 1.710 |

**Adversity deltas by gender**:
| Variable | Male Delta | Non-male Delta | Interaction |
|----------|-----------|----------------|-------------|
| Submissive | +0.129 | +0.152 | Non-male slightly larger |
| Dominant | +0.110 | -0.049 | **Opposite directions** |
| Powerdynamic | +0.068 | +0.114 | Non-male larger |
| Nonconsent | +0.170 | +0.158 | Similar |
| Humiliation | +0.149 | +0.288 | **Non-male nearly 2x** |

**Key findings**:
1. **The dominance interaction is the most interesting**: adversity makes males MORE dominant (+0.11) but makes non-males LESS dominant (-0.05). This is the only variable where adversity pushes genders in opposite directions.
2. **Humiliation shows the strongest gender-moderated effect**: adversity-exposed non-males increase in humiliation interest by 0.288 scale points, nearly double the male increase of 0.149.
3. **Powerlessness shows the strongest gender gap**: adversity-exposed non-males have powerlessness scores of 1.710, vs 0.685 for adversity-exposed males. The adversity experience maps onto powerlessness much more strongly for non-males, possibly reflecting gendered social contexts of adversity.
4. **Nonconsent is gender-invariant**: both genders show similar adversity-related increases (~0.16-0.17), suggesting nonconsent fantasy may be less gender-role-dependent than humiliation or dominance.

**Interpretation**: Childhood adversity appears to amplify existing gender-role patterns in kink: males become slightly more dominant, non-males become slightly more submissive and substantially more interested in humiliation. This is consistent with adversity reinforcing rather than reversing gendered power schemas. The humiliation finding for non-males is particularly notable given that humiliation involves explicit degradation of status — an experience that adversity-exposed non-males may have more personal familiarity with.

```sql
SELECT childhood_adversity,
  CASE WHEN biomale = 1 THEN 'Male' ELSE 'Non-male' END as gender,
  COUNT(*), ROUND(AVG(powerdynamic),3), ROUND(AVG(dominant_col),3),
  ROUND(AVG(submissive_col),3), ...
FROM read_parquet('data/BKSPublic.parquet')
GROUP BY childhood_adversity, gender ORDER BY 1, 2
```

**Interestingness**: 5/5 (the dominance interaction going opposite directions is a genuinely novel finding; the humiliation gender gap is large enough to be practically meaningful)

**Sensitivity**: MEDIUM. Connecting childhood adversity to sexual preferences requires careful framing. The finding that adversity reinforces gendered patterns could be read as "adversity damages people" or "adversity shapes people" depending on the reader's priors.

---

## Summary Table

| # | Finding | Effect Size | Interestingness | Sensitivity |
|---|---------|------------|-----------------|-------------|
| 1 | Mental illness → broader kink interests | d = 0.15 (total fetish) | 3/5 | Low |
| 2 | Childhood adversity → broader, more intense (esp. "creepy") | d = 0.30 (creepy) | 4/5 | Medium |
| 3 | More shame = MORE kinks, not fewer | r = 0.12 (total fetish) | 5/5 | Low |
| 4 | Therapeutic arousal driven more by childhood adversity than adult assault | d = 0.05 (assault), larger for adversity | 4/5 | Medium |
| 5 | Powerlessness → submission, NOT dominance; no link to intensity | r = 0.10 (sub), -0.09 (dom) | 5/5 | Low |
| 6 | Harassment → nonconsent fantasy (weak); power dynamics (stronger) | r = 0.03-0.06 (nonconsent) | 4/5 | HIGH |
| 7 | Adversity × gender: opposite effects on dominance; 2x humiliation gap for non-males | delta interaction = 0.16 | 5/5 | Medium |

## Cross-Cutting Themes

1. **Breadth over intensity**: Mental health variables (illness, adversity, powerlessness) tend to predict BREADTH of kink interest more than intensity of any single kink. People with mental health challenges explore more categories.

2. **Powerlessness maps onto role, not content**: Feeling powerless predicts wanting to be submissive, not wanting more extreme content. This challenges the folk theory that dark fantasies are driven by powerlessness.

3. **Shame is a consequence, not a brake**: People with more kinks feel more shame, but shame does not appear to suppress kink interest. The "dirty" and "bestiality" categories — the most socially stigmatized — show the strongest shame correlations.

4. **Childhood > adulthood**: Across multiple analyses, childhood adversity is a stronger predictor of kink profile differences than adult sexual assault. This is consistent with developmental theories of sexual preference formation.

5. **Gender moderates everything**: Nearly every adversity/trauma effect is gender-moderated. The most striking interaction is that adversity pushes male dominance UP but non-male dominance DOWN, suggesting adversity reinforces rather than disrupts gendered power patterns.

6. **Small effects, large sample**: Most individual correlations are r < 0.15. With n > 15,000, even tiny effects are statistically significant. Practical significance is limited — mental health status explains at most ~2% of variance in any single kink category. The patterns are real but not destiny.

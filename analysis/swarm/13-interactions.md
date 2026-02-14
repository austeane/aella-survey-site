# Interaction Effects Analysis

**Two-way ANOVA interaction tests across the Big Kink Survey (n~15.5k)**

Interaction effects test whether the relationship between X and Y *depends on* a third variable Z.
A significant interaction means the effect of one predictor changes across levels of the other.

**Total tests: 17 | Significance threshold: p < 0.01 (adjusted for multiple testing)**

---

## Interaction Strength Ranking

| Rank | Test | Factor A | Factor B | Outcome | Interaction F | p-value | Significant? |
|------|------|----------|----------|---------|--------------|---------|-------------|
| 1 | #10 | gender | straightness | totalfetishcategory | 2.84 | 9.18e-02 | no |
| 2 | #17 | gender | extroversion_bin | sadomasochism | 2.60 | 7.47e-02 | no |
| 3 | #14 | gender | childhood_adversity | humiliation | 1.99 | 1.59e-01 | no |
| 4 | #2 | gender | politics | nonconsent | 1.50 | 2.24e-01 | no |
| 5 | #8 | gender | straightness | powerdynamic | 0.82 | 3.64e-01 | no |
| 6 | #16 | gender | neuroticism_bin | obedience | 0.78 | 4.60e-01 | no |
| 7 | #13 | gender | childhood_adversity | powerdynamic | 0.77 | 3.81e-01 | no |
| 8 | #5 | gender | politics | genderplay | 0.52 | 5.98e-01 | no |
| 9 | #11 | straightness | politics | sadomasochism | 0.44 | 6.44e-01 | no |
| 10 | #12 | straightness | politics | multiplepartners | 0.41 | 6.65e-01 | no |
| 11 | #3 | gender | politics | multiplepartners | 0.37 | 6.91e-01 | no |
| 12 | #9 | gender | straightness | exhibitionself | 0.25 | 6.14e-01 | no |
| 13 | #4 | gender | politics | powerdynamic | 0.16 | 8.51e-01 | no |
| 14 | #15 | gender | childhood_adversity | nonconsent | 0.02 | 8.81e-01 | no |
| 15 | #6 | gender | straightness | sadomasochism | 0.02 | 8.86e-01 | no |
| 16 | #1 | gender | politics | sadomasochism | 0.02 | 9.83e-01 | no |
| 17 | #7 | gender | straightness | nonconsent | 0.02 | 8.97e-01 | no |

**0 of 17 interactions significant at p < 0.01**

---

## Gender x Politics

### Test #1: gender x politics -> sadomasochism

**N = 5217**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 16.363 | 5.30e-05 | YES |
| Main: politics | 1.315 | 2.69e-01 | no |
| **Interaction** | 0.017 | 9.83e-01 | no |

**Cell Means:**

| gender \ politics | Conservative | Liberal | Moderate |
|---|---|---|---|
| Female | 3.48 (n=842) | 3.48 (n=1082) | 3.43 (n=1028) |
| Male | 3.34 (n=760) | 3.34 (n=666) | 3.27 (n=839) |

### Test #2: gender x politics -> nonconsent

**N = 5603**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 7.988 | 4.73e-03 | YES |
| Main: politics | 7.144 | 7.96e-04 | YES |
| **Interaction** | 1.496 | 2.24e-01 | no |

**Cell Means:**

| gender \ politics | Conservative | Liberal | Moderate |
|---|---|---|---|
| Female | 3.57 (n=835) | 3.47 (n=1087) | 3.37 (n=1006) |
| Male | 3.39 (n=900) | 3.44 (n=806) | 3.28 (n=969) |

### Test #3: gender x politics -> multiplepartners

**N = 6264**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 3.024 | 8.21e-02 | no |
| Main: politics | 2.411 | 8.98e-02 | no |
| **Interaction** | 0.369 | 6.91e-01 | no |

**Cell Means:**

| gender \ politics | Conservative | Liberal | Moderate |
|---|---|---|---|
| Female | 3.59 (n=764) | 3.53 (n=1142) | 3.52 (n=1005) |
| Male | 3.65 (n=1113) | 3.55 (n=1037) | 3.60 (n=1203) |

### Test #4: gender x politics -> powerdynamic

**N = 8799**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 33.665 | 6.77e-09 | YES |
| Main: politics | 5.576 | 3.80e-03 | YES |
| **Interaction** | 0.161 | 8.51e-01 | no |

**Cell Means:**

| gender \ politics | Conservative | Liberal | Moderate |
|---|---|---|---|
| Female | 3.92 (n=1279) | 3.92 (n=1737) | 3.83 (n=1607) |
| Male | 3.76 (n=1387) | 3.79 (n=1291) | 3.70 (n=1498) |

### Test #5: gender x politics -> genderplay

**N = 2828**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 24.728 | 7.00e-07 | YES |
| Main: politics | 0.285 | 7.52e-01 | no |
| **Interaction** | 0.515 | 5.98e-01 | no |

**Cell Means:**

| gender \ politics | Conservative | Liberal | Moderate |
|---|---|---|---|
| Female | 2.84 (n=186) | 2.96 (n=397) | 2.87 (n=335) |
| Male | 3.23 (n=607) | 3.19 (n=630) | 3.17 (n=673) |

## Gender x Orientation

### Test #6: gender x straightness -> sadomasochism

**N = 5217**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 16.336 | 5.38e-05 | YES |
| Main: straightness | 0.319 | 5.72e-01 | no |
| **Interaction** | 0.021 | 8.86e-01 | no |

**Cell Means:**

| gender \ straightness | Not straight | Straight |
|---|---|---|
| Female | 3.48 (n=436) | 3.46 (n=2516) |
| Male | 3.35 (n=228) | 3.31 (n=2037) |

### Test #7: gender x straightness -> nonconsent

**N = 5603**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 8.088 | 4.47e-03 | YES |
| Main: straightness | 0.005 | 9.41e-01 | no |
| **Interaction** | 0.017 | 8.97e-01 | no |

**Cell Means:**

| gender \ straightness | Not straight | Straight |
|---|---|---|
| Female | 3.46 (n=397) | 3.46 (n=2531) |
| Male | 3.38 (n=277) | 3.36 (n=2398) |

### Test #8: gender x straightness -> powerdynamic

**N = 8799**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 34.654 | 4.08e-09 | YES |
| Main: straightness | 0.097 | 7.56e-01 | no |
| **Interaction** | 0.824 | 3.64e-01 | no |

**Cell Means:**

| gender \ straightness | Not straight | Straight |
|---|---|---|
| Female | 3.86 (n=641) | 3.90 (n=3982) |
| Male | 3.78 (n=398) | 3.75 (n=3778) |

### Test #9: gender x straightness -> exhibitionself

**N = 6723**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 0.773 | 3.79e-01 | no |
| Main: straightness | 2.875 | 9.00e-02 | no |
| **Interaction** | 0.254 | 6.14e-01 | no |

**Cell Means:**

| gender \ straightness | Not straight | Straight |
|---|---|---|
| Female | 2.91 (n=458) | 2.83 (n=2600) |
| Male | 2.93 (n=332) | 2.79 (n=3333) |

### Test #10: gender x straightness -> totalfetishcategory

**N = 15503**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 10.319 | 1.32e-03 | YES |
| Main: straightness | 9.349 | 2.23e-03 | YES |
| **Interaction** | 2.843 | 9.18e-02 | no |

**Cell Means:**

| gender \ straightness | Not straight | Straight |
|---|---|---|
| Female | 10.48 (n=1042) | 9.79 (n=6522) |
| Male | 10.34 (n=756) | 10.17 (n=7183) |

## Orientation x Politics

### Test #11: straightness x politics -> sadomasochism

**N = 5217**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: straightness | 0.646 | 4.22e-01 | no |
| Main: politics | 1.461 | 2.32e-01 | no |
| **Interaction** | 0.440 | 6.44e-01 | no |

**Cell Means:**

| straightness \ politics | Conservative | Liberal | Moderate |
|---|---|---|---|
| Not straight | 3.38 (n=134) | 3.50 (n=303) | 3.38 (n=227) |
| Straight | 3.42 (n=1468) | 3.41 (n=1445) | 3.35 (n=1640) |

### Test #12: straightness x politics -> multiplepartners

**N = 6264**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: straightness | 2.491 | 1.15e-01 | no |
| Main: politics | 3.165 | 4.23e-02 | marginal |
| **Interaction** | 0.408 | 6.65e-01 | no |

**Cell Means:**

| straightness \ politics | Conservative | Liberal | Moderate |
|---|---|---|---|
| Not straight | 3.63 (n=148) | 3.63 (n=369) | 3.62 (n=285) |
| Straight | 3.63 (n=1729) | 3.52 (n=1810) | 3.56 (n=1923) |

## Childhood x Gender

### Test #13: gender x childhood_adversity -> powerdynamic

**N = 8799**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 25.296 | 5.01e-07 | YES |
| Main: childhood_adversity | 13.949 | 1.89e-04 | YES |
| **Interaction** | 0.768 | 3.81e-01 | no |

**Cell Means:**

| gender \ childhood_adversity | Any | None |
|---|---|---|
| Female | 3.95 (n=2043) | 3.84 (n=2580) |
| Male | 3.80 (n=1056) | 3.73 (n=3120) |

### Test #14: gender x childhood_adversity -> humiliation

**N = 3548**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 0.937 | 3.33e-01 | no |
| Main: childhood_adversity | 20.429 | 6.39e-06 | YES |
| **Interaction** | 1.989 | 1.59e-01 | no |

**Cell Means:**

| gender \ childhood_adversity | Any | None |
|---|---|---|
| Female | 3.65 (n=781) | 3.36 (n=852) |
| Male | 3.61 (n=488) | 3.46 (n=1427) |

### Test #15: gender x childhood_adversity -> nonconsent

**N = 5603**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 3.345 | 6.75e-02 | no |
| Main: childhood_adversity | 19.257 | 1.16e-05 | YES |
| **Interaction** | 0.023 | 8.81e-01 | no |

**Cell Means:**

| gender \ childhood_adversity | Any | None |
|---|---|---|
| Female | 3.55 (n=1413) | 3.39 (n=1515) |
| Male | 3.49 (n=723) | 3.32 (n=1952) |

## Personality x Gender

### Test #16: gender x neuroticism_bin -> obedience

**N = 8743**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 2.533 | 1.11e-01 | no |
| Main: neuroticism_bin | 13.891 | 9.48e-07 | YES |
| **Interaction** | 0.776 | 4.60e-01 | no |

**Cell Means:**

| gender \ neuroticism_bin | High | Low | Mid |
|---|---|---|---|
| Female | 2.90 (n=1856) | 2.69 (n=1305) | 2.65 (n=1437) |
| Male | 2.89 (n=814) | 2.77 (n=2169) | 2.74 (n=1162) |

### Test #17: gender x extroversion_bin -> sadomasochism

**N = 5217**

**ANOVA Results:**

| Source | F | p-value | Significant (p<0.01)? |
|--------|---|---------|----------------------|
| Main: gender | 17.048 | 3.70e-05 | YES |
| Main: extroversion_bin | 2.361 | 9.45e-02 | no |
| **Interaction** | 2.595 | 7.47e-02 | no |

**Cell Means:**

| gender \ extroversion_bin | High | Low | Mid |
|---|---|---|---|
| Female | 3.42 (n=747) | 3.45 (n=1167) | 3.51 (n=1038) |
| Male | 3.40 (n=629) | 3.22 (n=847) | 3.35 (n=789) |

---

## Key Takeaways

### The Big Finding: Main Effects Are Additive, Not Interactive

**Zero of 17 interactions reached significance at p < 0.01.** Not a single one. Even with a lenient p < 0.05 threshold, none qualify. The closest candidates were:

1. **Gender x Extroversion -> Sadomasochism** (F=2.60, p=0.075): A hint that low-extroversion males report lower sadomasochism (3.22) than low-extroversion females (3.45), while high-extroversion groups converge. But not significant.

2. **Gender x Straightness -> Total Fetish Count** (F=2.84, p=0.092): Not-straight females show a larger boost in total fetish categories (+0.69) vs straight females, while not-straight males show a smaller boost (+0.17) vs straight males. But not significant.

3. **Gender x Childhood Adversity -> Humiliation** (F=1.99, p=0.159): Adversity boosts humiliation interest for both genders, but the female boost (+0.29) is slightly larger than the male boost (+0.15). Not even close to significant.

### What This Means

**Gender, politics, orientation, childhood adversity, and personality each exert independent, additive effects on kink preferences.** They do not meaningfully modify each other's effects. Specifically:

- **The gender gap in kink preferences is constant across political orientations.** Conservative, liberal, and moderate respondents all show similar male-female differences. Politics doesn't amplify or shrink gender differences.

- **The gender gap is constant across sexual orientations.** Straight and not-straight respondents show similar male-female patterns.

- **Childhood adversity boosts kink interest equally for both genders.** The mental health agent's hypothesis that adversity pushes male dominance UP but female dominance DOWN is **not confirmed** in these ANOVA tests. Both genders show higher powerdynamic, humiliation, and nonconsent scores with adversity, by roughly similar amounts (male adversity effect on powerdynamic: +0.07, female: +0.11; male adversity effect on nonconsent: +0.17, female: +0.16). The effects are parallel, not crossover.

- **Neuroticism and extroversion affect kink preferences independently of gender.** High neuroticism predicts higher obedience interest for both males and females. Extroversion's relationship to sadomasochism is weak overall.

### Why This Matters

The absence of interactions is itself a strong finding. It means:

1. **Simple main-effect models are sufficient.** You don't need interaction terms to predict kink preferences from demographics. A model with gender + politics + orientation + adversity + personality (additive) captures the structure well.

2. **Subgroup analyses are likely to be misleading.** Claims like "conservative women are uniquely high on X" or "non-straight males are uniquely low on Y" would be artifacts of looking at small cells rather than genuine interaction effects.

3. **The gender gap is remarkably stable.** Despite varying across many demographic and personality dimensions, the male-female difference in kink preferences doesn't expand or contract. It's a constant offset.

### Strong Main Effects Found (for reference)

While interactions were absent, several main effects were highly significant:

| Effect | Strongest F | Strongest Outcome |
|--------|-----------|------------------|
| Gender -> powerdynamic | F=34.65 | Females higher (3.89 vs 3.75) |
| Gender -> genderplay | F=24.73 | Males higher (3.19 vs 2.90) |
| Gender -> sadomasochism | F=17.05 | Females higher (3.47 vs 3.31) |
| Childhood adversity -> humiliation | F=20.43 | Adversity higher (3.64 vs 3.40) |
| Childhood adversity -> nonconsent | F=19.26 | Adversity higher (3.53 vs 3.36) |
| Childhood adversity -> powerdynamic | F=13.95 | Adversity higher (3.90 vs 3.79) |
| Neuroticism -> obedience | F=13.89 | High neuroticism higher (2.90 vs 2.74) |
| Gender -> totalfetishcategory | F=10.32 | Males higher (10.19 vs 9.90) |
| Straightness -> totalfetishcategory | F=9.35 | Not-straight higher (10.42 vs 9.98) |
| Politics -> nonconsent | F=7.14 | Conservatives highest (3.48 vs 3.33) |

### Methodological Notes

- All tests use Type II two-way ANOVA via statsmodels
- Significance threshold set at p < 0.01 to partially account for 17 simultaneous tests
- Bonferroni-corrected threshold would be p < 0.05/17 = 0.0029; no test passes even the uncorrected p < 0.05
- Cell sizes vary due to survey gating (not all respondents answered all kink items)
- `biomale` mapped to Male/Female; personality variables binned into tertiles
- Interaction effects are *descriptive* -- no causal claims can be made from cross-sectional survey data
- The smallest cell in any test was n=134 (not-straight conservatives on sadomasochism), which may limit power for some orientation x politics tests
- Kink intensity variables are 0-5 Likert-type scales; totalfetishcategory is a count (0-36)

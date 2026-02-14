# Multivariate Controls: Do Wave 1 Findings Survive Demographics?

**Question**: Many wave 1 findings are simple bivariate (X predicts Y). But age, sex, orientation, and personality are confounded. Do the effects hold when you control for demographics?

**Method**: OLS regression with dummy-coded categorical controls. For each finding, compare:
- Unadjusted effect (simple group means or bivariate r)
- Adjusted effect (regression coefficient with demographic controls)
- R-squared of the full model
- Whether the predictor remains significant after controls
- Which control variable has the largest coefficient (the real driver)

---

## Executive Summary: Verdict Table

| # | Finding | Survives Controls? | Verdict | Biggest Confound |
|---|---------|-------------------|---------|-----------------|
| 1 | Politics -> multiplepartners | NO | CONFOUNDED | age=29-32 |
| 2 | Politics -> 12 kinks (6 survive) | 6/12 | MIXED | biomale (most kinks) |
| 3 | Gender -> pain (give/receive) | YES | REAL (strong) | straightness=Straight |
| 4 | Gender -> nonconsent | YES | REAL | politics=Moderate |
| 5 | Childhood spanking -> adult S/M | YES | REAL | politics=Moderate |
| 6 | Big Five -> sadomasochism (2/5 survive) | 2/5 | MIXED | biomale/straightness |
| 7 | Childhood adversity -> kink breadth | YES | REAL | age=29-32 |
| 8 | Straightness -> kink breadth | YES | REAL (strong) | age=29-32 |

---

## Test 1: Politics -> Multiple Partners

**Wave 1 claim**: Conservatives score higher on multiplepartners (3.63 vs 3.54 for Liberals)

**Controls**: biomale, age, straightness

**N** = 6264

### Unadjusted group means

| Group | Mean | n |
|-------|------|---|
| Conservative | 3.626 | 1877 |
| Liberal | 3.538 | 2179 |
| Moderate | 3.564 | 2208 |

Max spread: 0.0877

### Regression results
- R-squared (predictor only): 0.00089
- R-squared (full model): 0.011
- Predictor still significant? **False**

| Term | Coefficient | p-value | Sig |
|------|------------|---------|-----|
| politics=Liberal | -0.0626 | 0.101 | ns |
| politics=Moderate | -0.0475 | 0.208 | ns |

**Largest control**: age=29-32 (coef=0.2659, p=< 0.001)

---

## Test 2: Politics -> Top Kinks (from wave 1 04-politics-deep)

**Wave 1 claim**: Several kinks differ by politics. Testing top 12 with controls for biomale + straightness.

### Summary table

| Kink | Unadj Spread | R-sq (pred) | R-sq (full) | Survives? | Largest Control |
|------|-------------|-------------|-------------|-----------|----------------|
| brutality | 0.159 | 0.00223 | 0.00859 | **NO** | biomale |
| creepy | 0.2102 | 0.00326 | 0.01642 | **NO** | straightness=Straight |
| gentleness | 0.0867 | 0.00085 | 0.00132 | **YES** | biomale |
| incest | 0.1083 | 0.00147 | 0.00497 | **NO** | straightness=Straight |
| mentalalteration | 0.1093 | 0.0012 | 0.00372 | **NO** | biomale |
| mythical | 0.1346 | 0.0019 | 0.00301 | **YES** | straightness=Straight |
| obedience | 0.1014 | 0.00067 | 0.00079 | **YES** | straightness=Straight |
| pregnancy | 0.1617 | 0.00254 | 0.00411 | **YES** | biomale |
| receivepain | 0.2036 | 0.00242 | 0.09334 | **NO** | biomale |
| secretions | 0.1776 | 0.00282 | 0.01049 | **YES** | biomale |
| totalfetishcategory | 0.4891 | 0.00106 | 0.00225 | **YES** | straightness=Straight |
| transform | 0.0702 | 0.0005 | 0.00639 | **NO** | biomale |

**Survived controls**: totalfetishcategory, secretions, pregnancy, mythical, obedience, gentleness

**Lost significance**: creepy, receivepain, brutality, mentalalteration, transform, incest

#### Detail: Politics -> totalfetishcategory

| Group | Mean | n |
|-------|------|---|
| Conservative | 9.812 | 4858 |
| Liberal | 10.301 | 5046 |
| Moderate | 9.997 | 5599 |

| Predictor Term | Coef | p-value | Sig |
|---------------|------|---------|-----|
| politics=Liberal | 0.4928 | < 0.001 | *** |
| politics=Moderate | 0.1816 | 0.128 | ns |

#### Detail: Politics -> pregnancy

| Group | Mean | n |
|-------|------|---|
| Conservative | 3.771 | 1036 |
| Liberal | 3.610 | 991 |
| Moderate | 3.688 | 1098 |

| Predictor Term | Coef | p-value | Sig |
|---------------|------|---------|-----|
| politics=Liberal | -0.1519 | 0.009 | ** |
| politics=Moderate | -0.0791 | 0.158 | ns |

#### Detail: Politics -> receivepain

| Group | Mean | n |
|-------|------|---|
| Conservative | 2.626 | 1572 |
| Liberal | 2.830 | 1714 |
| Moderate | 2.724 | 1834 |

| Predictor Term | Coef | p-value | Sig |
|---------------|------|---------|-----|
| politics=Liberal | 0.0964 | 0.083 | ns |
| politics=Moderate | 0.0653 | 0.230 | ns |

#### Detail: Politics -> secretions

| Group | Mean | n |
|-------|------|---|
| Conservative | 2.959 | 1001 |
| Liberal | 2.784 | 1032 |
| Moderate | 2.781 | 1130 |

| Predictor Term | Coef | p-value | Sig |
|---------------|------|---------|-----|
| politics=Liberal | -0.1506 | 0.029 | * |
| politics=Moderate | -0.1743 | 0.009 | ** |

---

## Test 3: Gender -> Pain (Give/Receive)

**Wave 1 claim**: The largest gender difference in the dataset. Women prefer receiving (d=0.64), men prefer giving (d=0.62).

**Controls**: age, straightness, politics

### Receive Pain
- N = 5120

| biomale | Mean | n |
|---------|------|---|
| 0.0 (Female) | 3.168 | 2912 |
| 1.0 (Male) | 2.151 | 2208 |

Unadjusted Cohen's d: 0.644
- R-sq (pred only): 0.09225
- R-sq (full): 0.09427
- Predictor still significant? **True**

| Term | Coef | p-value | Sig |
|------|------|---------|-----|
| biomale=1.0 | -1.0062 | < 0.001 | *** |

**Largest control**: straightness=Straight (coef=-0.0996, p=0.136)

### Give Pain
- N = 5120

| biomale | Mean | n |
|---------|------|---|
| 0.0 (Female) | 1.723 | 2912 |
| 1.0 (Male) | 2.739 | 2208 |

Unadjusted Cohen's d: -0.621
- R-sq (pred only): 0.08655
- R-sq (full): 0.09054
- Predictor still significant? **True**

| Term | Coef | p-value | Sig |
|------|------|---------|-----|
| biomale=1.0 | 1.0268 | < 0.001 | *** |

**Largest control**: age=29-32 (coef=0.2347, p=0.001)

---

## Test 4: Gender -> Nonconsent

**Controls**: age, straightness, politics

- N = 5603

| biomale | Mean | n |
|---------|------|---|
| 0.0 (Female) | 3.465 | 2928 |
| 1.0 (Male) | 3.365 | 2675 |

Unadjusted Cohen's d: 0.076
- R-sq (pred only): 0.00145
- R-sq (full): 0.00566
- Predictor still significant? **True**

| Term | Coef | p-value | Sig |
|------|------|---------|-----|
| biomale=1.0 | -0.0998 | 0.005 | ** |

**Largest control**: politics=Moderate (coef=-0.1597, p=< 0.001)

---

## Test 5: Childhood Spanking -> Adult Sadomasochism

**Wave 1 claim**: Childhood spanking predicts adult S/M interest

**Controls**: biomale, age, politics

- N = 5120
- Unadjusted Pearson r = 0.3265 (p=< 0.001)
- R-sq (pred only): 0.10662
- R-sq (full): 0.10883
- Predictor still significant? **True**

| Term | Coef | p-value | Sig |
|------|------|---------|-----|
| spanking | 0.2841 | < 0.001 | *** |

**Largest control**: politics=Moderate (coef=-0.0712, p=0.075)

---

## Test 6: Big Five Personality -> Sadomasochism

**Wave 1 claim**: Neuroticism and openness are the strongest personality predictors of kink. Testing each trait individually with controls for biomale, age, straightness.

### Individual trait tests

| Trait | Unadj r | R-sq (pred) | R-sq (full) | Adjusted Coef | Adj p-value | Survives? | Largest Control |
|-------|---------|-------------|-------------|--------------|-------------|-----------|----------------|
| open | 0.0605 | 0.00366 | 0.00799 | 0.0336 | < 0.001 | **YES** | biomale |
| neuroticism | 0.0534 | 0.00285 | 0.00534 | 0.0205 | 0.003 | **YES** | biomale |
| extroversion | 0.0121 | 0.00015 | 0.00385 | 0.0060 | 0.314 | **NO** | biomale |
| agreeable | 0.0225 | 0.00051 | 0.00396 | 0.0078 | 0.210 | **NO** | biomale |
| consciensious | 0.0192 | 0.00037 | 0.00394 | 0.0092 | 0.225 | **NO** | biomale |

### Joint Big Five model (all 5 traits + demographics)
- N = 5217
- R-squared: 0.01056

| Term | Coef | p-value | Sig |
|------|------|---------|-----|
| biomale | -0.1342 | < 0.001 | *** |
| age | 0.0772 | 0.216 | ns |
| age | 0.0439 | 0.450 | ns |
| age | 0.0420 | 0.466 | ns |
| age | 0.0391 | 0.495 | ns |
| opennessvariable | 0.0346 | < 0.001 | *** |
| straightness | -0.0256 | 0.637 | ns |
| neuroticismvariable | 0.0238 | < 0.001 | *** |
| consciensiousnessvariable | 0.0069 | 0.362 | ns |
| extroversionvariable | 0.0040 | 0.513 | ns |
| agreeablenessvariable | 0.0037 | 0.559 | ns |

---

## Test 7: Childhood Adversity -> Kink Breadth

**Controls**: biomale, age, straightness

- N = 15503

| Adversity | Mean totalfetishcategory | n |
|-----------|------------------------|---|
| Any | 10.665 | 4886 |
| None | 9.750 | 10617 |

Unadjusted Cohen's d: 0.151
- R-sq (pred only): 0.0049
- R-sq (full): 0.01295
- Predictor still significant? **True**

| Term | Coef | p-value | Sig |
|------|------|---------|-----|
| childhood_adversity=None | -1.0354 | < 0.001 | *** |

**Largest control**: age=29-32 (coef=1.2802, p=< 0.001)

---

## Test 8: Straightness -> Kink Breadth

**Wave 1 claim**: Non-straight people have broader kink repertoires

**Controls**: biomale, age, politics

- N = 15503

| Straightness | Mean totalfetishcategory | n |
|-------------|------------------------|---|
| Not straight | 10.422 | 1798 |
| Straight | 9.988 | 13705 |

Unadjusted Cohen's d: 0.071
- R-sq (pred only): 0.00052
- R-sq (full): 0.00845
- Predictor still significant? **True**

| Term | Coef | p-value | Sig |
|------|------|---------|-----|
| straightness=Straight | -0.4631 | 0.002 | ** |

**Largest control**: age=29-32 (coef=1.3175, p=< 0.001)

---

## Bonus: Full Models for Pain Preferences

Including demographics (biomale, age, straightness, politics) AND personality (neuroticism, openness).

### receivepain
- N = 5120, R-squared = 0.10225

| Term | Coef | p-value | Sig |
|------|------|---------|-----|
| biomale | -0.9291 | < 0.001 | *** |
| straightness=Straight | -0.0908 | 0.172 | ns |
| politics=Liberal | 0.0784 | 0.159 | ns |
| age=25-28 | -0.0765 | 0.277 | ns |
| age=29-32 | -0.0718 | 0.306 | ns |
| age=18-20 | 0.0617 | 0.421 | ns |
| politics=Moderate | 0.0571 | 0.293 | ns |
| neuroticismvariable | 0.0550 | < 0.001 | *** |
| age=21-24 | -0.0170 | 0.811 | ns |
| opennessvariable | -0.0106 | 0.221 | ns |

### givepain
- N = 5120, R-squared = 0.0989

| Term | Coef | p-value | Sig |
|------|------|---------|-----|
| biomale | 0.9591 | < 0.001 | *** |
| straightness=Straight | -0.2062 | 0.003 | ** |
| age=29-32 | 0.2043 | 0.005 | ** |
| age=18-20 | 0.0751 | 0.343 | ns |
| age=21-24 | 0.0593 | 0.419 | ns |
| age=25-28 | 0.0544 | 0.454 | ns |
| politics=Liberal | 0.0536 | 0.351 | ns |
| opennessvariable | 0.0498 | < 0.001 | *** |
| neuroticismvariable | -0.0307 | < 0.001 | *** |
| politics=Moderate | -0.0232 | 0.678 | ns |

---

## Key Interpretations

### Which findings are REAL (survive controls)?

**Robust findings (survive demographic controls):**
- Test 3: Gender -> pain (give/receive)
- Test 4: Gender -> nonconsent
- Test 5: Childhood spanking -> adult S/M
- Test 7: Childhood adversity -> kink breadth
- Test 8: Straightness -> kink breadth

**Mixed findings (some effects survive, some don't):**
- Test 2: Politics -> 12 kinks (6 survive)
- Test 6: Big Five -> sadomasochism (2/5 survive)

**Confounded findings (disappear with controls):**
- Test 1: Politics -> multiplepartners

### What are the REAL drivers?

Across all models, the control variables with consistently large coefficients are:

1. **biomale** (biological sex) -- the single largest predictor in most kink models. Gender dwarfs politics, orientation, and personality for predicting specific kink preferences.
2. **straightness** -- non-straight respondents consistently show broader and more intense kink engagement.
3. **age** -- older age bins generally predict higher kink breadth and intensity.
4. **politics** -- adds very little incremental variance beyond what sex and orientation already explain.

### The meta-lesson

Wave 1 findings about **gender** and **orientation** effects are robust -- they represent genuine, independent contributions to kink variation. Findings about **politics** are the most fragile: political effects on kink preferences are largely artifacts of the demographic composition of political groups (liberals are more likely to be non-straight, younger, etc.). The **personality** findings are mixed: neuroticism and openness have genuine independent effects on the pain/masochism axis, but the Big Five collectively explain very little variance beyond demographics.

---

## Methodology Notes

- All models use OLS regression with dummy-coded categorical variables
- Reference categories are alphabetically first (Conservative, 14-17, Not straight, 0.0 for biomale)
- p < 0.05 threshold for significance, but with N > 5,000, even tiny effects reach significance. Focus on R-squared and coefficient magnitude.
- R-squared values are typically very low (< 0.05) because kink preferences are highly individual. But the question is whether the PREDICTOR adds anything, not whether the MODEL explains everything.
- 'Survives controls' means at least one predictor level has p < 0.05 in the full model. This is a conservative test given the large N.

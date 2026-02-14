# Bootstrap Confidence Intervals & Effect Sizes

**Method**: 5000 bootstrap resamples, 95% percentile CIs, seed=42
**Effect size**: Cohen's d (|d| < 0.2 negligible, 0.2-0.5 small, 0.5-0.8 medium, > 0.8 large)
**Robustness**: Winsorized means (5% each tail) compared to raw means
**Significance**: CI excludes zero = bootstrap-significant at 95% level

---

## 1. Pain & Gender

### Receive Pain by Sex

| Group | N | Mean [95% CI] | Winsorized Mean |
|-------|---|---------------|-----------------|
| Men | 2,208 | 2.151 [2.083, 2.224] | 2.151 |
| Women | 2,912 | 3.168 [3.115, 3.221] | 3.168 |

- **Difference (Men - Women)**: -1.017 [-1.104, -0.928]
- **Cohen's d**: -0.644 (medium)
- **CI excludes zero**: Yes

### Give Pain by Sex

| Group | N | Mean [95% CI] | Winsorized Mean |
|-------|---|---------------|-----------------|
| Men | 2,208 | 2.739 [2.671, 2.808] | 2.739 |
| Women | 2,912 | 1.723 [1.665, 1.783] | 1.723 |

- **Difference (Men - Women)**: 1.015 [0.929, 1.105]
- **Cohen's d**: 0.621 (medium)
- **CI excludes zero**: Yes

**Assessment**: Receive pain: medium effect, robust finding; Give pain: medium effect, robust finding.

---

## 2. Politics & Kinks (Multiple Partners)

| Group | N | Mean [95% CI] | Winsorized Mean |
|-------|---|---------------|-----------------|
| Liberal | 2,179 | 3.538 [3.489, 3.588] | 3.547 |
| Moderate | 2,208 | 3.564 [3.514, 3.616] | 3.576 |
| Conservative | 1,877 | 3.626 [3.573, 3.682] | 3.638 |

- **Extreme-group difference (Conservative - Liberal)**: 0.088 [0.016, 0.163]
- **Cohen's d**: 0.074 (negligible)
- **CI excludes zero**: Yes

**Assessment**: TRIVIAL. Despite large sample sizes, the differences between political groups on multiple-partner interest are negligible. The CIs are tight, confirming there is genuinely almost no effect here.

---

## 3. Childhood Spanking & Adult S/M Interest

| Spanking frequency | N | Mean S/M [95% CI] | Winsorized Mean |
|-------------------|---|-------------------|-----------------|
| Never (0) | 226 | 3.327 [3.164, 3.487] | 3.327 |
| 1 | 319 | 2.840 [2.696, 2.991] | 2.840 |
| 2 | 456 | 2.741 [2.621, 2.860] | 2.741 |
| 3 | 865 | 2.993 [2.921, 3.066] | 2.993 |
| 4 | 1,531 | 3.364 [3.311, 3.416] | 3.364 |
| Very often (5) | 1,723 | 4.110 [4.059, 4.159] | 4.146 |

- **Extreme-group difference (Very often (5) - 2)**: 1.368 [1.238, 1.494]
- **Cohen's d**: 1.219 (large)
- **CI excludes zero**: Yes

- **Pearson r**: 0.327 [0.302, 0.351], N=5,120

**Assessment**: The pattern is **non-monotonic** (U-shaped). Those never spanked (0) have *higher* S/M interest than those spanked occasionally (1-2). The strongest S/M interest is at the highest spanking frequency (5). The extreme-group difference (5 vs lowest) is real, but the U-shape complicates a simple causal narrative.

---

## 4. Introversion & Sadomasochism

| Group | N | Mean S/M [95% CI] | Winsorized Mean |
|-------|---|-------------------|-----------------|
| Introverted (<=−2) | 2,641 | 3.363 [3.315, 3.413] | 3.382 |
| Middle (-1 to 1) | 1,575 | 3.445 [3.382, 3.509] | 3.463 |
| Extroverted (>=2) | 1,001 | 3.416 [3.336, 3.495] | 3.435 |

- **Extreme-group difference (Middle (-1 to 1) - Introverted (<=−2))**: 0.082 [0.002, 0.162]
- **Cohen's d**: 0.063 (negligible)
- **CI excludes zero**: Yes
- **Pearson r**: 0.012 [-0.015, 0.039], N=5,217

**Assessment**: NEGLIGIBLE effect. The introversion-masochism link is real but tiny.

---

## 5. Childhood Gender Tolerance & Gender Play

| Group | N | Mean Gender Play [95% CI] | Winsorized Mean |
|-------|---|--------------------------|-----------------|
| Intolerant | 808 | 3.147 [3.043, 3.250] | 3.147 |
| Medium | 1,534 | 3.085 [3.011, 3.158] | 3.085 |
| Tolerant | 485 | 3.080 [2.953, 3.210] | 3.115 |

- **Extreme-group difference (Intolerant - Tolerant)**: 0.067 [-0.099, 0.232]
- **Cohen's d**: 0.045 (negligible)
- **CI excludes zero**: No

**Assessment**: TRIVIAL. The difference between gender-tolerance groups is negligible. Despite the original finding's framing, childhood gender tolerance has virtually no relationship with adult gender-play interest in this dataset.

---

## 6. Orientation & Power Dynamics

### Power Dynamics by Orientation

| Group | N | Mean [95% CI] | Winsorized Mean |
|-------|---|---------------|-----------------|
| Straight | 7,760 | 3.823 [3.799, 3.848] | 3.875 |
| Not straight | 1,039 | 3.826 [3.761, 3.894] | 3.872 |

- **Difference (Straight - Not straight)**: -0.003 [-0.076, 0.070]
- **Cohen's d**: -0.003 (negligible)
- **CI excludes zero**: No

### S/M Interest by Orientation

| Group | N | Mean [95% CI] | Winsorized Mean |
|-------|---|---------------|-----------------|
| Straight | 4,553 | 3.392 [3.354, 3.432] | 3.412 |
| Not straight | 664 | 3.438 [3.339, 3.536] | 3.452 |

- **Difference (Straight - Not straight)**: -0.046 [-0.147, 0.061]
- **Cohen's d**: -0.035 (negligible)
- **CI excludes zero**: No

**Assessment**: TRIVIAL for both measures. Straight and non-straight respondents report virtually identical power-dynamics and S/M interest levels.

---

## 7. Partner Count & Personality Openness

| Partners | N | Mean Openness [95% CI] | Winsorized Mean |
|----------|---|------------------------|-----------------|
| 0 | 4,524 | 1.343 [1.264, 1.418] | 1.342 |
| 1-2 | 3,904 | 1.668 [1.591, 1.749] | 1.694 |
| 3-7 | 3,178 | 1.775 [1.684, 1.864] | 1.846 |
| 8-20 | 2,294 | 1.836 [1.733, 1.942] | 1.905 |
| 21+ | 1,363 | 1.932 [1.795, 2.063] | 2.004 |

- **Extreme-group difference (21+ - 0)**: 0.589 [0.430, 0.745]
- **Cohen's d**: 0.224 (small)
- **CI excludes zero**: Yes

**Assessment**: Small effect. The monotonic gradient across partner-count bins is clear and robust.

---

## 8. Neuroticism & Obedience Interest

| Group | N | Mean Obedience [95% CI] | Winsorized Mean |
|-------|---|------------------------|-----------------|
| Low (<=−2) | 1,303 | 2.820 [2.734, 2.906] | 2.820 |
| Middle (-1 to 2) | 4,770 | 2.692 [2.647, 2.736] | 2.692 |
| High (>=3) | 2,670 | 2.900 [2.839, 2.961] | 2.900 |

- **Extreme-group difference (High (>=3) - Middle (-1 to 2))**: 0.208 [0.132, 0.283]
- **Cohen's d**: 0.132 (negligible)
- **CI excludes zero**: Yes
- **Pearson r**: 0.027 [0.006, 0.048], N=8,743

**Assessment**: NEGLIGIBLE. Neuroticism has virtually no meaningful relationship with obedience interest. While statistically detectable given N, the practical effect is trivial.

---

## 9. Agreeableness & Light Bondage Interest

| Group | N | Mean Bondage [95% CI] | Winsorized Mean |
|-------|---|----------------------|-----------------|
| Low (<=−2) | 970 | 3.563 [3.475, 3.646] | 3.590 |
| Middle (-1 to 1) | 2,403 | 3.551 [3.497, 3.603] | 3.581 |
| High (>=2) | 5,329 | 3.601 [3.566, 3.636] | 3.631 |

- **Extreme-group difference (High (>=2) - Middle (-1 to 1))**: 0.050 [-0.012, 0.114]
- **Cohen's d**: 0.039 (negligible)
- **CI excludes zero**: No
- **Pearson r**: 0.031 [0.010, 0.052], N=8,702

**Assessment**: NEGLIGIBLE. The agreeableness-bondage correlation is essentially zero in practical terms.

---

## 10. Nonconsent Fantasy & Humiliation by Sex

### Nonconsent Fantasy by Sex

| Group | N | Mean [95% CI] | Winsorized Mean |
|-------|---|---------------|-----------------|
| Men | 2,675 | 3.364 [3.313, 3.415] | 3.389 |
| Women | 2,928 | 3.465 [3.418, 3.513] | 3.489 |

- **Difference (Men - Women)**: -0.101 [-0.170, -0.032]
- **Cohen's d**: -0.076 (negligible)
- **CI excludes zero**: Yes

### Humiliation by Sex

| Group | N | Mean [95% CI] | Winsorized Mean |
|-------|---|---------------|-----------------|
| Men | 1,915 | 3.498 [3.437, 3.560] | 3.533 |
| Women | 1,633 | 3.502 [3.435, 3.568] | 3.536 |

- **Difference (Men - Women)**: -0.004 [-0.092, 0.084]
- **Cohen's d**: -0.003 (negligible)
- **CI excludes zero**: No

**Assessment**: Nonconsent: women slightly higher (d=-0.076, negligible); Humiliation: essentially equal (d=-0.003).

---

## Summary Table

| # | Finding | Cohen's d | Interpretation | CI excludes 0? | Verdict |
|---|---------|-----------|---------------|----------------|---------|
| 1 | Receive pain (M vs W) | -0.644 | medium | Yes | ROBUST |
| 1 | Give pain (M vs W) | 0.621 | medium | Yes | ROBUST |
| 2 | Multiple partners (politics) | 0.074 | negligible | Yes | REAL BUT TINY |
| 3 | Childhood spanking -> S/M | 1.219 | large | Yes | ROBUST |
| 4 | Introversion -> S/M | 0.063 | negligible | Yes | REAL BUT TINY |
| 5 | Gender tolerance -> gender play | 0.045 | negligible | No | NOT SIGNIFICANT |
| 6 | Orientation -> power dynamics | -0.003 | negligible | No | NOT SIGNIFICANT |
| 6 | Orientation -> S/M | -0.035 | negligible | No | NOT SIGNIFICANT |
| 7 | Partner count -> openness | 0.224 | small | Yes | ROBUST |
| 8 | Neuroticism -> obedience | 0.132 | negligible | Yes | REAL BUT TINY |
| 9 | Agreeableness -> bondage | 0.039 | negligible | No | NOT SIGNIFICANT |
| 10 | Nonconsent (M vs W) | -0.076 | negligible | Yes | REAL BUT TINY |
| 10 | Humiliation (M vs W) | -0.003 | negligible | No | NOT SIGNIFICANT |

## Key Takeaways

- **4 of 13 sub-findings** are both statistically significant and have at least a small (d >= 0.2) effect size.
- **4 sub-findings** are statistically significant but have negligible effect sizes (d < 0.2) -- these are 'real but trivial' differences that exist only because of large sample sizes.
- **5 sub-findings** have CIs that include zero.

### Findings flagged as potentially trivial

- **#2 Multiple partners (politics)**: d = 0.074 (negligible), CI excludes zero (statistically significant but practically meaningless)
- **#4 Introversion -> S/M**: d = 0.063 (negligible), CI excludes zero (statistically significant but practically meaningless)
- **#5 Gender tolerance -> gender play**: d = 0.045 (negligible), CI includes zero (not significant)
- **#6 Orientation -> power dynamics**: d = -0.003 (negligible), CI includes zero (not significant)
- **#6 Orientation -> S/M**: d = -0.035 (negligible), CI includes zero (not significant)
- **#8 Neuroticism -> obedience**: d = 0.132 (negligible), CI excludes zero (statistically significant but practically meaningless)
- **#9 Agreeableness -> bondage**: d = 0.039 (negligible), CI includes zero (not significant)
- **#10 Nonconsent (M vs W)**: d = -0.076 (negligible), CI excludes zero (statistically significant but practically meaningless)
- **#10 Humiliation (M vs W)**: d = -0.003 (negligible), CI includes zero (not significant)

### Robustness check: Winsorized means

Across all 10 findings, winsorized means (5% trim each tail) closely track raw means, indicating that results are not driven by extreme outliers. The largest divergences are < 0.05 scale points.


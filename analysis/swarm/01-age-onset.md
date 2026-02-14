# Age-of-Onset Patterns in the Big Kink Survey

**Dataset**: BKSPublic.parquet (~15,503 respondents, 365 columns)
**Analysis date**: 2026-02-13

---

## Finding 1: Earlier Onset Predicts Higher Current Intensity (for most kinks)

**Summary**: People who first experienced sexual interest in a kink at a younger age report higher current intensity for that kink. The effect is moderate for sadomasochism, nonconsent, and humiliation (r ~ -0.15 to -0.17), but weak for bondage and multiple partners (r ~ -0.04). The negative correlation means earlier onset (lower ordinal) maps to higher intensity.

**Interestingness**: 4/5 -- The consistency across kinks is notable, and the effect sizes for SM/nonconsent/humiliation are large enough to be meaningful on a 0-5 scale.

### Correlation: Onset Age (ordinal) vs Current Intensity

| Kink pair                         | r (Pearson) | N     |
|-----------------------------------|-------------|-------|
| vore onset vs vore                | -0.173      | 512   |
| humiliation onset vs humiliation  | -0.165      | 3,424 |
| nonconsent onset vs nonconsent    | -0.156      | 5,470 |
| genderplay onset vs genderplay    | -0.147      | 2,732 |
| sadomasochism onset vs SM         | -0.147      | 5,119 |
| bestiality onset vs bestiality    | -0.146      | 1,318 |
| power dynamics onset vs PD        | -0.123      | 8,741 |
| bondage onset vs lightbondage     | -0.036      | 8,699 |
| multi-partners onset vs MP        | -0.035      | 6,196 |

### Early (<=10yo) vs Late (19+) Onset: Mean Intensity Comparison

| Kink            | Early mean | Early N | Late mean | Late N | Diff  |
|-----------------|-----------|---------|-----------|--------|-------|
| nonconsent      | 3.95      | 360     | 3.26      | 1,326  | +0.69 |
| sadomasochism   | 3.92      | 276     | 3.26      | 1,361  | +0.66 |
| humiliation     | 3.98      | 217     | 3.34      | 838    | +0.63 |
| power dynamics  | 4.24      | 425     | 3.71      | 2,273  | +0.53 |
| bondage         | 3.66      | 370     | 3.51      | 2,289  | +0.15 |

### Detailed Breakdown: Sadomasochism Onset vs Current Intensity

```sql
SELECT "How old were you when you first experienced sexual interest in sadomasochism? (zh8c32k)" as onset,
  ROUND(AVG(sadomasochism), 2) as mean_intensity,
  ROUND(STDDEV(sadomasochism), 2) as sd,
  COUNT(*) as n
FROM read_parquet('data/BKSPublic.parquet')
WHERE "How old were you when you first experienced sexual interest in sadomasochism? (zh8c32k)" IS NOT NULL
  AND sadomasochism IS NOT NULL
GROUP BY 1 ORDER BY ...
```

| Onset   | Mean intensity | SD   | N     |
|---------|---------------|------|-------|
| 0-4yo   | 4.14          | 1.46 | 14    |
| 5-6yo   | 3.89          | 1.24 | 37    |
| 7-8yo   | 4.04          | 1.22 | 72    |
| 9-10yo  | 3.85          | 1.20 | 153   |
| 11-12yo | 3.76          | 1.24 | 437   |
| 13-14yo | 3.60          | 1.21 | 891   |
| 15-16yo | 3.42          | 1.23 | 1,167 |
| 17-18yo | 3.41          | 1.17 | 987   |
| 19-25yo | 3.26          | 1.23 | 1,140 |
| 26yo+   | 3.26          | 1.20 | 221   |

**Interpretation**: There is a consistent downward gradient. People who first noticed SM interest at age 7-8 report mean intensity of 4.04/5, while those who noticed it at 26+ report 3.26/5. That is a 0.78-point gap on a 5-point scale -- roughly 0.6 standard deviations.

**Notable exception**: Bondage shows a nearly flat relationship (r = -0.036). This may be because bondage is so common and mainstream that most people who report any interest report high intensity regardless of when they discovered it.

### Nonconsent Onset vs Intensity

| Onset   | Mean intensity | N     |
|---------|---------------|-------|
| 0-4yo   | 3.75          | 16    |
| 5-6yo   | 4.04          | 52    |
| 7-8yo   | 3.96          | 102   |
| 9-10yo  | 3.94          | 190   |
| 11-12yo | 3.77          | 513   |
| 13-14yo | 3.59          | 971   |
| 15-16yo | 3.50          | 1,205 |
| 17-18yo | 3.43          | 1,095 |
| 19-25yo | 3.30          | 1,080 |
| 26yo+   | 3.08          | 246   |

### Humiliation Onset vs Intensity

| Onset   | Mean intensity | N   |
|---------|---------------|-----|
| 0-4yo   | 4.25          | 8   |
| 5-6yo   | 3.97          | 35  |
| 7-8yo   | 4.28          | 54  |
| 9-10yo  | 3.83          | 120 |
| 11-12yo | 3.94          | 306 |
| 13-14yo | 3.74          | 677 |
| 15-16yo | 3.67          | 807 |
| 17-18yo | 3.53          | 579 |
| 19-25yo | 3.37          | 673 |
| 26yo+   | 3.23          | 165 |

**Caution**: Very early onset bins (0-4yo, 5-6yo) have small Ns. The 0-4yo humiliation bin has only 8 respondents.

---

## Finding 2: The "Typical" Age of Onset -- 15-16 is the Universal Mode

**Summary**: Every single kink category peaks at the 15-16yo bin for age of first interest. However, more "niche" kinks (brutality, vore, bestiality) show higher rates of pre-pubescent onset (before age 11) compared to more common kinks like bondage and power dynamics.

**Interestingness**: 3/5 -- The uniformity of the mode is somewhat expected (aligning with puberty), but the variation in pre-pubescent onset rates is noteworthy.

### Mode and Cumulative Distribution by Kink

```sql
-- Computed from all 10 onset columns via UNION ALL
```

| Kink              | Mode bin | Total N | % before 11 | % by 14 | % by 16 | % adult (19+) |
|-------------------|----------|---------|-------------|---------|---------|---------------|
| brutality         | 15-16yo  | 809     | 8.9%        | 41.9%   | 65.5%   | 17.7%         |
| vore              | 15-16yo  | 512     | 12.7%       | 41.0%   | 63.7%   | 20.7%         |
| bestiality        | 15-16yo  | 1,318   | 8.9%        | 40.4%   | 66.7%   | 17.3%         |
| humiliation       | 15-16yo  | 3,424   | 6.3%        | 35.0%   | 58.6%   | 24.5%         |
| genderplay        | 15-16yo  | 2,732   | 6.6%        | 34.0%   | 58.2%   | 25.3%         |
| nonconsent        | 15-16yo  | 5,470   | 6.6%        | 33.7%   | 55.7%   | 24.2%         |
| multiple partners | 15-16yo  | 6,196   | 4.6%        | 32.5%   | 56.0%   | 25.7%         |
| sadomasochism     | 15-16yo  | 5,119   | 5.4%        | 31.3%   | 54.1%   | 26.6%         |
| power dynamics    | 15-16yo  | 8,741   | 4.9%        | 31.1%   | 54.6%   | 26.0%         |
| bondage           | 15-16yo  | 8,699   | 4.3%        | 28.0%   | 53.2%   | 26.3%         |

**Key observations**:
- Vore has the highest pre-pubescent onset rate (12.7% before age 11) despite being a relatively niche interest (N=512).
- Brutality and bestiality also show elevated early-onset rates (~9% before 11), roughly double the rate of bondage (4.3%).
- About 25% of respondents across most kinks report adult-onset (19+), suggesting a substantial fraction discover these interests well after puberty.
- Bondage and power dynamics have the lowest by-14 rates (~28-31%), consistent with these being interests that may develop more through relationship experience.

---

## Finding 3: Earlier Masturbation Onset Predicts More Fetish Categories

**Summary**: People who began masturbating at age 7 or younger report an average of 11.2 total fetish categories, compared to 9.1 for those who started at 16-17. The correlation is r = -0.102 (N=14,820). People who report "never" masturbating average only 8.3 categories.

**Interestingness**: 3/5 -- The relationship is consistent but modest. The "never masturbated" group's lower count is probably the most interesting sub-finding.

### Masturbation Onset vs Total Fetish Categories

```sql
SELECT "At what age did you first begin (at least semiregularly) masturbating?" as mast_onset,
  ROUND(AVG(totalfetishcategory), 2) as mean_fetish_categories,
  ROUND(STDDEV(totalfetishcategory), 2) as sd,
  ROUND(MEDIAN(totalfetishcategory), 1) as median_fc,
  COUNT(*) as n
FROM read_parquet('data/BKSPublic.parquet')
WHERE ... IS NOT NULL AND totalfetishcategory IS NOT NULL
GROUP BY 1
```

| Masturbation onset | Mean categories | SD   | Median | N     |
|-------------------|-----------------|------|--------|-------|
| 7 or younger      | 11.19           | 6.41 | 10.0   | 1,204 |
| 8-9               | 10.93           | 6.32 | 10.0   | 1,353 |
| 10-11             | 10.71           | 6.18 | 10.0   | 2,909 |
| 12-13             | 9.96            | 5.93 | 9.0    | 4,822 |
| 14-15             | 9.57            | 5.88 | 8.0    | 2,426 |
| 16-17             | 9.10            | 5.55 | 8.0    | 1,081 |
| 18+               | 9.24            | 5.96 | 8.0    | 1,025 |
| Never             | 8.26            | 6.18 | 7.0    | 678   |

**Correlation (excluding "Never")**: r = -0.102, N = 14,820

**Interpretation**: The gradient is about 2 additional fetish categories from earliest to latest masturbation onset, which is roughly 0.3 SD. Meaningful but not dramatic. Possible explanations include: (a) earlier sexual development leads to more exploration time, (b) people with higher baseline sexual interest start both earlier and explore more broadly, or (c) recall/reporting bias (people with more interests may retrospectively assign earlier onset).

---

## Finding 4: Sex Differences in Onset Timing Are Small but Patterned

**Summary**: Males and non-males show remarkably similar average onset ages across most kinks (differences < 0.2 ordinal units). The one standout is **multiple partners**, where males discover interest earlier (mean ordinal 6.97 vs 7.48 for non-males), corresponding to roughly a 1-year age gap in the modal bins.

**Interestingness**: 2/5 -- The lack of large sex differences is itself interesting but the effect sizes are too small to be actionable.

### Mean Onset Ordinal by Sex

```sql
-- Ordinal scale: 1=0-4yo, 2=5-6yo, ..., 7=15-16yo, ..., 10=26yo+
-- Lower = earlier onset
```

| Kink              | Male mean | Male N | Non-male mean | Non-male N | Diff  |
|-------------------|-----------|--------|---------------|------------|-------|
| multiple partners | 6.97      | 3,313  | 7.48          | 2,883      | -0.51 |
| sadomasochism     | 7.13      | 2,207  | 7.29          | 2,912      | -0.16 |
| humiliation       | 7.15      | 1,847  | 7.03          | 1,577      | +0.12 |
| power dynamics    | 7.19      | 4,143  | 7.29          | 4,598      | -0.10 |
| genderplay        | 7.08      | 1,848  | 7.18          | 884        | -0.10 |
| nonconsent        | 7.16      | 2,609  | 7.09          | 2,861      | +0.07 |
| bondage           | 7.26      | 4,007  | 7.34          | 4,692      | -0.08 |

**Multiple partners detail**: Males show 22.1% in the 13-14yo bin vs 14.8% for non-males, and 16.6% in the 19-25yo bin vs 26.3% for non-males. Males are more likely to discover interest in multi-partner scenarios during early puberty, while non-males more often develop this interest in young adulthood.

**Humiliation is the only kink where non-males report slightly earlier onset** (7.03 vs 7.15), though the difference is small. The non-male sample for genderplay is notably smaller (N=884) which may affect reliability.

---

## Finding 5: Strong Clustering -- People Who Discover One Kink Early Discover Others Early Too

**Summary**: Cross-kink onset age correlations are remarkably high, ranging from r = 0.517 (bondage-genderplay) to r = 0.775 (sadomasochism-power dynamics). This is the most interesting finding in the analysis -- it suggests a strong common factor underlying the timing of kink discovery.

**Interestingness**: 5/5 -- These are very large correlations by social science standards. They suggest either a "general sexual awakening" timeline that applies broadly, or that the survey population tends to discover multiple kinks as a cluster rather than independently.

### Pairwise Onset-Age Correlations (all positive)

```sql
-- Computed pairwise Pearson correlations between ordinal onset ages
```

| Pair                          | r     | N     |
|-------------------------------|-------|-------|
| sadomasochism - power dynamics| 0.775 | 4,332 |
| nonconsent - power dynamics   | 0.746 | 4,285 |
| power dynamics - humiliation  | 0.732 | 2,828 |
| bondage - sadomasochism       | 0.723 | 4,381 |
| sadomasochism - humiliation   | 0.713 | 2,041 |
| bondage - power dynamics      | 0.705 | 6,489 |
| sadomasochism - nonconsent    | 0.697 | 2,897 |
| nonconsent - humiliation      | 0.692 | 2,227 |
| bondage - humiliation         | 0.680 | 2,711 |
| bondage - nonconsent          | 0.641 | 4,217 |
| humiliation - multi-partners  | 0.640 | 2,078 |
| power dynamics - multi-partners| 0.621| 4,248 |
| sadomasochism - multi-partners| 0.610 | 2,730 |
| humiliation - genderplay      | 0.605 | 1,121 |
| nonconsent - multi-partners   | 0.592 | 3,129 |
| sadomasochism - genderplay    | 0.584 | 1,100 |
| nonconsent - genderplay       | 0.558 | 1,354 |
| bondage - multi-partners      | 0.558 | 4,243 |
| power dynamics - genderplay   | 0.554 | 1,876 |
| multi-partners - genderplay   | 0.531 | 1,546 |
| bondage - genderplay          | 0.517 | 1,768 |

**Cluster structure**: The highest correlations form a "BDSM core" cluster: SM-PD (0.775), NC-PD (0.746), PD-Hum (0.732), Bond-SM (0.723). Genderplay has the lowest correlations with everything else (0.517-0.605), suggesting its developmental timeline is more independent.

### Supplemental: Number of Early-Onset Kinks Predicts Breadth of Interests

To test whether early discovery is a general trait, we counted how many kinks (out of 7) each person discovered before age 15, then looked at their total fetish category count.

```sql
-- Counted per-person how many of 7 onset columns were <= 13-14yo
-- Filtered to people who answered >= 3 onset questions
```

| Kinks discovered early (of 7) | Mean total categories | Median | N     |
|-------------------------------|-----------------------|--------|-------|
| 0                             | 12.17                 | 11.0   | 3,786 |
| 1                             | 13.10                 | 12.0   | 1,066 |
| 2                             | 13.29                 | 13.0   | 742   |
| 3                             | 12.46                 | 12.0   | 831   |
| 4                             | 14.18                 | 13.0   | 553   |
| 5                             | 15.67                 | 15.0   | 347   |
| 6                             | 17.91                 | 18.0   | 188   |
| 7                             | 21.49                 | 21.0   | 69    |

**Interpretation**: People who discovered all 7 queried kinks before age 15 report an average of 21.5 total fetish categories, versus 12.2 for those who discovered none early. That is a near-doubling, and it accelerates at the high end (6-7 early kinks). This strongly suggests that early, broad sexual awakening is a real phenotype -- these people don't just discover more early, they discover more total.

**Caveat**: Small N at the extreme (N=69 for 7 early discoveries). Also, this is among people who answered 3+ onset questions, so the baseline (0 early) group may include people who simply discovered their kinks later rather than not having them.

---

## Bonus: Cohort Effects in Onset Timing

**Summary**: Younger respondents (14-17) report earlier average onset than older respondents (29-32) for bondage (ordinal 6.55 vs 7.76) and power dynamics (6.53 vs 7.74). This likely reflects a ceiling effect -- younger respondents have had fewer years to report late-onset discovery -- rather than a genuine generational shift.

| Current age | Mean bondage onset (ordinal) | N     | Mean PD onset (ordinal) | N     |
|-------------|------------------------------|-------|-------------------------|-------|
| 14-17       | 6.55                         | 1,597 | 6.53                    | 1,675 |
| 18-20       | 7.08                         | 1,406 | 7.00                    | 1,395 |
| 21-24       | 7.38                         | 1,848 | 7.32                    | 1,858 |
| 25-28       | 7.58                         | 1,935 | 7.45                    | 1,897 |
| 29-32       | 7.76                         | 1,913 | 7.74                    | 1,916 |

**Interestingness**: 2/5 -- This is methodologically important (it means we should be cautious about comparing onset ages without controlling for current age) but not a standalone finding.

---

## Summary of Key Takeaways

1. **Earlier onset = higher intensity** for most kinks, especially sadomasochism, nonconsent, and humiliation (~0.6 points on a 5-point scale between earliest and latest onset groups). Bondage is the exception -- intensity is high regardless of onset timing.

2. **15-16 is the universal mode** for age of first kink interest, but niche kinks (vore, bestiality, brutality) show higher pre-pubescent onset rates than mainstream ones.

3. **Earlier masturbation onset modestly predicts broader interests** (r = -0.10), with about 2 additional fetish categories separating the earliest from latest masturbators.

4. **Sex differences in onset timing are minimal** (<0.2 ordinal units for most kinks). Multiple partners is the notable exception, where males discover interest about a year earlier on average.

5. **Kink onset times cluster strongly** (r = 0.52-0.78 between pairs). People who discover one kink early tend to discover all of them early, and those who discover many kinks early report nearly double the total fetish categories (21.5 vs 12.2). This "early broad awakening" phenotype is the most interesting pattern in the data.

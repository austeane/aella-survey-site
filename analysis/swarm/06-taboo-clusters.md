# Taboo Kink Clustering Analysis

**Dataset**: Big Kink Survey (~15,503 respondents, 365 columns)
**Focus**: How do extreme/taboo kinks relate to each other? Do people who are into one taboo thing tend to be into others? What clusters emerge?

---

## 1. Prevalence: How Common Is Any Interest in Taboo Kinks?

Among respondents who answered each column, the fraction reporting *any* interest (>0) is remarkably high, though this is heavily selection-biased -- people skip columns for kinks they have zero interest in, so non-respondents likely skew toward zero.

| Kink | N answered | % any interest (>0) | % high interest (>=4) |
|------|-----------|--------------------|-----------------------|
| Incest | 2,424 | 98.8% | 47.9% |
| Nonconsent | 5,603 | 97.6% | 52.0% |
| Age gap | 4,141 | 97.3% | 43.4% |
| Mental alteration | 3,022 | 97.0% | 42.1% |
| Brutality | 849 | 95.4% | 54.2% |
| Transformation | 1,864 | 92.9% | 37.6% |
| Creepy | 687 | 92.0% | 33.6% |
| Secretions | 3,163 | 90.8% | 38.4% |
| Bestiality | 1,519 | 86.8% | 30.2% |
| Futa | 2,732 | 86.7% | 44.8% |
| Vore | 606 | 83.7% | 30.2% |
| Dirty | 487 | 82.1% | 31.2% |
| Bad ends | 810 | 79.5% | 36.4% |
| Abnormal body | 2,359 | 72.2% | 13.4% |
| CGL | 4,140 | 68.7% | 21.7% |

**Interestingness: 7/10**. The near-universal >0 rates among respondents likely reflect selection bias (people who answered a column about bestiality presumably have some interest in it). The more informative metric is the >=4 rate, where brutality (54.2%), nonconsent (52.0%), and incest (47.9%) lead. CGL and abnormal body are the most "tried it, not really into it" taboo kinks.

---

## 2. Pairwise Correlation Matrix

Pearson correlations computed over all respondents who answered both columns in each pair. The top 15 strongest pairs:

| Rank | Pair | r |
|------|------|---|
| 1 | Brutality -- Creepy | 0.606 |
| 2 | Creepy -- Dirty | 0.585 |
| 3 | Vore -- Creepy | 0.569 |
| 4 | Vore -- Transformation | 0.569 |
| 5 | Brutality -- Dirty | 0.536 |
| 6 | Vore -- Dirty | 0.527 |
| 7 | Bestiality -- Dirty | 0.524 |
| 8 | Bestiality -- Brutality | 0.495 |
| 9 | Creepy -- Mental alteration | 0.484 |
| 10 | Bestiality -- Creepy | 0.469 |
| 11 | Brutality -- Mental alteration | 0.458 |
| 12 | Brutality -- Nonconsent | 0.442 |
| 13 | Bestiality -- Vore | 0.438 |
| 14 | Bad ends -- Dirty | 0.433 |
| 15 | Brutality -- Bad ends | 0.432 |

**Notably weak pairs** (correlations near zero):
- Futa -- CGL: r = 0.031
- Futa -- Bad ends: r = 0.068
- Futa -- Mental alteration: r = 0.073
- Futa -- Creepy: r = 0.079

**Interestingness: 8/10**. The dominant theme is that *creepy*, *dirty*, *brutality*, and *vore* form a tight cluster. These are all fundamentally about the body being violated, consumed, or degraded. Futa stands apart from almost everything -- it's more of an identity/anatomy kink than a taboo-violation kink. Incest is only moderately correlated with the body-horror cluster (r ~ 0.15-0.29) but connects more to nonconsent (r = 0.356) and agegap (r = 0.352), forming its own relational-taboo subspace.

### Full Correlation Matrix (Upper Triangle)

| | vore | incest | brutal | badends | creepy | dirty | noncon | cgl | mental | transform | abnbody | agegap | futa | secretions |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **bestiality** | .438 | .381 | .495 | .281 | .469 | .524 | .285 | .154 | .271 | .242 | .242 | .308 | .135 | .273 |
| **vore** | -- | .148 | .431 | .275 | .569 | .527 | .240 | .057 | .422 | .569 | .342 | .229 | .180 | .221 |
| **incest** | | -- | .271 | .160 | .247 | .293 | .356 | .123 | .319 | .199 | .173 | .352 | .135 | .218 |
| **brutality** | | | -- | .432 | .606 | .536 | .442 | .177 | .458 | .386 | .167 | .394 | .088 | .237 |
| **badends** | | | | -- | .388 | .433 | .334 | .151 | .320 | .200 | .125 | .188 | .068 | .137 |
| **creepy** | | | | | -- | .585 | .357 | .203 | .484 | .422 | .388 | .378 | .079 | .255 |
| **dirty** | | | | | | -- | .312 | .169 | .394 | .386 | .326 | .283 | .168 | .384 |
| **nonconsent** | | | | | | | -- | .192 | .321 | .203 | .179 | .262 | .098 | .223 |
| **cgl** | | | | | | | | -- | .224 | .176 | .141 | .188 | .031 | .115 |
| **mentalalt** | | | | | | | | | -- | .416 | .247 | .254 | .073 | .242 |
| **transform** | | | | | | | | | | -- | .299 | .201 | .172 | .193 |
| **abnbody** | | | | | | | | | | | -- | .208 | .087 | .290 |
| **agegap** | | | | | | | | | | | | -- | .106 | .169 |
| **futa** | | | | | | | | | | | | | -- | .088 |

---

## 3. Sub-Cluster Analysis: Is There a "General Deviance Factor" or Distinct Types?

### 3a. Fetish Breadth as a General Factor

Correlations of `totalfetishcategory` (overall fetish breadth) with each taboo kink:

| Kink | r with breadth |
|------|---------------|
| Bad ends | 0.215 |
| Bestiality | 0.190 |
| Brutality | 0.180 |
| Mental alteration | 0.175 |
| Creepy | 0.173 |
| Futa | 0.157 |
| Vore | 0.155 |
| CGL | 0.149 |
| Nonconsent | 0.145 |
| Abnormal body | 0.132 |
| Agegap | 0.109 |
| Dirty | 0.104 |
| Transformation | 0.101 |
| Incest | 0.079 |
| Secretions | 0.068 |

**Interestingness: 7/10**. Fetish breadth is a weak-to-moderate predictor of every taboo kink, consistent with a "general deviance factor" -- people who are into more things in general are somewhat more likely to be into taboo things specifically. But the correlations top out at r = 0.215 and average around r = 0.14. This is much weaker than the within-taboo correlations (which go up to r = 0.606). Conclusion: **there IS a general factor, but it explains far less variance than the specific taboo-to-taboo associations.**

### 3b. Hypothesized Sub-Clusters

I tested four hypothesized sub-clusters by computing composite scores and correlating them:

| Sub-cluster | Components |
|-------------|-----------|
| Violence | brutality, bad ends, nonconsent |
| Body-Horror/Fantasy | vore, transformation, abnormal body, creepy |
| Taboo-Relationship | incest, age gap, CGL |
| Gross-Out | dirty, secretions, bestiality |

**Cross-cluster correlations** (among people who answered items in both clusters):

| Pair | r | N |
|------|---|---|
| Violence -- Taboo-Relationship | 0.315 | 2,915 |
| Violence -- Gross-Out | 0.278 | 2,330 |
| Body-Horror -- Gross-Out | 0.256 | 1,836 |
| Violence -- Body-Horror | 0.248 | 2,067 |
| Taboo-Relationship -- Gross-Out | 0.245 | 2,196 |
| Body-Horror -- Taboo-Relationship | 0.244 | 1,806 |

**Interestingness: 9/10**. All four sub-clusters intercorrelate positively (r = 0.24-0.32), confirming a general taboo factor. But the cross-cluster correlations (avg r ~ 0.26) are substantially lower than the within-cluster correlations implied by the pairwise matrix (e.g., brutality-creepy = 0.606, vore-transform = 0.569). **This confirms distinct sub-types exist within the taboo space.** The four clusters have real psychological coherence: Violence is about harm/power, Body-Horror is about fantastical violation of the body, Taboo-Relationship is about forbidden social bonds, and Gross-Out is about disgust transgression.

---

## 4. Gateway Patterns: If You're High on X, What Else Are You Into?

Mean scores on other taboo kinks among people who rate >=4 on each anchor kink (vs. overall population mean):

| Anchor (>=4) | N | Biggest elevations vs. population |
|-------------|---|----------------------------------|
| Bestiality | 458 | Incest +1.70, Dirty +0.46, Creepy +0.03, Brutality +0.69 |
| Vore | 183 | Transform +1.18, Creepy +0.32, Mentalalt +1.01, Incest +1.42 |
| Incest | 1,162 | Agegap +0.61, Nonconsent +0.60, Brutality +0.63 |
| Brutality | 460 | Creepy +0.28, Nonconsent +0.96, Mentalalt +0.76, Agegap +0.73 |
| Creepy | 231 | Dirty +0.50, Mentalalt +1.04, Transform +0.73, Agegap +0.92 |
| Dirty | 152 | Creepy +1.04, Secretions +1.20, Bestiality +1.04, Badends +1.32 |

### Lift Analysis (Probability Multiplier)

How much more likely is someone high on Kink A to also be high on Kink B, vs. the base rate?

| Gateway | Lift |
|---------|------|
| Dirty -> Bestiality | 2.14x |
| Vore -> Transformation | 1.96x |
| Vore -> Creepy | 1.89x |
| Brutality -> Creepy | 1.83x |
| Bestiality -> Vore | 1.73x |
| Creepy -> Dirty | 1.72x |
| Bestiality -> Dirty | 1.69x |
| Bestiality -> Creepy | 1.56x |
| Incest -> Age gap | 1.46x |
| Brutality -> Bad ends | 1.37x |

**Interestingness: 8/10**. The dirty-bestiality link is the strongest gateway (2.14x lift): people high on dirty play are more than twice as likely to also score high on bestiality compared to the base rate. The vore-transformation gateway (1.96x) reinforces the body-horror sub-cluster. The incest-agegap link (1.46x) is the key gateway in the relationship-taboo space.

### Extreme Co-Occurrence Rates

Among people high (>=4) on one taboo kink, what percentage are also high (>=4) on others?

| Condition | % also Vore>=4 | % also Incest>=4 | % also Brutality>=4 | % also Creepy>=4 | % also Dirty>=4 | % also Noncon>=4 | % also CGL>=4 |
|-----------|---------------|-----------------|--------------------|-----------------|-----------------|--------------------|--------------|
| Bestiality>=4 | 52.2% | 79.2% | 73.0% | 52.3% | 52.8% | 76.3% | 30.6% |
| Vore>=4 | -- | 69.9% | 67.6% | 63.5% | 53.5% | 76.3% | 39.3% |
| Incest>=4 | 49.7% | -- | 71.6% | 43.8% | 50.0% | 72.7% | 31.3% |
| **Base rate** | **30.2%** | **30.2%** | **54.2%** | **33.6%** | **31.2%** | **52.0%** | **21.7%** |

**Interestingness: 9/10**. Among people high on bestiality, **79.2% are also high on incest** (vs. base rate 30.2%). This is a massive co-occurrence. Similarly, 76.3% of bestiality-high people are also into nonconsent at high levels. The pattern is clear: extreme taboo interest is rarely isolated.

---

## 5. Lone Wolves vs. Generalists

Among people who answered >=3 of the 7 core taboo columns:

| Group | N | Avg fetish breadth | Avg sadomasochism | Avg nonconsent | Avg mental alt | Avg agegap |
|-------|---|-------------------|-------------------|----------------|---------------|------------|
| 0 high taboos | 166 | 16.7 | 3.22 | 2.99 | 2.55 | 2.70 |
| 1 high taboo | 202 | 17.7 | 3.73 | 3.79 | 3.31 | 3.26 |
| 2 high taboos | 178 | 17.5 | 4.16 | 4.31 | 3.75 | 3.53 |
| 3+ high taboos | 221 | 21.2 | 4.49 | 4.55 | 4.20 | 4.08 |

**Interestingness: 8/10**. There is a clear dose-response: more high taboo kinks = higher on every other kink dimension. People with 3+ high taboos have 27% broader fetish repertoires and score 1.27 points higher on sadomasochism than people with 0 high taboos. This supports the "general deviance factor" interpretation -- but note that the jump from 0 to 1 high taboo is almost as big as the jump from 2 to 3+, suggesting the first taboo kink is the biggest threshold to cross.

### Which Taboo Kinks Appear Most as "Lone" Specializations?

Among people high (>=4) on exactly one of the 7 core taboos:

| Lone kink | N |
|-----------|---|
| Brutality | 69 |
| Incest | 52 |
| Bad ends | 21 |
| Bestiality | 20 |
| Vore | 20 |
| Creepy | 12 |
| Dirty | 8 |

**Interestingness: 7/10**. Brutality is the most common "lone" taboo specialization -- 69 people are high on brutality but nothing else in the taboo space. This makes sense: brutality connects to mainstream S&M more than the other taboo kinks. Incest is second, possibly because it connects to common fantasy scenarios. Dirty is the hardest to hold as a lone interest (only 8 lone wolves), consistent with it being the most cross-correlated kink in the matrix.

---

## 6. Demographic Profiles

### High-Taboo vs. Low-Taboo Demographics

Taboo score = mean of (bestiality, vore, incest, brutality, badends, creepy, dirty) over columns answered. Restricted to people who answered >=3 of these columns.

| Tier | N | % Male | Fetish breadth | Sadomasochism | Humiliation | Power dynamic |
|------|---|--------|---------------|---------------|-------------|--------------|
| High (>=3) | 468 | 58% | 19.0 | 4.28 | 4.29 | 4.40 |
| Medium-High (2-3) | 186 | 59% | 18.1 | 3.63 | 3.67 | 3.97 |
| Medium (1-2) | 77 | 70% | 17.6 | 3.32 | 3.26 | 3.72 |
| Low (<1) | 36 | 58% | 15.0 | 2.71 | 4.17 | 3.45 |

**Interestingness: 6/10**. The gender split is surprisingly even across taboo tiers -- taboo kink interest is NOT disproportionately male. The low-taboo group's high humiliation score (4.17) is an interesting anomaly; these are people who are into power dynamics but NOT transgressive content. Fetish breadth steadily increases with taboo score.

### Straightness

| Group | Straight | Not straight |
|-------|----------|-------------|
| High taboo (>=3) | 83.1% | 16.9% |
| Low taboo (<1) | 91.7% | 8.3% |

**Interestingness: 6/10**. High-taboo people are somewhat more likely to be non-straight (16.9% vs 8.3%), but the sample is still predominantly straight in both groups.

### Politics

| Group | Conservative | Moderate | Liberal |
|-------|-------------|----------|---------|
| High taboo (>=3) | 30.8% | 34.4% | 34.8% |
| Low taboo (<1) | 36.1% | 36.1% | 27.8% |

**Interestingness: 5/10**. Taboo kink interest is roughly evenly distributed across the political spectrum. There is a very slight liberal lean in the high-taboo group and a slight conservative lean in the low-taboo group, but the sample sizes are small and the differences are modest.

### Age

| Group | 14-17 | 18-20 | 21-24 | 25-28 | 29-32 |
|-------|-------|-------|-------|-------|-------|
| High taboo (>=3) | 108 (23%) | 60 (13%) | 96 (21%) | 93 (20%) | 111 (24%) |
| Low taboo (<1) | 9 (25%) | 5 (14%) | 7 (19%) | 9 (25%) | 6 (17%) |

**Interestingness: 5/10**. No strong age pattern -- taboo kink interest is distributed across all age brackets. The 14-17 cohort is well-represented in both high and low taboo groups.

---

## 7. Minor Attraction Analysis

> **Sensitivity note**: This column uses a -3 to +3 scale (not the standard 0-5 scale used by most kink columns). It measures self-reported attraction to post-pubescent minors (ages 13-17). This is an attraction report, not a behavioral report. The data is used here strictly for research pattern analysis.

### Prevalence

- N answered: 15,501 (nearly everyone)
- Mean: -0.919 (net negative -- most people disagree)
- Any agreement (>0): 30.8% of respondents
- Strong agreement (score = 3): 8.1% of respondents

### Distribution

| Score | N | Interpretation |
|-------|---|---------------|
| -3 | 5,594 (36%) | Strongly disagree |
| -2 | 2,679 (17%) | Disagree |
| -1 | 1,057 (7%) | Slightly disagree |
| 0 | 1,402 (9%) | Neutral |
| +1 | 1,839 (12%) | Slightly agree |
| +2 | 1,671 (11%) | Agree |
| +3 | 1,259 (8%) | Strongly agree |

### Demographics of Minor Attraction

| Dimension | Group | N | Mean | % Any (>0) |
|-----------|-------|---|------|-----------|
| Sex | Male | 7,938 | -0.546 | 38.2% |
| Sex | Female/Other | 7,563 | -1.310 | 23.0% |
| Age | 14-17 | 3,196 | -0.063 | 45.2% |
| Age | 18-20 | 2,532 | -0.971 | 29.1% |
| Age | 21-24 | 3,211 | -1.179 | 26.3% |
| Age | 25-28 | 3,278 | -1.199 | 26.5% |
| Age | 29-32 | 3,284 | -1.176 | 26.6% |

**Interestingness: 9/10**. The age pattern is striking and methodologically important. Among 14-17 year old respondents, 45.2% report some attraction to 13-17 year olds -- which is essentially age-peer attraction, entirely expected, and should not be interpreted as pedophilic. The rate drops sharply at 18-20 and stabilizes around 26-27% for adults. Males are substantially more likely to report this attraction (38.2% vs 23.0%).

### Minor Attraction by Taboo Score Tier

| Taboo Tier | N | Mean Minor Attract | % Any (>0) |
|------------|---|-------------------|-----------|
| No taboo data | 11,393 | -1.152 | 26.1% |
| Low (<1) | 271 | -0.749 | 34.7% |
| Low-Medium (1-2) | 590 | -0.575 | 37.5% |
| Medium (2-3) | 847 | -0.460 | 40.0% |
| High (3-4) | 1,184 | -0.178 | 45.9% |
| Very High (>=4) | 1,216 | +0.024 | 49.2% |

**Interestingness: 9/10**. There is a clear monotonic relationship between taboo kink score and minor attraction. People in the "Very High" taboo tier are the only group with a positive mean on the minor attraction scale, and nearly half (49.2%) report some level of agreement. This is the strongest evidence for a general taboo factor extending to this sensitive domain.

### Minor Attraction by Specific Kink

| Condition | N | Mean Minor Attract | % Any (>0) |
|-----------|---|-------------------|-----------|
| Incest >= 4 | 1,162 | +0.407 | 57.4% |
| Bestiality >= 4 | 458 | +0.297 | 54.4% |
| CGL >= 4 | 898 | -0.066 | 48.0% |
| Agegap >= 4 | 1,799 | -0.216 | 44.1% |
| **All respondents** | **15,501** | **-0.919** | **30.8%** |

### Correlations with Minor Attraction

| Kink | r |
|------|---|
| Bestiality | 0.173 |
| Incest | 0.169 |
| Creepy | 0.116 |
| Dirty | 0.107 |
| Brutality | 0.106 |
| Bad ends | 0.105 |
| Nonconsent | 0.056 |
| CGL | 0.094 |
| Vore | 0.087 |
| Futa | 0.076 |
| Abnormal body | 0.072 |
| Agegap | 0.072 |
| Fetish breadth | 0.065 |
| Transformation | 0.064 |
| Mental alteration | 0.063 |
| Secretions | 0.040 |
| Sadomasochism | -0.004 |

**Interestingness: 8/10**. Bestiality (r = 0.173) and incest (r = 0.169) have the strongest correlations with minor attraction. These are both "forbidden relationship" taboos. Sadomasochism has essentially zero correlation (-0.004), meaning S&M is completely unrelated to minor attraction. This undermines any simple "deviance leads to deviance" narrative -- the pattern is specific, not general. Incest fans report the highest absolute minor attraction scores (mean +0.407), with 57.4% reporting some agreement.

> **Caveat**: These correlations are all weak (r < 0.20). Minor attraction is not well-predicted by any single taboo kink. The 14-17 age cohort inflates agreement rates since they are rating peers. Self-report on this topic is likely subject to strong social desirability effects even in an anonymous survey.

---

## 8. Key Findings Summary

### Finding 1: Taboo kinks form a tightly interconnected network, but with distinct sub-clusters
**Interestingness: 9/10**

Four sub-clusters emerge from the correlation matrix:
1. **Body Violation cluster** (brutality, creepy, dirty, vore) -- highest internal correlations (r = 0.53-0.61)
2. **Fantasy-Body cluster** (vore, transformation, abnormal body, mental alteration) -- the sci-fi/fantasy taboo space (r = 0.30-0.57)
3. **Forbidden Relationship cluster** (incest, age gap, CGL) -- social/relational taboos (r = 0.12-0.35)
4. **Disgust Transgression cluster** (dirty, secretions, bestiality) -- bodily fluid/animal taboos (r = 0.27-0.52)

Cross-cluster correlations average r ~ 0.26, vs. within-cluster averages of r ~ 0.40-0.55. The clusters are real but not independent.

### Finding 2: Futa is an outlier -- barely connected to the taboo network
**Interestingness: 7/10**

Futa's highest correlation with any taboo kink is r = 0.180 (with vore). It correlates near zero with CGL (0.031), bad ends (0.068), and mental alteration (0.073). It occupies a fundamentally different psychological space -- more about gender/body exploration than transgression.

### Finding 3: Taboo interest is rarely isolated
**Interestingness: 8/10**

Among people high on bestiality, 79% are also high on incest, 76% on nonconsent, and 73% on brutality. Only 20 out of 202 people are "lone wolves" with bestiality as their only high taboo. Dirty is almost never a lone specialization (8 out of 202).

### Finding 4: There IS a general deviance factor, but it's weak
**Interestingness: 8/10**

Fetish breadth predicts taboo interest with r ~ 0.14, confirming that people who are into more kinks generally are somewhat more likely to be into taboo kinks. But specific taboo-to-taboo correlations are 3-4x stronger (r ~ 0.40-0.60), meaning the clustering is driven more by shared transgression type than by generic sexual openness.

### Finding 5: The minor attraction connection is real but weak
**Interestingness: 9/10**

Higher taboo scores monotonically predict higher minor attraction scores. But the individual correlations are all weak (r < 0.20). The strongest links are with incest and bestiality -- "forbidden relationship" taboos, not violence taboos. Sadomasochism has literally zero correlation with minor attraction (r = -0.004).

---

## Appendix: Key SQL Queries

### Pairwise Correlation
```sql
SELECT ROUND(CORR(brutality, creepy), 3) as r
FROM read_parquet('/Users/austin/dev/kink/data/BKSPublic.parquet')
```

### Taboo Score Computation
```sql
WITH scored AS (
  SELECT *,
    (COALESCE(bestiality,0) + COALESCE(vore,0) + COALESCE(incest,0) +
     COALESCE(brutality,0) + COALESCE(badends,0) + COALESCE(creepy,0) +
     COALESCE(dirty,0)) /
    NULLIF(
      (CASE WHEN bestiality IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN vore IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN incest IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN brutality IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN badends IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN creepy IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN dirty IS NOT NULL THEN 1 ELSE 0 END), 0) as taboo_score
  FROM read_parquet('/Users/austin/dev/kink/data/BKSPublic.parquet')
)
SELECT ...
```

### Lift / Gateway Analysis
```sql
-- Lift = P(B>=4 | A>=4) / P(B>=4)
SELECT
  (SELECT COUNT(CASE WHEN dirty>=4 THEN 1 END)*1.0/NULLIF(COUNT(dirty),0)
   FROM read_parquet('...') WHERE bestiality>=4)
  /
  (SELECT COUNT(CASE WHEN dirty>=4 THEN 1 END)*1.0/NULLIF(COUNT(dirty),0)
   FROM read_parquet('...')) as lift
```

### Sub-Cluster Composite Scores
```sql
-- Violence cluster: avg(brutality, badends, nonconsent)
-- Body-Horror cluster: avg(vore, transform, abnormalbody, creepy)
-- Taboo-Relationship cluster: avg(incest, agegap, cgl)
-- Gross-Out cluster: avg(dirty, secretions, bestiality)
-- Each computed only over non-null columns per person
```

# Relationship Styles, Partner Count, and Sexual Behavior Patterns

Analysis of how relationship preferences, partner counts, and sexual behavior orientations relate to kink profiles in the Big Kink Survey (n=15,503).

---

## Q1: How Does Preferred Relationship Style Relate to Kink Profile?

**Interestingness: 7/10** -- Non-monogamous respondents show consistently higher kink engagement across every metric, but the differences are moderate, not dramatic.

The sample is 75.6% monogamous (n=11,720), 24.4% non-monogamous (n=3,780).

```sql
SELECT
  "Personally, your preferred relationship style is: (4jib23m)" as rel_style,
  COUNT(*) as n,
  ROUND(AVG(multiplepartners), 2) as avg_multipartner,
  ROUND(AVG(nonconsent), 2) as avg_nonconsent,
  ROUND(AVG(powerdynamic), 2) as avg_powerdynamic,
  ROUND(AVG(exhibitionself), 2) as avg_exhib,
  ROUND(AVG(voyeurself), 2) as avg_voyeur,
  ROUND(AVG(totalfetishcategory), 2) as avg_fetish_count
FROM read_parquet('data/BKSPublic.parquet')
WHERE "Personally, your preferred relationship style is: (4jib23m)" IS NOT NULL
GROUP BY 1
```

| Metric | Monogamous (n=11,720) | Not Monogamous (n=3,780) | Delta |
|--------|----------------------|--------------------------|-------|
| Multi-partner interest | 3.46 | 3.82 | +0.36 |
| Nonconsent interest | 3.39 | 3.50 | +0.11 |
| Power dynamic interest | 3.81 | 3.85 | +0.04 |
| Exhibition interest | 2.77 | 2.98 | +0.21 |
| Voyeurism interest | 2.18 | 2.58 | +0.40 |
| Total fetish categories | 9.78 | 10.84 | +1.06 |
| Normal sex preference | -5.42 | -5.37 | +0.05 |

**Key findings:**
- Non-monogamous people have ~1 more fetish category on average (10.8 vs 9.8) -- a real but modest difference
- The biggest gaps are in voyeurism (+0.40) and multi-partner interest (+0.36), which makes intuitive sense
- Power dynamics and obedience are nearly identical across groups -- D/s identity is independent of relationship structure
- Normal sex preference is virtually the same (-5.42 vs -5.37), suggesting the "vanilla floor" is consistent

**Dom/sub identity is essentially identical across relationship styles:**

| Dom/Sub | Monogamous % | Non-Monogamous % |
|---------|-------------|-----------------|
| Totally dominant | 6.5% | 7.0% |
| Moderately dominant | 14.7% | 15.7% |
| Switch/equal | 28.6% | 29.6% |
| Moderately submissive | 19.0% | 16.3% |
| Totally submissive | 9.7% | 9.7% |

The only notable shift: non-monogamous people are slightly less likely to be moderately submissive (16.3% vs 19.0%) and slightly more likely to be switch/dominant.

**Non-monogamy increases with age:**

| Age | % Non-Monogamous |
|-----|-----------------|
| 14-17 | 24.2% |
| 18-20 | 21.1% |
| 21-24 | 23.9% |
| 25-28 | 25.4% |
| 29-32 | 26.6% |

The dip at 18-20 (21.1%) is interesting -- possibly reflecting early relationship idealism before life experience.

---

## Q2: Do People with More Partners Have More Diverse Kinks?

**Interestingness: 8/10** -- Yes, but with a plateau. The relationship between partner count and kink diversity is clear and monotonic, but flattens after 8-20 partners.

```sql
SELECT sexcount, COUNT(*) as n,
  ROUND(AVG(totalfetishcategory), 2) as avg_fetish_count,
  ROUND(AVG(multiplepartners), 2) as avg_multipartner,
  ROUND(AVG(exhibitionself), 2) as avg_exhib,
  ROUND(AVG(pornhabit), 2) as avg_pornhabit
FROM read_parquet('data/BKSPublic.parquet')
WHERE sexcount IS NOT NULL
GROUP BY 1
ORDER BY CASE sexcount WHEN '0' THEN 1 WHEN '1-2' THEN 2 WHEN '3-7' THEN 3 WHEN '8-20' THEN 4 WHEN '21+' THEN 5 END
```

| Partners | n | Avg Fetish Categories | Multi-partner | Exhibition | Porn Habit |
|----------|-------|----------------------|---------------|------------|------------|
| 0 | 4,524 | 9.58 | 3.40 | 2.66 | 5.94 |
| 1-2 | 3,904 | 9.75 | 3.51 | 2.68 | 5.67 |
| 3-7 | 3,178 | 10.31 | 3.57 | 2.91 | 5.88 |
| 8-20 | 2,294 | 10.68 | 3.71 | 2.97 | 6.01 |
| 21+ | 1,363 | 10.53 | 3.80 | 3.03 | 6.15 |

**Key findings:**
- Fetish count climbs from 9.58 (0 partners) to 10.68 (8-20), then slightly drops to 10.53 (21+) -- a plateau or saturation effect
- Multi-partner interest is nearly monotonic: 3.40 -> 3.80
- Nonconsent interest is essentially FLAT across all groups (3.34-3.45) -- more partners does NOT mean more nonconsent interest
- Normal sex preference drops steadily: -4.82 -> -5.78 (more partners = less vanilla preference)
- Porn habit increases modestly with partner count (5.67 -> 6.15)

**The three-way split (relationship style x partner count) reveals the real story:**

| Rel Style | Partners | n | Avg Fetish | Multi-partner |
|-----------|----------|-------|------------|---------------|
| Monogamous | 0 | 3,499 | 9.51 | 3.31 |
| Monogamous | 21+ | 962 | 10.22 | 3.60 |
| Non-mono | 0 | 1,023 | 9.82 | 3.63 |
| Non-mono | 21+ | 401 | 11.27 | 4.17 |

Non-monogamous people with 21+ partners average 11.27 fetish categories vs 9.51 for monogamous virgins -- a gap of 1.76 categories. The combination of relationship openness AND experience is additive.

**Dom identity shifts with partner count:**

| Partners | % Totally Dominant | % Switch | % Totally Submissive |
|----------|-------------------|----------|---------------------|
| 0 | 5.6% | 31.5% | 10.9% |
| 1-2 | 6.5% | 28.3% | 8.8% |
| 8-20 | 7.4% | 25.4% | 9.2% |
| 21+ | 9.0% | 26.8% | 10.0% |

More partners = more likely to identify as totally dominant. Switch identification drops as partner count increases. This may reflect that dominant people are more sexually assertive/proactive.

---

## Q3: Hookup Experience x Dominance/Submission

**Interestingness: 7/10** -- People who report "really good" hookup experiences show the highest power dynamic interest and nonconsent interest. But sample sizes are small for the hookup group (only ~2,644 had hookup experience).

```sql
SELECT
  hookup_exp, COUNT(*) as n,
  ROUND(AVG(avg_dom), 2), ROUND(AVG(avg_sub), 2),
  ROUND(AVG(powerdynamic), 2), ROUND(AVG(nonconsent), 2)
FROM read_parquet('data/BKSPublic.parquet')
WHERE hookup_exp IS NOT NULL
GROUP BY 1
```

| Hookup Experience | n | Avg Dom Score | Avg Sub Score | Power Dynamic | Nonconsent |
|-------------------|-------|---------------|---------------|---------------|------------|
| Really bad | 112 | -0.06 | 1.52 | 4.01 | 3.69 |
| Kinda bad | 195 | -0.27 | 1.91 | 3.99 | 3.61 |
| Neutral | 343 | -0.08 | 1.88 | 4.06 | 3.46 |
| Kinda good | 343 | -0.12 | 1.90 | 4.10 | 3.44 |
| Really good | 128 | -0.10 | 1.45 | 4.39 | 4.00 |
| Haven't hooked up | 1,523 | -0.10 | 1.69 | 4.00 | 3.61 |

**Key findings:**
- "Really good" hookup people have the highest power dynamic interest (4.39) and highest nonconsent interest (4.00) -- they seem to be the most kinky group
- "Really good" hookup people have the LOWEST submission score (1.45), comparable to "really bad" (1.52) -- suggesting they are neither strongly dominant nor strongly submissive, or possibly more dominant
- "Kinda bad" hookup people have the highest submission score (1.91) -- bad hookup experience correlates with submission
- Total fetish count goes from 9.13 (really bad) to 10.57 (really good) -- more kinks = better hookup experience

**Gender breakdown of hookup experience:**

| Hookup | Female % | Male % |
|--------|----------|--------|
| Really bad | 4.2% | 4.3% |
| Kinda bad | 7.4% | 6.8% |
| Neutral | 13.3% | 9.8% |
| Kinda good | 12.8% | 14.5% |
| Really good | 4.8% | 5.1% |
| Haven't hooked up | 57.4% | 59.6% |

Note: This question had a very low response rate -- 83% of the sample is NULL. The gender split among respondents is surprisingly even, and the "haven't hooked up" rate is nearly identical (57-60%).

---

## Q4: Who Prefers Freeuse Dynamics?

**Interestingness: 9/10** -- Freeuse shows a striking U-shaped relationship with dom/sub identity. Both total dominants AND total submissives are the most into it, while switches/slightly dominant people are the least interested.

The freeuse score ranges from -3 to +3 (n=6,462 responded).

```sql
-- Freeuse × dom/sub identity
SELECT dom_sub, COUNT(*) as n,
  ROUND(AVG(freeuse_score), 2) as avg_freeuse,
  ROUND(AVG(CASE WHEN freeuse_score >= 2 THEN 1.0 ELSE 0.0 END) * 100, 1) as pct_high_freeuse
FROM freeuse GROUP BY 1
```

| Dom/Sub Identity | n | Avg Freeuse Score | % High Freeuse |
|------------------|-------|-------------------|----------------|
| Totally dominant | 427 | 0.98 | 49.9% |
| Moderately dominant | 934 | 0.92 | 48.9% |
| Slightly dominant | 619 | 0.62 | 38.8% |
| Switch/equal | 1,711 | 0.64 | 41.6% |
| Slightly submissive | 655 | 0.55 | 37.4% |
| Moderately submissive | 1,079 | 0.83 | 45.7% |
| **Totally submissive** | **632** | **0.99** | **52.1%** |

**The U-shape:** Totally submissive people are the MOST into freeuse (avg 0.99, 52.1% high), followed closely by totally dominant (0.98, 49.9%). Slightly dominant/switch/slightly submissive are the LEAST into it (0.55-0.64). This makes sense -- freeuse is fundamentally about power exchange, and people at both extremes of the power spectrum find it erotic.

**Gender x dom/sub reveals further nuance:**

| Gender | Dom/Sub | n | Avg Freeuse |
|--------|---------|-------|-------------|
| Female | Totally submissive | 416 | 0.97 |
| Female | Moderately submissive | 697 | 0.80 |
| Female | Switch/equal | 611 | 0.32 |
| Female | Totally dominant | 99 | 0.72 |
| Male | Totally dominant | 328 | 1.06 |
| Male | Totally submissive | 216 | 1.02 |
| Male | Switch/equal | 1,100 | 0.81 |

Male totally dominant (1.06) and male totally submissive (1.02) are the two highest-freeuse subgroups. Female switches (0.32) are the least interested. Males are generally more positive about freeuse than females across all dom/sub categories.

**Freeuse correlates strongly with other kinks:**

| Freeuse Group | n | Nonconsent | Obedience | Power Dynamic | Fetish Count |
|---------------|-------|------------|-----------|---------------|-------------|
| Low (0-2.4) | 5,110 | 3.25 | 2.67 | 3.74 | 9.31 |
| Mid (2.5-3.9) | 1,352 | 3.97 | 3.38 | 4.30 | 12.12 |

High-freeuse people average 12.12 fetish categories vs 9.31 for low-freeuse -- a gap of nearly 3 categories. They also score 0.72 higher on nonconsent interest and 0.71 higher on obedience.

---

## Q5: Honesty Self-Report as Validity Check

**Interestingness: 8/10** -- Counter-intuitive result. "Totally honest" respondents report HIGHER kink scores than "mostly honest" ones -- the opposite of what you'd expect if kink scores were inflated by dishonesty.

```sql
SELECT honesty, COUNT(*) as n,
  ROUND(AVG(totalfetishcategory), 2) as avg_fetish_count,
  ROUND(AVG(nonconsent), 2) as avg_nonconsent,
  ROUND(AVG(powerdynamic), 2) as avg_powerdynamic
FROM read_parquet('data/BKSPublic.parquet')
WHERE honesty IS NOT NULL
GROUP BY 1
```

| Honesty | n | Fetish Count | Nonconsent | Power Dynamic | Multi-partner | Exhibition | Porn Habit |
|---------|-------|-------------|------------|---------------|---------------|------------|------------|
| Mostly honest | 6,962 | 9.73 | 3.23 | 3.66 | 3.41 | 2.71 | 5.82 |
| Totally honest | 8,538 | 10.29 | 3.55 | 3.95 | 3.70 | 2.91 | 5.94 |

**Key findings:**
- "Totally honest" people report higher scores on EVERY kink metric
- The gap is consistent: ~0.3 on nonconsent, ~0.3 on power dynamic, ~0.3 on multi-partner
- The "totally honest" group has half a fetish category more (10.29 vs 9.73)
- Demographics are nearly identical between groups (51-52% male)

**Interpretation:** This pattern is actually a positive validity signal. It suggests the "mostly honest" group is being conservative or self-censoring -- they know they weren't fully forthcoming, and their kink scores reflect that restraint. The "totally honest" group felt comfortable enough to report everything accurately, and their higher scores reflect fuller disclosure rather than exaggeration.

---

## Q6: Sexual Liberation of Upbringing --> Adult Preferences

**Interestingness: 6/10** -- Surprisingly weak effects. Upbringing liberation has minimal impact on adult kink profiles.

```sql
SELECT upbringing, COUNT(*) as n,
  ROUND(AVG(totalfetishcategory), 2) as avg_fetish_count,
  ROUND(AVG(nonconsent), 2) as avg_nonconsent,
  ROUND(AVG(powerdynamic), 2) as avg_powerdynamic
FROM read_parquet('data/BKSPublic.parquet')
WHERE upbringing IS NOT NULL
GROUP BY 1
```

| Upbringing | n | Fetish Count | Nonconsent | Power Dynamic | Multi-partner | Obedience |
|------------|-------|-------------|------------|---------------|---------------|-----------|
| Repressed | 6,767 | 10.18 | 3.46 | 3.85 | 3.60 | 2.81 |
| Neutral | 3,302 | 9.65 | 3.34 | 3.72 | 3.55 | 2.71 |
| Liberated | 5,427 | 10.10 | 3.41 | 3.85 | 3.56 | 2.77 |

**Key findings:**
- Repressed and liberated upbringings produce nearly IDENTICAL kink profiles (10.18 vs 10.10 fetish categories)
- Neutral upbringing produces the LOWEST kink scores across the board
- The repressed-liberated gap on nonconsent (3.46 vs 3.41) is trivially small
- Repressed upbringing people are slightly MORE likely to be non-monogamous (23.5% vs 25.8% for liberated -- wait, liberated is higher at 25.8%)

**Relationship style by upbringing:**

| Upbringing | % Non-Monogamous |
|------------|-----------------|
| Repressed | 23.5% |
| Neutral | 24.0% |
| Liberated | 25.8% |

Liberated upbringing slightly predicts non-monogamy, but the effect is small (2.3 percentage points). The story here is the null finding: upbringing doesn't strongly shape adult kink preferences, consistent with biological/temperamental explanations for kink development.

---

## Q7: "Optimal Consent" Preferences by Demographics

**Interestingness: 9/10** -- Consent preferences vary dramatically with dom/sub identity but barely with gender or orientation. The consent spectrum is less about demographics and more about individual kink architecture.

```sql
SELECT consent_pref, COUNT(*) as n,
  ROUND(AVG(biomale), 2) as pct_male,
  ROUND(AVG(dom_score), 2) as avg_dom,
  ROUND(AVG(sub_score), 2) as avg_sub,
  ROUND(AVG(nonconsent), 2) as avg_nonconsent_kink
FROM read_parquet('data/BKSPublic.parquet')
WHERE consent_pref IS NOT NULL
GROUP BY 1
```

| Consent Preference | n | % Male | Avg Dom | Avg Sub | Nonconsent Kink |
|-------------------|-------|--------|---------|---------|-----------------|
| Full, enthusiastic consent | 6,709 | 53% | 0.70 | 1.03 | 2.99 |
| Mostly consenting | 4,211 | 52% | 0.71 | 1.16 | 3.01 |
| Equally consenting/nonconsenting | 2,553 | 49% | 0.52 | 1.19 | 3.61 |
| Mostly nonconsenting | 1,303 | 45% | 0.25 | 1.32 | 4.15 |
| Full nonconsent | 721 | 49% | 0.48 | 1.20 | 4.13 |

**Key findings:**
- Gender split is nearly even across all consent preferences -- this is NOT primarily a male-female difference
- "Mostly nonconsenting" preference is the most female-skewed (55% female, 45% male)
- Dominance scores DROP as consent preferences shift toward nonconsent (0.70 -> 0.25 for "mostly nonconsenting"), then rise again at "full nonconsent" (0.48)
- Submission scores RISE steadily (1.03 -> 1.32), peaking at "mostly nonconsenting"
- Nonconsent kink scores track consent preference perfectly: 2.99 -> 4.13

**Gender x straightness breakdown for "full nonconsent":**

| Gender | Straight | % Full Nonconsent |
|--------|----------|-------------------|
| Female | Straight | 4.9% |
| Female | Not straight | 4.9% |
| Male | Straight | 4.4% |
| Male | Not straight | 4.6% |

Remarkably uniform. Nonconsent preference doesn't vary significantly by gender or sexual orientation -- it's about 4.4-4.9% across all four groups.

**Relationship style barely affects consent preferences:**

| Consent Pref | Monogamous % | Non-Mono % |
|-------------|-------------|-----------|
| Full enthusiastic | 44.0% | 41.0% |
| Mostly consenting | 27.3% | 26.9% |
| Equal | 15.9% | 18.2% |
| Mostly nonconsenting | 8.2% | 9.0% |
| Full nonconsent | 4.6% | 4.9% |

Non-monogamous people are slightly more likely to prefer nonconsent scenarios (32.1% prefer some nonconsent vs 28.7% for monogamous), but the shift is modest.

---

## Q8: "Could You Stop Being Aroused?" -- Fixity of Sexual Interests

**Interestingness: 9/10** -- The perceived fixity of arousal patterns is one of the strongest predictors of kink intensity in the entire dataset. People who say "impossible" have 2.6 more fetish categories than those who say "with little effort."

```sql
SELECT can_stop, COUNT(*) as n,
  ROUND(AVG(totalfetishcategory), 2) as avg_fetish_count,
  ROUND(AVG(nonconsent), 2) as avg_nonconsent,
  ROUND(AVG(powerdynamic), 2) as avg_powerdynamic,
  ROUND(AVG(knowwhatarousesyou), 2) as avg_know_arousal
FROM read_parquet('data/BKSPublic.parquet')
WHERE can_stop IS NOT NULL
GROUP BY 1
```

| Can Stop? | n | Fetish Count | Nonconsent | Power Dynamic | Porn Habit | Self-Knowledge |
|-----------|-------|-------------|------------|---------------|------------|---------------|
| Little effort | 1,355 | 8.50 | 3.33 | 3.64 | 5.14 | 1.08 |
| Some effort | 4,222 | 9.28 | 3.14 | 3.59 | 5.69 | 1.26 |
| A lot of effort | 3,741 | 10.00 | 3.31 | 3.75 | 5.94 | 1.43 |
| Extreme effort, maybe | 4,284 | 10.83 | 3.53 | 3.95 | 6.17 | 1.51 |
| Impossible | 1,900 | 11.11 | 3.77 | 4.19 | 6.11 | 1.64 |

**Key findings:**
- Near-perfect monotonic gradient: every step toward "more fixed" = more fetish categories, more nonconsent interest, more power dynamic interest
- Fetish count: 8.50 (flexible) -> 11.11 (fixed) -- a 30% increase
- Self-knowledge of arousal also increases with fixity (1.08 -> 1.64) -- people who can't change their interests also understand them better
- Normal sex preference drops from -4.89 (flexible) to -5.78 (fixed)

**Gender split:**

| Can Stop? | Female % | Male % |
|-----------|----------|--------|
| Little effort | 10.3% | 7.3% |
| Some effort | 28.7% | 25.8% |
| A lot of effort | 23.2% | 25.0% |
| Extreme effort, maybe | 25.9% | 29.3% |
| Impossible | 11.9% | 12.6% |

Males skew slightly more toward "fixed" arousal patterns (41.9% say extreme/impossible vs 37.8% for females), but the difference is modest. Both genders show similar distributions.

**Interpretation:** This is arguably the most interesting metacognitive variable in the dataset. People who experience their arousal as fixed/immutable also have significantly more diverse and intense kink profiles. The causal arrow could run either way: (1) having many strong kinks makes you feel they're fixed, or (2) having a more "hard-wired" sexuality leads to accumulating more specific kinks over time.

---

## Q9: Who Feels Their Interests Are Broad vs. Narrow?

**Interestingness: 8/10** -- Self-perceived breadth of interests tracks kink diversity almost perfectly, and is also gendered and correlated with self-knowledge.

```sql
SELECT interests_feel, COUNT(*) as n,
  ROUND(AVG(biomale), 2) as pct_male,
  ROUND(AVG(totalfetishcategory), 2) as avg_fetish_count,
  ROUND(AVG(knowwhatarousesyou), 2) as avg_know_arousal
FROM read_parquet('data/BKSPublic.parquet')
WHERE interests_feel IS NOT NULL
GROUP BY 1
```

| Interests Feel | n | % Male | Fetish Count | Nonconsent | Power Dynamic | Porn Habit | Self-Knowledge |
|---------------|-------|--------|-------------|------------|---------------|------------|---------------|
| Very narrow | 643 | 48% | 8.51 | 3.34 | 3.66 | 5.09 | 1.13 |
| Somewhat narrow | 1,261 | 46% | 9.14 | 3.27 | 3.72 | 5.55 | 1.21 |
| A little narrow | 1,754 | 45% | 8.90 | 3.33 | 3.72 | 5.60 | 1.26 |
| Equal | 3,159 | 45% | 9.09 | 3.27 | 3.61 | 5.60 | 1.22 |
| A little broad | 2,603 | 50% | 9.43 | 3.29 | 3.76 | 5.83 | 1.37 |
| Somewhat broad | 3,687 | 57% | 10.69 | 3.37 | 3.86 | 6.20 | 1.54 |
| Very broad | 2,392 | 60% | 12.68 | 3.77 | 4.15 | 6.44 | 1.72 |

**Key findings:**
- "Very broad" respondents average 12.68 fetish categories vs 8.51 for "very narrow" -- a 49% increase
- Male proportion increases from 45% (narrow) to 60% (very broad) -- men perceive their interests as broader
- Self-knowledge climbs steeply with breadth (1.13 -> 1.72) -- knowing more = perceiving more
- Nonconsent interest is relatively flat until "very broad" where it jumps (3.77 vs ~3.30)
- The biggest jump in fetish count is from "a little broad" to "somewhat broad" (9.43 -> 10.69) -- a threshold effect

**Breadth x relationship style:**

| Interests | Monogamous % Broad* | Non-Mono % Broad* |
|-----------|-------------------|-------------------|
| Somewhat broad | 23.3% | 25.1% |
| Very broad | 14.4% | 18.6% |
| **Combined broad** | **37.7%** | **43.7%** |

*Percentage who selected "somewhat" or "very" broad

Non-monogamous people are 6 percentage points more likely to perceive their interests as broad.

---

## Bonus: Erotic Energy Intensity x Dom/Sub Identity

**Interestingness: 8/10** -- Another U-shaped relationship, like freeuse. Both total dominants AND total submissives prefer high-intensity scenarios; switches prefer the middle.

| Dom/Sub | n | % High Energy* | % Low Energy** | Nonconsent | Gentleness |
|---------|-------|----------------|----------------|------------|------------|
| Totally dominant | 1,005 | 53.2% | 5.8% | 3.82 | 3.47 |
| Moderately dominant | 2,261 | 40.8% | 6.0% | 3.31 | 3.40 |
| Slightly dominant | 1,476 | 30.6% | 7.0% | 3.10 | 3.33 |
| Switch/equal | 4,354 | 29.7% | 7.1% | 3.24 | 3.53 |
| Slightly submissive | 1,763 | 32.3% | 7.3% | 3.19 | 3.49 |
| Moderately submissive | 2,767 | 40.0% | 6.4% | 3.47 | 3.51 |
| Totally submissive | 1,469 | 48.2% | 6.2% | 3.83 | 3.70 |

*Moderately or totally intense, high-energy
**Moderately or totally gentle, low-energy

**Key findings:**
- Totally dominant: 53.2% prefer high energy. Totally submissive: 48.2% prefer high energy. Switch: only 29.7%.
- The "totally submissive" group has the HIGHEST gentleness score (3.70) even while preferring high-energy scenarios -- they want intensity but also tenderness
- Nonconsent mirrors the U-shape: 3.82 (dom) and 3.83 (sub) vs 3.10-3.24 in the middle
- Low energy preference is nearly constant at 5.8-7.3% regardless of identity -- very few people prefer low energy

---

## Bonus: Self-Knowledge of Arousal

**Interestingness: 7/10** -- People who "fully know" what arouses them have the most kinks and the most extreme kink profiles.

| Self-Knowledge | n | Fetish Count | Power Dynamic | Normal Sex | Porn Habit |
|---------------|-------|-------------|---------------|------------|------------|
| Fully don't know | 540 | 8.99 | 3.88 | -5.06 | 5.32 |
| Moderately don't know | 774 | 8.87 | 3.69 | -4.99 | 5.21 |
| Slightly don't know | 921 | 8.89 | 3.53 | -5.00 | 5.38 |
| Slightly know | 3,267 | 9.17 | 3.65 | -5.11 | 5.57 |
| Moderately know | 7,347 | 10.51 | 3.84 | -5.53 | 6.11 |
| Fully know | 2,653 | 10.77 | 4.05 | -5.75 | 6.13 |

**Interesting wrinkle:** The "fully don't know" group has a HIGHER power dynamic score (3.88) than "slightly/moderately don't know" -- people who are most confused about their arousal still have strong power dynamic interests, they just can't articulate what drives them.

---

## Summary of Interestingness Ratings

| Question | Rating | One-Line Summary |
|----------|--------|-----------------|
| Q1: Relationship style x kinks | 7/10 | Non-mono = +1 fetish category, but D/s identity identical |
| Q2: Partner count x kink diversity | 8/10 | Clear monotonic relationship that plateaus at 8-20 partners |
| Q3: Hookup experience x dom/sub | 7/10 | Best hookups correlate with most kinks (small n) |
| Q4: Freeuse demographics | 9/10 | U-shaped: both total doms AND total subs are most into it |
| Q5: Honesty validity check | 8/10 | "Totally honest" report MORE kinks -- positive validity signal |
| Q6: Upbringing liberation | 6/10 | Surprisingly weak effects, supports biological explanations |
| Q7: Consent preferences | 9/10 | Barely varies by gender/orientation; tracks D/s identity instead |
| Q8: Fixity of arousal | 9/10 | Strongest predictor of kink intensity in dataset |
| Q9: Breadth of interests | 8/10 | "Very broad" = 49% more kinks, 60% male, highest self-knowledge |
| Bonus: Energy intensity | 8/10 | U-shape again: extremes of D/s prefer high intensity |

**Top 3 most interesting findings:**
1. **Arousal fixity is the best kink predictor** (Q8): People who say they can't change what arouses them have 30% more fetish categories and higher scores on every kink metric
2. **Freeuse's U-shape** (Q4): Both total dominants and total submissives find freeuse erotic; the middle is least interested
3. **Consent preference is not gendered** (Q7): The consent spectrum barely varies by gender or sexual orientation -- it's driven by individual D/s architecture

**Methodological note:** The honesty check (Q5) is reassuring. If social desirability bias were driving kink scores upward, we'd expect "mostly honest" people to report higher scores. Instead, the pattern suggests "mostly honest" means "I held back a bit," making the fully honest group's higher scores reflect better disclosure, not inflation.

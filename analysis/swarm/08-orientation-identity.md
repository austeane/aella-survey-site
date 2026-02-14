# 08 - Sexual Orientation & Identity Analysis

**Dataset**: Big Kink Survey (~15,503 respondents)
**Focus**: How straightness interacts with gender to shape kink profiles, dom/sub dynamics, erotic role identification, narcissism, catcalling attitudes, and cross-gender embodiment.

---

## Sample Sizes by Quadrant

| Quadrant | N |
|----------|---|
| Straight Male | 7,183 |
| Straight Female | 6,522 |
| Non-Straight Male | 756 |
| Non-Straight Female | 1,042 |

---

## Q1: Kink Profiles by Gender x Orientation Quadrant

**Interestingness: 7/10** -- The differences are modest in magnitude but reveal clear structural patterns.

### Raw Means (1-5+ scale)

```sql
SELECT
  CASE WHEN biomale=1 THEN 'Male' ELSE 'Female' END as gender,
  straightness, COUNT(*) as n,
  ROUND(AVG(sadomasochism),2) as sm, ROUND(AVG(nonconsent),2) as nc,
  ROUND(AVG(humiliation),2) as hm, ROUND(AVG(powerdynamic),2) as pd,
  ROUND(AVG(genderplay),2) as gp, ROUND(AVG(exhibitionself),2) as es,
  ROUND(AVG(exhibitionother),2) as eo, ROUND(AVG(futa),2) as fu,
  ROUND(AVG(multiplepartners),2) as mp, ROUND(AVG(incest),2) as inc,
  ROUND(AVG(gentleness),2) as gn, ROUND(AVG(obedience),2) as ob
FROM read_parquet('data/BKSPublic.parquet')
GROUP BY 1,2 ORDER BY 1,2
```

| Gender | Orientation | sm | nc | hm | pd | gp | exhibSelf | exhibOther | futa | multi | incest | gentle | obed |
|--------|-------------|------|------|------|------|------|-----------|------------|------|-------|--------|--------|------|
| Female | Not straight | 3.48 | 3.46 | 3.54 | 3.86 | 3.04 | 2.91 | 2.79 | 2.91 | 3.65 | 3.52 | 3.56 | 2.72 |
| Female | Straight | 3.46 | 3.47 | 3.49 | 3.90 | 2.86 | 2.83 | 2.59 | 2.58 | 3.52 | 3.23 | 3.52 | 2.77 |
| Male | Not straight | 3.35 | 3.38 | 3.63 | 3.78 | 3.37 | 2.93 | 3.28 | 3.05 | 3.60 | 3.47 | 3.47 | 2.94 |
| Male | Straight | 3.31 | 3.36 | 3.48 | 3.75 | 3.18 | 2.79 | 3.11 | 3.06 | 3.60 | 3.37 | 3.47 | 2.77 |

### Deviations from Overall Mean

| Gender | Orientation | sm | nc | hm | pd | gp | exhibSelf | exhibOther | futa | multi | incest | gentle | obed |
|--------|-------------|-------|-------|-------|-------|-------|-----------|------------|-------|-------|--------|--------|------|
| Female | Not straight | +0.09 | +0.05 | +0.04 | +0.03 | -0.06 | +0.08 | -0.10 | -0.02 | +0.07 | **+0.17** | +0.06 | -0.05 |
| Female | Straight | +0.06 | +0.05 | -0.01 | +0.07 | **-0.24** | +0.01 | **-0.31** | **-0.35** | -0.05 | -0.11 | +0.02 | -0.00 |
| Male | Not straight | -0.05 | -0.04 | **+0.13** | -0.05 | **+0.26** | +0.10 | **+0.38** | +0.12 | +0.03 | +0.13 | -0.02 | **+0.17** |
| Male | Straight | -0.09 | -0.05 | -0.02 | -0.08 | +0.08 | -0.03 | **+0.21** | +0.13 | +0.03 | +0.02 | -0.03 | -0.01 |

### Key Findings

1. **Exhibitionism-other is the most gender-split kink**: Men score 0.3-0.5 points higher than women regardless of orientation. The male desire to watch others is one of the strongest gender effects in the dataset.

2. **Non-straight men are the outlier quadrant**: They have the highest humiliation (+0.13), genderplay (+0.26), exhibitionism-other (+0.38), and obedience (+0.17) deviations. This group has a distinctly different kink signature.

3. **Straight women are the most "normative" quadrant**: They show the largest negative deviations on futa (-0.35), exhibitionother (-0.31), and genderplay (-0.24). These are the kinks they are least interested in relative to the sample.

4. **Non-straight women show the highest incest deviation (+0.17)** -- the only quadrant where this is notable.

5. **Power dynamics are highest for women** (both orientations score 3.86-3.90) vs men (3.75-3.78). Women are more drawn to power dynamics regardless of orientation.

---

## Q2: Dom/Sub Split Across Gender x Orientation

**Interestingness: 9/10** -- This is one of the sharpest and most dramatic findings in the dataset.

### Self-Rated Dom/Sub Arousal

```sql
-- Using columns() syntax for the quoted column names:
SELECT CASE WHEN biomale=1 THEN 'Male' ELSE 'Female' END as gender,
  straightness, COUNT(*) as n,
  ROUND(AVG(dom_arousal),2), ROUND(AVG(sub_arousal),2),
  ROUND(AVG(dom_arousal - sub_arousal),2) as dom_minus_sub
FROM ... GROUP BY 1,2
```

| Gender | Orientation | N | Avg Dom | Avg Sub | Dom - Sub | % Dom-dominant | % Sub-dominant | % Equal |
|--------|-------------|------|---------|---------|-----------|----------------|----------------|---------|
| Female | Not straight | 1,028 | 0.31 | 1.55 | **-1.24** | 18.3% | 54.3% | 27.4% |
| Female | Straight | 6,427 | 0.09 | 1.59 | **-1.50** | 16.4% | 60.2% | 23.4% |
| Male | Not straight | 729 | 0.81 | 0.95 | **-0.14** | 33.9% | 37.7% | 28.4% |
| Male | Straight | 6,802 | 1.16 | 0.63 | **+0.52** | 43.5% | 27.1% | 29.3% |

### Key Findings

1. **Straight men are the ONLY quadrant where dom > sub arousal** (dom-sub = +0.52). In every other group, submissive arousal exceeds dominant arousal.

2. **Women are overwhelmingly sub-leaning regardless of orientation**: 54-60% are sub-dominant, only 16-18% dom-dominant. The gap is remarkably stable across orientation.

3. **Non-straight men are the "switch" quadrant**: Near-equal dom (0.81) and sub (0.95) arousal, with 28.4% equal -- the most balanced group.

4. **The gender gap in dom arousal is enormous**: Straight men average 1.16 dom arousal vs straight women at 0.09. That's a 12x difference. Submissive arousal shows a smaller but inverted gap (0.63 vs 1.59).

5. **Non-straightness in men shifts them toward submission** (dom drops from 1.16 to 0.81, sub rises from 0.63 to 0.95). Non-straightness in women slightly increases dom arousal (0.09 to 0.31) while keeping sub constant.

### Power Dynamics Preferences (Brutal vs Caring)

| Response | F Str | F NS | M Str | M NS |
|----------|-------|------|-------|------|
| Very brutal/cruel | 3.2% | 4.7% | 4.9% | 5.3% |
| Moderately brutal | 9.4% | 9.8% | 9.6% | 10.9% |
| Slightly brutal | 13.8% | 14.5% | 14.7% | 12.7% |
| Equally brutal and caring | 50.6% | 47.5% | 43.5% | 47.8% |
| Slightly caring | 9.6% | 11.4% | 10.5% | 9.7% |
| Moderately caring | 8.5% | 7.5% | 10.2% | 7.6% |
| Very caring/gentle | 5.0% | 4.5% | 6.6% | 5.9% |

Finding: **Straight women are the most likely to choose "Equally brutal and caring" (50.6%)** while **straight men skew slightly more toward the caring side** (6.6% "Very caring" vs 5.0% for straight women). This is counterintuitive -- the group with highest dom arousal also has a notable caring preference.

---

## Q3: Erotic Role Identification

**Interestingness: 6/10** -- Modest but consistent orientation effect.

```sql
-- "In scenarios you find erotic, you tend to identify with (or imagine being):"
```

| Role | F Str | F NS | M Str | M NS |
|------|-------|------|-------|------|
| Totally one specific role | 28.9% | 23.2% | 27.5% | 23.2% |
| Somewhat one specific role | 45.9% | 45.3% | 44.2% | 43.3% |
| Somewhat all roles at once | 19.0% | 23.2% | 20.8% | 24.1% |
| Totally all roles at once | 6.2% | 8.2% | 7.5% | 9.4% |

- **Non-straight people of both genders** identify with "all the roles" more often (32.3% vs 26.8% for straight).
- The effect is similar across genders (~5-6 percentage point increase in "all roles" for non-straight).

### Erotic Role vs Kink Profile

People who identify with "all roles at once" show:
- **Higher dom AND sub arousal** (dom: 0.89-0.92 vs 0.42 for one-role; sub: 1.28-1.29 vs 0.93)
- **Higher genderplay** (3.17-3.29 vs 3.01-3.11)
- **Higher totalfetishcategory** (10.34-10.77 vs 9.67-9.96)
- Higher exhibitionism-self (3.07 vs 2.76-2.81)

These are the "omnivorous" sexual imaginations -- higher interest across nearly every dimension.

### "youfeelmost" (Dominant Erotic Feeling) by Quadrant

| Feeling | F Str | F NS | M Str | M NS |
|---------|-------|------|-------|------|
| Eagerness or desire | 34.8% | 33.8% | 32.0% | 29.5% |
| Love or romance | 16.5% | 15.6% | **23.9%** | 21.1% |
| Wildness or primalness | 11.5% | 10.6% | 13.7% | 10.5% |
| Powerlessness or vulnerability | **15.8%** | 14.2% | 7.4% | **11.6%** |
| Safety or warmth | 6.4% | 5.9% | 6.5% | 8.8% |
| Power or smugness | 3.5% | **5.5%** | **6.0%** | 4.8% |

Key findings:
- **Straight men report "Love or romance" at much higher rates than women** (23.9% vs 16.5%). This is one of the largest gender gaps in the emotional domain -- men are MORE romantic in their erotic feelings.
- **Women report "Powerlessness or vulnerability" at 2x the rate of straight men** (15.8% vs 7.4%). Non-straight men are intermediate (11.6%).
- **Non-straight women have elevated "Power or smugness"** (5.5% vs 3.5% straight) -- consistent with their higher dom arousal.

### "otherfeel1most" (What You Want Partner to Feel)

| Feeling | F Str | F NS | M Str | M NS |
|---------|-------|------|-------|------|
| Eagerness or desire | 33.8% | 28.7% | 30.2% | 24.8% |
| Love or romance | 14.3% | 16.3% | **20.0%** | **21.4%** |
| Wildness or primalness | **15.1%** | 12.8% | 9.2% | 11.5% |
| Power or smugness | **16.5%** | **17.2%** | 7.0% | 10.7% |
| Powerlessness or vulnerability | 4.0% | 5.3% | **11.0%** | 7.8% |
| Safety or warmth | 4.4% | 6.2% | 7.8% | 8.1% |

**The mirror is striking**: Women want their partners to feel "Power or smugness" (16.5-17.2%) while men want their partners to feel "Powerlessness or vulnerability" (11.0%). This perfectly maps onto the dom/sub asymmetry. Men want partners to feel "Love or romance" (20-21%) much more than women want the same (14-16%).

---

## Q4: Narcissism and Kink

**Interestingness: 5/10** -- Weaker than expected, but narcissism is rare in the sample.

Only 1,303 of 15,503 respondents answered the narcissism question. Average score: -0.76 (most people disagree with "I am a narcissist").

### Narcissism by Quadrant

| Gender | Orientation | Avg Narcissism |
|--------|-------------|----------------|
| Female | Not straight | -1.22 |
| Female | Straight | -0.92 |
| Male | Not straight | -0.43 |
| Male | Straight | -0.67 |

**Non-straight men rate themselves highest on narcissism** (-0.43), while non-straight women rate themselves lowest (-1.22). The gender gap in self-reported narcissism (0.3-0.8 points) exceeds the orientation gap.

### Overall Correlations (N=1,303)

| Correlation | r |
|-------------|---|
| Narcissism - Dom arousal | +0.065 |
| Narcissism - Sub arousal | -0.060 |
| Narcissism - Exhib self | -0.053 |
| Narcissism - Exhib other | -0.016 |
| Narcissism - Power dynamic | -0.039 |
| Narcissism - Humiliation | -0.036 |
| Narcissism - Sadomasochism | +0.013 |

All correlations are very weak (|r| < 0.07). Narcissism is a near-zero predictor of kink interest in this sample.

### Narcissism Groups vs Kink Means

| Group | N | Dom | Sub | Exhib Self | Exhib Other | Power | SM |
|-------|---|-----|-----|------------|-------------|-------|----|
| Low (<=1) | 762 | 0.69 | 1.28 | 2.84 | 2.93 | 3.94 | 3.36 |
| Mid | 168 | 0.85 | 1.25 | 2.75 | 2.56 | 3.83 | 3.15 |
| High (>=1) | 373 | 0.86 | 1.08 | 2.65 | 2.86 | 3.87 | 3.37 |

The pattern is directionally correct (higher narcissism = slightly more dom, slightly less sub, slightly less exhib-self) but the magnitudes are trivial.

### One Noteworthy Subgroup: Non-Straight Women

Among non-straight women, narcissism correlates with:
- Dom arousal: r = **-0.202** (narcissistic non-straight women are LESS dom)
- Exhib self: r = **+0.232** (narcissistic non-straight women are MORE exhibitionistic)
- Exhib other: r = **+0.350** (narcissistic non-straight women want others to exhibit MORE)

This is the only subgroup where narcissism has meaningful correlations with kink, suggesting narcissism may manifest differently across gender/orientation intersections.

---

## Q5: Catcalling Response

**Interestingness: 8/10** -- Dramatic gender gap and strong kink correlates.

### Response Distribution by Quadrant

| Response | F Str | F NS | M Str | M NS |
|----------|-------|------|-------|------|
| Awful | 16.6% | **25.5%** | 9.0% | 8.4% |
| A bit negative | 23.2% | 24.5% | 14.4% | 14.6% |
| Neutral | 19.2% | 15.4% | 20.0% | 21.1% |
| A bit positive | 28.7% | 25.2% | **33.0%** | **34.1%** |
| Awesome | 12.2% | 9.5% | **23.7%** | 21.8% |

Key findings:
- **Non-straight women find catcalling MOST negative**: 50.0% negative (25.5% Awful + 24.5% A bit negative) vs 39.8% for straight women.
- **Men of both orientations overwhelmingly find it positive**: 56.7% of straight men and 55.9% of non-straight men rate it positive.
- **Orientation barely affects men's catcalling response** but significantly affects women's (non-straight women are 10pp more negative).

### Catcalling Response vs Kink Profile (All Respondents)

| Response | N | Exhib Self | Exhib Other | Nonconsent | Power | Humiliation | Obedience | Gentle |
|----------|---|------------|-------------|------------|-------|-------------|-----------|--------|
| Awful | 710 | 2.56 | 2.53 | 3.60 | 3.89 | 3.46 | 2.70 | 3.68 |
| A bit negative | 1,021 | 2.62 | 2.71 | 3.53 | 3.86 | 3.74 | 2.66 | 3.57 |
| Neutral | 1,100 | 2.69 | 2.79 | 3.33 | 3.83 | 3.48 | 2.74 | 3.45 |
| A bit positive | 1,753 | 2.80 | 2.89 | 3.44 | 3.86 | 3.52 | 2.86 | 3.56 |
| Awesome | 1,055 | **3.06** | **3.28** | **3.74** | **4.07** | **3.92** | **3.21** | **3.72** |

**"Awesome" catcalling responders are kinkier across the board**, particularly on exhibitionism-other (+0.75 over "Awful"), humiliation (+0.46), and obedience (+0.51). They also have the highest nonconsent (3.74) and power dynamics (4.07) scores.

### Catcalling Response by Gender x Dom/Sub

| Gender | Response | N | Dom | Sub | Exhib Self | Nonconsent |
|--------|----------|---|-----|-----|------------|------------|
| Female | Awful | 413 | -0.02 | 1.44 | 2.63 | 3.70 |
| Female | Awesome | 276 | 0.16 | 1.68 | 3.17 | 3.92 |
| Male | Awful | 297 | 1.19 | 0.48 | 2.48 | 3.42 |
| Male | Awesome | 779 | 1.31 | 0.81 | 3.01 | 3.66 |

Men who love catcalling: high dom, moderate sub, very high exhib and nonconsent.
Women who love catcalling: very low dom, high sub, high exhib and nonconsent -- they like being objectified while being submissive.

---

## Q6: Total Fetish Category by Orientation

**Interestingness: 4/10** -- The "non-straight people are more open" stereotype is barely supported.

```sql
SELECT CASE WHEN biomale=1 THEN 'Male' ELSE 'Female' END as gender,
  straightness, COUNT(*) as n,
  ROUND(AVG(totalfetishcategory),2) as avg, ROUND(STDDEV(totalfetishcategory),2) as sd
FROM read_parquet('data/BKSPublic.parquet') WHERE totalfetishcategory IS NOT NULL
GROUP BY 1,2 ORDER BY 1,2
```

| Gender | Orientation | N | Mean | SD | Median |
|--------|-------------|------|------|------|--------|
| Female | Not straight | 1,042 | 10.48 | 6.05 | 10.0 |
| Female | Straight | 6,522 | 9.79 | 5.86 | 9.0 |
| Male | Not straight | 756 | 10.34 | 6.34 | 9.0 |
| Male | Straight | 7,183 | 10.17 | 6.24 | 9.0 |

**Cohen's d for straight vs not-straight (overall): 0.071** -- a trivially small effect size.

Non-straight people do score slightly higher on total fetish breadth, but the difference (0.4-0.7 categories) is negligible against standard deviations of ~6. The "more open" stereotype is not meaningfully supported by this data. Both groups are highly varied internally.

---

## Q7: Cross-Gender Embodiment (Genderplay & Futa)

**Interestingness: 8/10** -- Strong patterns emerge especially among straight men.

### Base Rates

| Gender | Orientation | Genderplay | Futa |
|--------|-------------|------------|------|
| Female | Not straight | 3.04 | 2.91 |
| Female | Straight | 2.86 | 2.58 |
| Male | Not straight | **3.37** | 3.05 |
| Male | Straight | 3.18 | **3.06** |

Non-straight men have the highest genderplay (3.37). Straight men have essentially equal futa interest (3.06) to non-straight men (3.05) -- futa interest does NOT vary by orientation in men.

### Straight Men: High vs Low Genderplay

| Group | N | Dom | Sub | Futa | Humil | ExhibSelf | Noncon | Obed | Incest |
|-------|---|-----|-----|------|-------|-----------|--------|------|--------|
| High GP (4+) | 784 | 0.99 | **1.45** | 3.54 | 3.79 | 3.20 | 3.69 | 3.23 | 3.61 |
| Mid GP | 5,882 | 1.18 | 0.51 | 2.80 | 3.42 | 2.74 | 3.34 | 2.67 | 3.32 |
| Low GP (<=2) | 517 | 1.15 | 0.83 | 2.48 | 3.21 | 2.69 | 2.97 | 2.81 | 3.14 |

**Straight men with high genderplay are dramatically more submissive** (sub arousal 1.45 vs 0.51 for mid group) -- nearly triple. They also score much higher on humiliation, exhibitionism, nonconsent, and obedience. High-genderplay straight men look more like the average woman in their sub arousal.

### Straight Women: High vs Low Genderplay

| Group | N | Dom | Sub | Futa | Humil | ExhibSelf | Noncon | Obed | Incest |
|-------|---|-----|-----|------|-------|-----------|--------|------|--------|
| High GP (4+) | 251 | **0.63** | 1.70 | 3.12 | 3.97 | 3.03 | 3.97 | 3.36 | 3.69 |
| Mid GP | 5,988 | 0.05 | 1.59 | 2.76 | 3.46 | 2.82 | 3.44 | 2.74 | 3.19 |
| Low GP (<=2) | 283 | 0.54 | 1.60 | 1.91 | 3.32 | 2.80 | 3.32 | 2.77 | 2.97 |

**Straight women with high genderplay are more dominant** (dom arousal 0.63 vs 0.05 for mid) -- the pattern is a mirror. Both genders' high-genderplay subgroups shift toward the opposite gender's dom/sub profile.

### Genital Identity Match Preference by Orientation

| Gender | Orientation | Does match (cis) | Slightly cis | Equal | Slightly trans | Does not match |
|--------|-------------|-----------------|--------------|-------|----------------|----------------|
| Female | Not straight | 44.3% | 14.8% | **32.1%** | 4.5% | 4.2% |
| Female | Straight | 68.0% | 11.8% | 13.0% | 3.5% | 3.7% |
| Male | Not straight | 57.7% | 14.4% | **20.5%** | 3.4% | 4.0% |
| Male | Straight | 66.8% | 14.1% | 11.7% | 3.8% | 3.7% |

**Non-straight women show the most openness to gender-genital mismatch**: 32.1% "equally attracted to both" vs only 13.0% of straight women. This is the largest orientation gap in any single measure (19pp).

Correlation between genital-mismatch-preference and genderplay: r = 0.159 (straight) and r = 0.138 (non-straight) -- modest but consistent.

---

## Bonus: Sub-Leaning Non-Straight Men -- A Distinct Population

**Interestingness: 8/10**

| Group | N | Dom | Sub | SM | Humil | GP | ExhibSelf | Noncon | Gentle | Obed |
|-------|---|-----|-----|------|-------|------|-----------|--------|--------|------|
| Straight Male | 6,802 | 1.16 | 0.63 | 3.30 | 3.48 | 3.18 | 2.79 | 3.35 | 3.47 | 2.77 |
| NS Male (dom/eq) | 454 | 1.78 | 0.20 | 3.33 | 3.66 | 3.29 | 2.95 | 3.25 | 3.52 | 2.87 |
| NS Male (sub) | 275 | **-0.79** | **2.20** | 3.38 | 3.62 | **3.50** | 2.91 | 3.57 | 3.39 | **3.03** |
| Non-Straight Female | 1,028 | 0.31 | 1.55 | 3.48 | 3.55 | 3.03 | 2.91 | 3.46 | 3.57 | 2.72 |
| Straight Female | 6,427 | 0.09 | 1.59 | 3.46 | 3.50 | 2.86 | 2.84 | 3.47 | 3.52 | 2.77 |

Sub-leaning non-straight men (N=275) are a highly distinctive group:
- **Most submissive** (2.20) and only male group with negative dom arousal (-0.79)
- **Highest genderplay** (3.50) of any subgroup
- **Highest obedience** (3.03) of any subgroup
- **Highest nonconsent** (3.57) among men
- Their submissive arousal (2.20) significantly exceeds even straight women's (1.59)

They do NOT simply "look like women" -- they exceed women on submission, genderplay, obedience, and nonconsent while having lower gentleness (3.39 vs 3.52). They are more intensely kinky, not merely gender-role-reversed.

---

## Summary of Top Findings

1. **Straight men are the only dom-dominant quadrant** (dom-sub = +0.52); every other group is sub-leaning. This is the single clearest gender x orientation effect. (9/10)

2. **Catcalling response is powerfully gender-split** and kink-predictive. "Awesome" responders score 0.5-0.75 points higher on exhibitionism, humiliation, and obedience regardless of gender. Non-straight women find catcalling most negative (50% negative). (8/10)

3. **Straight men's "Love or romance" as primary erotic feeling (24%)** exceeds women's rate (16.5%) -- one of the most counterintuitive findings. Women prioritize "Powerlessness or vulnerability" at 2x men's rate. (8/10)

4. **High-genderplay straight men are sub-shifted**: sub arousal of 1.45 vs 0.51 for mid-genderplay. High-genderplay straight women are dom-shifted (0.63 vs 0.05). Genderplay tracks with cross-gender power identification. (8/10)

5. **Sub-leaning non-straight men are the most kinky subgroup**, exceeding all others on submission, genderplay, obedience, and nonconsent. They are a distinctive population, not simply "like women." (8/10)

6. **Non-straight women show the most openness to gender-genital mismatch** (32.1% "equally attracted to both" vs 13.0% straight women). (7/10)

7. **Non-straight people are NOT meaningfully more "open"** by total fetish category count (Cohen's d = 0.071). The stereotype is not supported. (4/10 -- interesting for being null)

8. **Narcissism is a near-zero predictor of kink** (all |r| < 0.07). Exception: among non-straight women, narcissism correlates with exhibitionism (r = 0.23-0.35). (5/10)

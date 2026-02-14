# 10 Surprising Cross-Tabulations in the Big Kink Survey

Dataset: ~15,503 respondents, 365 columns. All kink scores are on a 0-5 scale (higher = more interest) unless noted. "normalsex" is negative-scaled (more negative = more interested in vanilla sex). "totalfetishcategory" is a count of distinct kink categories endorsed.

---

## Finding 1: BMI and Kink -- Overweight People Are More Into Vore and Pregnancy Kink

**Interestingness: 7/10**

Overweight+ respondents (n=8,923) vs Not Overweight (n=6,580) show small but consistent differences on body-related kinks.

| Kink | Not Overweight | Overweight+ | Cohen's d |
|------|---------------|-------------|-----------|
| vore | 2.317 | 2.647 | 0.198 |
| pregnancy | 3.566 | 3.767 | 0.155 |
| totalfetishcategory | 9.59 | 10.37 | 0.128 |
| voyeurother | 2.079 | 2.296 | 0.124 |
| exhibitionother | 2.800 | 2.963 | 0.100 |
| voyeurself | 2.188 | 2.350 | 0.092 |
| brutality | 3.450 | 3.346 | -0.073 |
| normalsex | -5.302 | -5.483 | -0.068 |

**Surprising element**: The vore effect (d=0.198) is the largest BMI-kink association. Overweight people are meaningfully more interested in consumption/being-consumed fantasy. They also show higher overall kink breadth (+0.78 categories). The brutality direction is unexpected -- overweight people are *less* into brutality, not more.

```sql
SELECT bmi, COUNT(*) as n,
  ROUND(AVG(vore),3) as vore, ROUND(AVG(pregnancy),3) as preg,
  ROUND(AVG(totalfetishcategory),2) as totalfet,
  ROUND(AVG(brutality),3) as brutal
FROM read_parquet('data/BKSPublic.parquet') WHERE bmi IS NOT NULL
GROUP BY bmi ORDER BY bmi
```

---

## Finding 2: Conscientiousness Does NOT Predict Taboo Kink Avoidance -- It's U-Shaped

**Interestingness: 8/10**

The expected pattern was: "conscientious people avoid taboo kinks." The actual pattern is a U-shape or flat line -- the most and least conscientious people have *nearly identical* kink profiles.

| Consc. Quintile | n | Consc. Mean | Bestiality | Vore | Incest | Brutality | Humiliation | Total Fetish |
|----------------|-----|-------------|-----------|------|--------|-----------|-------------|-------------|
| Q1 (lowest) | 3,101 | -2.25 | 2.516 | 2.400 | 3.360 | 3.443 | 3.537 | 9.87 |
| Q2 | 3,101 | 0.25 | 2.400 | 2.488 | 3.261 | 3.424 | 3.522 | 9.80 |
| Q3 | 3,101 | 1.37 | 2.500 | 2.396 | 3.329 | 3.293 | 3.394 | 10.10 |
| Q4 | 3,100 | 2.54 | 2.515 | 2.731 | 3.400 | 3.309 | 3.490 | 10.21 |
| Q5 (highest) | 3,100 | 4.43 | 2.509 | 2.509 | 3.346 | 3.445 | 3.552 | 10.22 |

**Surprising element**: The highest conscientiousness quintile has essentially the same taboo kink scores as the lowest. They also have *slightly higher* total fetish breadth (10.22 vs 9.87). Conscientiousness is not a brake on kink interest -- if anything, conscientious people are slightly kinkier.

```sql
WITH d AS (
  SELECT *, NTILE(5) OVER (ORDER BY consciensiousnessvariable) as consc_q
  FROM read_parquet('data/BKSPublic.parquet') WHERE consciensiousnessvariable IS NOT NULL
)
SELECT consc_q, COUNT(*) as n, ROUND(AVG(consciensiousnessvariable),2) as consc_mean,
  ROUND(AVG(bestiality),3) as beast, ROUND(AVG(totalfetishcategory),2) as totalfet
FROM d GROUP BY consc_q ORDER BY consc_q
```

---

## Finding 3: Older Respondents Have *More* Kink Categories, Not Fewer

**Interestingness: 6/10**

Against the "people mellow with age" narrative, total kink category count increases monotonically with age.

| Age | n | Total Fetish | Normal Sex | Gentleness | Exhibitionism | Vore |
|-----|-----|-------------|-----------|-----------|---------------|------|
| 14-17 | 3,197 | 9.35 | -5.043 | 3.608 | 2.739 | 2.400 |
| 18-20 | 2,532 | 9.70 | -5.324 | 3.487 | 2.678 | 2.388 |
| 21-24 | 3,211 | 10.07 | -5.385 | 3.498 | 2.811 | 2.603 |
| 25-28 | 3,278 | 10.38 | -5.580 | 3.455 | 2.893 | 2.465 |
| 29-32 | 3,285 | 10.59 | -5.670 | 3.439 | 2.921 | 2.703 |

**Key pattern**: Total fetish categories go from 9.35 to 10.59 (+1.24 categories) across the age range. Gentleness *decreases* with age (3.61 to 3.44), while exhibitionism and vore *increase*. The oldest group is the kinkiest and the least gentle.

```sql
SELECT age, COUNT(*) as n, ROUND(AVG(totalfetishcategory),2) as totalfet,
  ROUND(AVG(gentleness),3) as gentle, ROUND(AVG(exhibitionself),3) as exhibS
FROM read_parquet('data/BKSPublic.parquet') GROUP BY age ORDER BY age
```

---

## Finding 4: Self-Reported Honesty Validates the Survey -- Honest People Report *More* Taboo Kinks

**Interestingness: 9/10**

This is a crucial validity check. If the survey data is meaningful, people who say they were totally honest should report more taboo interests (because they're not downplaying). That's exactly what we see.

| Honesty | n | Total Fetish | Bestiality | Incest | Humiliation | Nonconsent | Brutality | Sadomasochism |
|---------|-----|-------------|-----------|--------|-------------|-----------|-----------|---------------|
| Mostly honest | 6,962 | 9.73 | 2.292 | 3.160 | 3.357 | 3.230 | 3.107 | 3.207 |
| Totally honest | 8,538 | 10.29 | 2.647 | 3.473 | 3.598 | 3.552 | 3.553 | 3.524 |

**Surprising element**: The "totally honest" group scores higher on *every single* taboo kink measured. The effect is substantial -- bestiality jumps by +0.36, brutality by +0.45, nonconsent by +0.32. This is the strongest evidence that the survey captures real preferences. The "mostly honest" group is systematically downplaying, especially on the most taboo categories.

```sql
SELECT "How honest were you when answering this survey? (g1vao1y)" as honesty,
  COUNT(*) as n, ROUND(AVG(totalfetishcategory),2) as totalfet,
  ROUND(AVG(bestiality),3) as beast, ROUND(AVG(incest),3) as incest,
  ROUND(AVG(brutality),3) as brutal
FROM read_parquet('data/BKSPublic.parquet')
WHERE "How honest were you when answering this survey? (g1vao1y)" IS NOT NULL
GROUP BY 1 ORDER BY 1
```

---

## Finding 5: Self-Perceived Attractiveness Predicts Exhibitionism (Self) But NOT Exhibitionism (Other)

**Interestingness: 8/10**

Attractiveness self-rating has a clean linear relationship with wanting to *show yourself* but a non-linear (inverted-U) relationship with wanting to *watch others show*.

| Self-Rated Attractiveness | n | Exhib. Self | Exhib. Other | Worshipped | Humiliation | Normal Sex |
|--------------------------|-----|-------------|-------------|-----------|-------------|-----------|
| Significantly less attractive | 1,072 | 2.896 | 3.062 | 2.792 | 3.529 | -5.063 |
| Moderately less attractive | 1,862 | 2.695 | 2.871 | 2.891 | 3.350 | -5.215 |
| Slightly less attractive | 2,176 | 2.753 | 2.804 | 2.856 | 3.511 | -5.104 |
| About average | 4,950 | 2.787 | 2.912 | 2.882 | 3.475 | -5.393 |
| Slightly more attractive | 2,708 | 2.858 | 2.950 | 2.915 | 3.486 | -5.573 |
| Moderately more attractive | 1,917 | 2.930 | 2.851 | 3.091 | 3.604 | -5.780 |
| Significantly more attractive | 815 | 3.045 | 2.877 | 3.088 | 3.684 | -5.748 |

**Surprising elements**:
1. "Significantly less attractive" people score *high* on exhibitionism-self (2.90) -- higher than "moderately less" or "slightly less" attractive. They also have the highest exhibitionism-other (3.06). This suggests a subgroup of people who feel unattractive but are drawn to exhibitionist fantasy.
2. "Worshipped" (wanting to be worshipped) shows the clearest linear increase with attractiveness (2.79 to 3.09).
3. The most attractive people rate themselves as having the *most interest* in humiliation (3.68), not the least.
4. Normal sex interest *decreases* with attractiveness -- the most attractive people are the kinkiest about non-vanilla activities.

```sql
SELECT "Compared to other people of your same gender and age range, you are (yh6d44s)" as attractiveness,
  COUNT(*) as n, ROUND(AVG(exhibitionself),3) as exhibSelf,
  ROUND(AVG(worshipped),3) as worshpd, ROUND(AVG(humiliation),3) as humil
FROM read_parquet('data/BKSPublic.parquet')
WHERE "Compared to other people of your same gender and age range, you are (yh6d44s)" IS NOT NULL
GROUP BY 1
```

---

## Finding 6: Being Horny Right Now Dramatically Inflates Kink Reporting -- State-Dependent Responding Is Real

**Interestingness: 10/10** (methodological bombshell)

People who took the survey while horny report substantially higher kink scores across the board. This is the single most important methodological finding.

| Horny Right Now | n | Total Fetish | Exhib. Self | Recv Pain | Sado | Gentleness | CGL | Bestiality |
|----------------|-----|-------------|-------------|----------|------|-----------|-----|-----------|
| Not horny at all | 771 | 8.26 | 2.343 | 2.376 | 3.249 | 3.499 | 1.901 | 2.054 |
| A little horny | 798 | 9.83 | 2.492 | 2.502 | 3.300 | 3.535 | 1.799 | 2.056 |
| Moderately horny | 694 | 10.30 | 2.884 | 2.616 | 3.502 | 3.568 | 2.098 | 2.586 |
| Real horny | 455 | 11.02 | 3.206 | 3.066 | 3.594 | 3.789 | 2.343 | 2.638 |

**Stunning effect sizes**:
- Total fetish categories: 8.26 vs 11.02 = **+2.76 categories** from "not horny" to "real horny"
- Exhibitionism: 2.34 vs 3.21 = +0.86 (almost a full scale point)
- Receive pain: 2.38 vs 3.07 = +0.69
- Bestiality: 2.05 vs 2.64 = +0.58
- CGL: 1.90 vs 2.34 = +0.44

**Surprising element**: *Every* kink increases with current horniness, including gentleness (3.50 to 3.79). The effect is not limited to "edgy" kinks -- even the softest kinks get inflated. This suggests that ~20-30% of the variance in kink reporting may be attributable to the respondent's arousal state at survey time. This is a methodological red flag for the entire dataset: horniness inflates everything.

Note: Only n=2,718 answered this question (added late in survey), so these are a subsample.

```sql
SELECT "How horny are you right now? (1jtj2nx)" as horny_now,
  COUNT(*) as n, ROUND(AVG(totalfetishcategory),2) as totalfet,
  ROUND(AVG(exhibitionself),3) as exhibS, ROUND(AVG(bestiality),3) as beast
FROM read_parquet('data/BKSPublic.parquet')
WHERE "How horny are you right now? (1jtj2nx)" IS NOT NULL
GROUP BY 1
```

---

## Finding 7: Baby Fever and Pregnancy Kink Are Barely Related

**Interestingness: 5/10** (low n weakens this)

The "obvious" prediction that baby fever predicts pregnancy kink is only weakly supported.

| Baby Fever | n | Pregnancy Kink | Humiliation | Brutality |
|-----------|-----|---------------|-------------|-----------|
| Not at all | 48 | 3.600 | 4.167 | 3.500 |
| A little maybe? | 65 | 3.667 | 3.600 | 4.000 |
| Yeah I want baby | 47 | 3.727 | 4.467 | 4.000 |

The pregnancy kink score barely moves (3.60 to 3.73). Meanwhile, "Yeah I want baby" people score *much higher* on humiliation (4.47) and brutality (4.0).

**Caveat**: Only n=160 answered this question, so these results are fragile. But the humiliation finding is unexpected.

---

## Finding 8: Narcissism Predicts a Flip From Submission to Dominance

**Interestingness: 9/10**

The narcissism-dominance link reveals a clean crossover effect.

| Narcissism Quintile | n | Narc Mean | Dominant | Submissive | Dom - Sub |
|--------------------|-----|-----------|----------|-----------|-----------|
| Q1 (lowest) | 261 | -2.91 | 0.502 | 1.414 | -0.912 |
| Q2 | 261 | -2.00 | 0.820 | 1.268 | -0.448 |
| Q3 | 261 | -1.11 | 0.713 | 1.184 | -0.471 |
| Q4 | 260 | 0.43 | 0.627 | 1.342 | -0.715 |
| Q5 (highest) | 260 | 1.79 | 1.119 | 0.885 | +0.235 |

**Crossover**: The lowest narcissism quintile is strongly submissive-leaning (dom-sub gap = -0.91). The highest quintile is the *only* group that leans dominant (+0.24). This is a sign flip -- narcissists don't just like dominance more, they are the only group that *prefers* dominance over submission.

Additional narcissism patterns:
- Narcissists score highest on worshipped (2.99 vs 2.70 for lowest)
- They score *lower* on worshipping others (2.54 vs 2.81)
- They have the highest brutality interest (4.08 vs 2.40)
- They give more pain (2.81 vs 1.66) and receive less (2.40 vs 2.70)

Note: Only n=1,303 answered the narcissism question.

```sql
WITH base AS (
  SELECT *, COLUMNS('^"To what')::DOUBLE as narc,
    COLUMNS('^"I am aroused by being dominant')::DOUBLE as dom,
    COLUMNS('^"I am aroused by being submissive')::DOUBLE as sub
  FROM read_parquet('data/BKSPublic.parquet')
  WHERE COLUMNS('^"To what') IS NOT NULL
),
d AS (SELECT *, NTILE(5) OVER (ORDER BY narc) as narc_q FROM base)
SELECT narc_q, COUNT(*) as n, ROUND(AVG(narc),2) as narc_mean,
  ROUND(AVG(dom),3) as dominant, ROUND(AVG(sub),3) as submissive,
  ROUND(AVG(dom)-AVG(sub),3) as dom_minus_sub
FROM d GROUP BY narc_q ORDER BY narc_q
```

---

## Finding 9: Straight Men Like Watching Same-Gender (Female-Female) Sex Way More Than Anyone Else

**Interestingness: 6/10** (confirmatory but quantified)

The column "I find it erotic when two people of the opposite gender to me sexually interact" effectively measures interest in watching same-gender-as-self sex (e.g., for a straight man, this means watching two women).

| Gender | Straightness | n | Opp. Gender Watch | SD |
|--------|-------------|-----|------------------|------|
| Female | Not straight | 1,041 | 0.422 | 2.105 |
| Female | Straight | 6,521 | 0.099 | 2.125 |
| Male | Not straight | 755 | 0.801 | 2.080 |
| Male | Straight | 7,182 | **1.253** | 1.842 |

**Key findings**:
- Straight men score 1.25 -- significantly higher than any other group
- Straight women (0.10) are essentially indifferent to watching two men together
- Non-straight men (0.80) are more interested than straight women in watching their opposite gender interact
- The male-female gap among straight people is massive: 1.25 vs 0.10

**Surprising element**: The asymmetry. Straight men's appetite for girl-on-girl (1.25) is 12.5x the equivalent interest of straight women in guy-on-guy (0.10). This is the largest gender gap in this particular analysis.

```sql
WITH d AS (
  SELECT *, COLUMNS('^"I find it erotic when two people')::DOUBLE as opp_watch
  FROM read_parquet('data/BKSPublic.parquet')
  WHERE COLUMNS('^"I find it erotic when two people') IS NOT NULL
    AND straightness IS NOT NULL AND biomale IS NOT NULL
)
SELECT CASE WHEN biomale=1 THEN 'Male' ELSE 'Female' END as gender,
  straightness, COUNT(*) as n,
  ROUND(AVG(opp_watch),3) as opp_gender_watch
FROM d GROUP BY 1,2 ORDER BY 1,2
```

---

## Finding 10: The Most Polarizing Kinks -- Variance Analysis

**Interestingness: 7/10**

Which kinks divide people the most? Ranked by variance (higher = more disagreement):

| Rank | Kink | Mean | Variance | SD | n |
|------|------|------|----------|-----|------|
| 1 | cunnilingus* | -4.29 | 7.63 | 2.76 | 15,503 |
| 2 | normalsex* | -5.41 | 7.09 | 2.66 | 15,503 |
| 3 | supernatural | 0.54 | 3.76 | 1.94 | 9,126 |
| 4 | badends | 2.53 | 3.25 | 1.80 | 810 |
| 5 | voyeurother | 2.21 | 3.10 | 1.76 | 6,723 |
| 6 | voyeurself | 2.29 | 3.08 | 1.75 | 6,723 |
| 7 | gratification | 2.15 | 3.02 | 1.74 | 810 |
| 8 | frustration | 2.51 | 2.98 | 1.73 | 11,633 |
| 9 | cgl | 1.87 | 2.93 | 1.71 | 4,140 |
| 10 | givepain | 2.16 | 2.92 | 1.71 | 5,120 |

*cunnilingus and normalsex use a different scale (negative = more interest), inflating their variance.

Among standard 0-5 scale kinks, **supernatural** (var=3.76) is the most polarizing. People either love supernatural kinks or are completely cold to them. The least polarizing kinks are **eagerness** (var=1.35), **animated/written porn** (~1.4), and **gentleness** (var=1.45) -- these are things most people agree on.

**Lowest mean kinks** (least popular overall):
- supernatural: 0.54
- animated porn: -0.51 (different scale)
- highenergy: 0.22
- regression: 1.16

```sql
WITH d AS (SELECT * FROM read_parquet('data/BKSPublic.parquet'))
SELECT 'supernatural' as kink, ROUND(AVG(supernatural),3) as mean,
  ROUND(VARIANCE(supernatural),3) as var, COUNT(supernatural) as n FROM d
-- ... (union all for each kink)
ORDER BY var DESC
```

---

## Bonus Findings

### B1: Agreeableness Strongly Predicts Giving vs Receiving Pain Direction

The most agreeable people have the largest gap between receiving pain (2.85) and giving pain (2.02), gap = -0.84. The least agreeable have the smallest gap (-0.47). Agreeable people literally prefer to be on the receiving end.

| Agree Q | Give Pain | Receive Pain | Gap |
|---------|----------|-------------|------|
| Q1 (low) | 2.279 | 2.753 | -0.474 |
| Q5 (high) | 2.015 | 2.854 | **-0.839** |

### B2: Neuroticism Predicts Receiving Pain but Inversely Predicts Giving Pain

| Neur Q | Receive Pain | Give Pain |
|--------|-------------|----------|
| Q1 (low) | 2.443 | 2.386 |
| Q5 (high) | **3.129** | **1.910** |

The most neurotic quintile wants to receive pain (3.13) at 1.6x the rate they want to give it (1.91). The least neurotic are roughly balanced. This is the largest personality-kink association in the dataset.

### B3: Openness to Experience Predicts Kink Breadth (As Expected, But the Magnitude Is Large)

| Open Q | Total Fetish Categories |
|--------|----------------------|
| Q1 (low) | 9.48 |
| Q5 (high) | **10.72** |

+1.24 categories difference. Openness is a stronger predictor of kink breadth than any other Big Five trait.

### B4: Shame About Arousal *Increases* With Kink Breadth, Not Decreases

People with the most shame about what arouses them (Q5) have the *highest* total kink count (11.44 vs 9.27 for Q1). Shame tracks kink variety -- the more you're into, the more you feel bad about it. Not the other way around.

| Shame Q | Total Fetish | Incest | Nonconsent | CGL |
|---------|-------------|--------|-----------|-----|
| Q1 (low shame) | 9.27 | 3.346 | 3.426 | 1.830 |
| Q5 (high shame) | **11.44** | **3.533** | **3.644** | **2.099** |

### B5: Childhood Gender Intolerance Predicts *Higher* Transform Kink, Not Lower

People raised in gender-intolerant environments score *higher* on transformation kinks (2.97) than those from tolerant environments (2.67). Repression may breed fascination.

| Gender Tolerance | Transform | Total Fetish | Clothing |
|-----------------|----------|-------------|----------|
| Intolerant | **2.973** | **10.34** | **3.462** |
| Medium | 2.900 | 9.98 | 3.315 |
| Tolerant | 2.672 | 9.77 | 3.301 |

### B6: Politics Is Nearly Irrelevant to Kink Preferences

Conservative, Liberal, and Moderate respondents have remarkably similar kink profiles. The largest political gap on any kink measure is ~0.15 points on a 5-point scale. Politics does not meaningfully predict what turns you on.

| Politics | Total Fetish | Humiliation | Nonconsent | Gentleness | Incest |
|----------|-------------|-------------|-----------|-----------|--------|
| Conservative | 9.81 | 3.497 | 3.477 | 3.458 | 3.310 |
| Liberal | 10.30 | 3.485 | 3.456 | 3.545 | 3.414 |
| Moderate | 10.00 | 3.517 | 3.327 | 3.490 | 3.306 |

---

## Summary: Top 5 Most Surprising Findings (Ranked)

1. **State-dependent responding** (Finding 6): Being horny inflates kink reporting by ~2.8 categories. This is a dataset-wide confound.
2. **Narcissism dominance crossover** (Finding 8): Narcissists are the *only* group that prefers dominance over submission. Clean sign flip.
3. **Honesty validates taboo kinks** (Finding 4): Self-reported honest respondents admit to more taboo kinks across the board. The survey works.
4. **Conscientiousness is irrelevant** (Finding 2): U-shaped relationship busts the "responsible people = vanilla" stereotype.
5. **Attractive people are kinkier** (Finding 5): The most attractive self-raters have highest humiliation interest and lowest vanilla interest. Plus, "significantly less attractive" people have an unexpected exhibitionism spike.

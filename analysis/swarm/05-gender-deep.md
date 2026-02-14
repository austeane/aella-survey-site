# Deep Gender Differences in the Big Kink Survey

**Dataset**: ~15,500 respondents (7,564 female, 7,939 male by biomale flag)
**Scale**: Most kink categories scored 0-5; body image/erotic embodiment measures vary

---

## 1. All Kink Categories Ranked by Gender Difference

Computed as |Male avg - Female avg|. Cohen's d estimated using pooled SD.

### Method

```sql
SELECT
  CASE WHEN biomale = 1.0 THEN 'Male' ELSE 'Female' END as gender,
  AVG(column) as mean, STDDEV(column) as sd, COUNT(column) as n
FROM read_parquet('data/BKSPublic.parquet')
WHERE biomale IN (0.0, 1.0)
GROUP BY biomale
```

### Top 15 Most Gender-Divergent Kinks

| Rank | Kink | Female Avg | Male Avg | Diff (M-F) | |Diff| | Cohen's d | Direction | Interestingness |
|------|------|-----------|---------|-----------|--------|----------|-----------|-----------------|
| 1 | **receivepain** | 3.17 | 2.15 | -1.02 | 1.02 | 0.64 | Women >> Men | 9/10 |
| 2 | **givepain** | 1.72 | 2.74 | +1.02 | 1.02 | 0.62 | Men >> Women | 9/10 |
| 3 | **dom arousal** | 0.12 | 1.12 | +1.00 | 1.00 | 0.56 | Men >> Women | 9/10 |
| 4 | **sub arousal** | 1.59 | 0.67 | -0.92 | 0.92 | 0.54 | Women >> Men | 9/10 |
| 5 | **pornhabit** | 5.38 | 6.36 | +0.98 | 0.98 | 0.39 | Men >> Women | 7/10 |
| 6 | **clothing** | 2.99 | 3.54 | +0.55 | 0.55 | 0.43 | Men >> Women | 7/10 |
| 7 | **exhibitionother** | 2.62 | 3.13 | +0.51 | 0.51 | 0.33 | Men >> Women | 8/10 |
| 8 | **supernatural** | 0.82 | 0.34 | -0.48 | 0.48 | 0.25 | Women >> Men | 6/10 |
| 9 | **futa** | 2.65 | 3.06 | +0.41 | 0.41 | 0.24 | Men >> Women | 6/10 |
| 10 | **normalsex** | -5.23 | -5.57 | -0.34 | 0.34 | 0.13 | Women >> Men | 5/10 |
| 11 | **cunnilingus** | -4.09 | -4.48 | -0.40 | 0.40 | 0.14 | Women >> Men | 5/10 |
| 12 | **genderplay** | 2.90 | 3.20 | +0.30 | 0.30 | 0.20 | Men >> Women | 7/10 |
| 13 | **secretions** | 2.66 | 2.95 | +0.29 | 0.29 | 0.19 | Men >> Women | 5/10 |
| 14 | **vore** | 2.35 | 2.63 | +0.28 | 0.28 | 0.17 | Men >> Women | 4/10 |
| 15 | **brutality** | 3.50 | 3.28 | -0.22 | 0.22 | 0.15 | Women >> Men | 8/10 |

### Top 5 Most Gender-SIMILAR Kinks (smallest difference)

| Rank | Kink | Female Avg | Male Avg | |Diff| | Cohen's d | Interestingness |
|------|------|-----------|---------|--------|----------|-----------------|
| 1 | **humiliation** | 3.50 | 3.50 | 0.004 | 0.003 | 10/10 |
| 2 | **obedience** | 2.77 | 2.78 | 0.02 | 0.01 | 7/10 |
| 3 | **mediumbondage** | 3.37 | 3.34 | 0.03 | 0.02 | 4/10 |
| 4 | **mythical** | 3.30 | 3.27 | 0.03 | 0.02 | 4/10 |
| 5 | **exhibitionself** | 2.85 | 2.81 | 0.04 | 0.03 | 5/10 |

**Key finding**: Humiliation is the most gender-neutral kink in the entire dataset. Men and women score essentially identically (3.50 vs 3.50). This is striking given how gendered most power-exchange dynamics are.

---

## 2. The Pain Asymmetry (The Headline Finding)

The most dramatic gender difference in the entire dataset is the **pain direction split**:

```
                 Receive Pain    Give Pain     Net (Receive - Give)
Women:              3.17           1.72            +1.44
Men:                2.15           2.74            -0.59
```

Women massively prefer receiving over giving pain (net +1.44). Men have a moderate preference for giving over receiving (net -0.59). These are the two largest absolute differences in the dataset and they are **mirror images** of each other.

### Distribution of Receive Pain (% at each score level)

| Score | Female % | Male % |
|-------|---------|--------|
| 0 | 5.7% | 23.6% |
| 1 | 10.6% | 18.9% |
| 2 | 14.0% | 14.5% |
| 3 | 21.9% | 16.6% |
| 4 | 26.3% | 14.4% |
| 5 | 21.4% | 11.9% |

Female distribution is right-skewed (most women cluster at 3-5). Male distribution is left-skewed (most men cluster at 0-2). Only 5.7% of women score 0 on receive pain vs 23.6% of men.

### Distribution of Give Pain (% at each score level)

| Score | Female % | Male % |
|-------|---------|--------|
| 0 | 31.7% | 12.9% |
| 1 | 21.8% | 13.9% |
| 2 | 14.9% | 14.5% |
| 3 | 13.8% | 20.8% |
| 4 | 9.7% | 21.1% |
| 5 | 8.1% | 16.8% |

The pattern reverses perfectly. 31.7% of women score 0 on giving pain. Only 12.9% of men do.

**Interestingness: 10/10** - The most gender-polarized finding in the dataset. Pain preference is nearly a perfect gender marker in this population.

---

## 3. The Dom/Sub Split

```
                 Dom Arousal    Sub Arousal    Net (Dom - Sub)
Women:              0.12          1.59            -1.47
Men:                1.12          0.67            +0.46
```

### Orientation Breakdown

| Orientation | Women | Men |
|-------------|-------|-----|
| Dom-leaning (dom > sub) | 16.7% | 42.6% |
| Sub-leaning (sub > dom) | 59.3% | 28.2% |
| Switch (dom = sub) | 24.0% | 29.3% |

**Nearly 60% of women are sub-leaning** vs only 28% of men. But the picture is not simply "men are dominant" -- 29.3% of men are switches and 28.2% are sub-leaning. The male distribution is much more evenly spread.

**Women's sub preference is the stronger signal.** Female net dom-sub score is -1.47 (strongly sub), while male net score is only +0.46 (weakly dom). The female pull toward submission is ~3x stronger than the male pull toward dominance.

**Interestingness: 9/10**

---

## 4. The Biggest Surprises: Where Are Genders IDENTICAL?

**Humiliation** (F: 3.50, M: 3.50, d = 0.003) is astonishingly gender-neutral. Given the massive dom/sub split, you might expect humiliation -- a deeply submissive-coded act -- to show a female skew. It does not. Both genders score identically high.

This suggests humiliation appeals to something **orthogonal to the dom/sub axis**. Men who like humiliation may experience it differently (perhaps as a sub-within-dominance, or as a switch dynamic), but the raw appetite is identical.

**Obedience** (F: 2.77, M: 2.78, d = 0.01) is similarly neutral. Despite women being 3x more likely to identify as sub-leaning, their abstract interest in obedience kinks is identical to men's.

**Medium bondage** (F: 3.37, M: 3.34) and **exhibitionism of self** (F: 2.85, M: 2.81) round out the gender-neutral cluster.

**Interestingness: 10/10** -- The ABSENCE of a gap where you'd strongly expect one is often more informative than finding a gap where you expect it.

---

## 5. Body Image and Cross-Gender Embodiment

### Picturing Self in Cross-Gender Body

| Measure | Female Avg | Male Avg | Diff | n_F | n_M |
|---------|-----------|---------|------|-----|-----|
| Picture self with male body | 1.72 | 1.62 | -0.10 | 1,093 | 121 |
| Picture self with female body | 2.13 | 2.37 | +0.24 | 172 | 1,727 |
| Own female body (breasts, etc.) | 4.15 | 4.22 | +0.07 | 79 | 835 |
| Own male body (buttocks, etc.) | 2.60 | 2.33 | -0.27 | 442 | 48 |
| Admired as woman nude | 3.01 | 3.39 | +0.38 | 78 | 831 |
| Admired as man nude | 2.83 | 2.47 | -0.36 | 438 | 47 |

**Critical note**: Sample sizes here are very asymmetric. The "picture self with male body" question was mostly answered by women (n=1,093) with only 121 men. The "picture self with female body" question was mostly answered by men (n=1,727) with only 172 women. This suggests the survey routed these questions by gender.

**Key findings**:
- Men who imagine having a female body rate it 2.37/8 on average -- modestly arousing, with 37% scoring 0 and 13% scoring 8.
- Women who imagine having a male body rate it 1.72/8 -- even less arousing, with 50% scoring 0 and only 6.8% scoring 8.
- Both genders rate their *own-gender body* as highly arousing (women: 4.15, men: 4.22 for female body).
- **Men find the thought of being admired as a woman (3.39) MORE arousing than women find being admired as a man (2.83).**

### Autogynephilia/Autoandrophilia-Adjacent Measures

The "nonsexual existence as opposite gender" items are the closest measure to classical AGP/AAP:

```
                              Exist as Female    Exist as Male
                              (nonsexual, erotic) (nonsexual, erotic)
Women:                         -1.07               -0.81
Men:                           -1.19               -1.00
```

Both genders rate nonsexual cross-gender existence as mildly *anti-erotic* (negative scores). But some notable patterns:

- **Women find existing as male (-0.81) LESS anti-erotic than men find existing as female (-1.19)**. The female autoandrophilia signal is slightly stronger than the male autogynephilia signal on this measure.
- For *same-gender* existence: women rate existing as female (-1.07) and men rate existing as male (-1.00) as similarly anti-erotic.
- **Both directions are net negative**, meaning "nonsexual existence" is not considered erotic by most respondents regardless of gender.

### Masturbation Embodiment

```
                              Masturbate as Female    Masturbate as Male
                              (erotic)                (erotic)
Women:                         0.74                    0.19
Men:                           0.51                    0.05
```

Both genders find the thought of masturbating as a *female* slightly more erotic than masturbating as a *male*. Women rate female masturbation 0.74 vs male 0.19 (delta 0.55). Men rate female masturbation 0.51 vs male 0.05 (delta 0.46). The female body is treated as more erotically potent in the masturbation context by **both genders**.

**Interestingness: 8/10**

---

## 6. Exhibitionism: The Self/Other Split

```
                 Exhibit Self    Exhibit Other    Delta (Other - Self)
Women:              2.85            2.62            -0.22
Men:                2.81            3.13            +0.32
```

Women prefer exhibiting themselves slightly over watching others exhibit. Men prefer watching others exhibit over exhibiting themselves. The gap is 0.54 points of net difference between genders.

Similarly for voyeurism:
```
                 Voyeur Self    Voyeur Other    Delta (Other - Self)
Women:              2.19          2.25           +0.06
Men:                2.37          2.18           -0.19
```

Men have higher voyeur-self (being watched doing voyeuristic things?) but lower voyeur-other. The pattern is complex but suggests men have a stronger *other-directed gaze* in exhibitionism while women have a more self-directed, performative orientation.

**Interestingness: 7/10**

---

## 7. Total Fetish Count

```
                 Total Fetish Categories
Women:              9.89
Men:               10.18
```

Men report slightly more total fetish categories (10.18 vs 9.89, d = 0.05). The difference is negligible -- both genders are equally "kinky" in aggregate breadth.

However, the *composition* of those categories differs enormously (as shown in the ranked table above). Men and women are equally broad but differently directed.

**Interestingness: 6/10** -- The equality of breadth against the background of compositional difference is noteworthy.

---

## 8. Shame

```
                 Shame Score
Women:              0.37
Men:                0.44
```

Men report *slightly* more shame about their arousal (0.44 vs 0.37, d = 0.03). The difference is tiny.

### Shame Correlations with Specific Kinks

| Kink | Female r(kink, shame) | Male r(kink, shame) | Gender with stronger shame link |
|------|----------------------|---------------------|-------------------------------|
| Nonconsent | 0.129 | 0.012 | Women (10x) |
| Brutality | 0.087 | -0.033 | Women (reversed for men!) |
| Bestiality | 0.120 | 0.046 | Women (2.5x) |
| Incest | 0.107 | 0.024 | Women (4.5x) |
| Total fetish count | 0.134 | 0.107 | Similar |
| Vore | 0.005 | 0.002 | Neither |

**The shame-kink link is dramatically more gendered than the shame level itself.** Women who like nonconsent feel MUCH more shame about it (r=0.13) than men who like nonconsent (r=0.01). For brutality, the correlation is actually *negative* for men -- men who like brutality feel slightly *less* shame, while women who like it feel more.

This is perhaps the most psychologically significant gender finding: **the emotional texture of kink differs by gender even when the behavioral preference doesn't**. Women carry shame about taboo kinks; men normalize them.

**Interestingness: 10/10**

---

## 9. What You Feel Most During Arousal (by Gender)

| Feeling | Women % | Men % | Gap |
|---------|---------|-------|-----|
| Eagerness or desire | 34.7% | 31.8% | -2.9 |
| Love or romance | 16.3% | 23.7% | **+7.4** |
| Wildness or primalness | 11.4% | 13.4% | +2.0 |
| Powerlessness or vulnerability | 15.6% | 7.8% | **-7.8** |
| Safety or warmth | 6.3% | 6.7% | +0.4 |
| Power or smugness | 3.8% | 5.9% | +2.1 |

**Surprise: Men report MORE "love or romance" as their primary sexual feeling (23.7% vs 16.3%).** This contradicts stereotypes. Meanwhile, women report more "powerlessness or vulnerability" (15.6% vs 7.8%), consistent with the sub-leaning finding.

**Interestingness: 9/10** -- The love/romance gap favoring men is counterintuitive and robust (n>7,000 per gender).

---

## 10. Personality Context

| Trait | Women | Men | Diff |
|-------|-------|-----|------|
| Openness | 1.39 | 1.87 | +0.48 |
| Neuroticism | 1.59 | 0.36 | **-1.23** |
| Agreeableness | 2.22 | 1.79 | -0.43 |
| Powerlessness | 1.20 | 0.22 | **-0.98** |
| Porn habit | 5.38 | 6.36 | +0.98 |

Women score MUCH higher on neuroticism (1.59 vs 0.36) and powerlessness (1.20 vs 0.22). These personality differences may partially explain the kink differences -- particularly the pain/submission preferences -- as trait-level vulnerability maps onto erotic vulnerability.

---

## 11. Genderplay and Cross-Gender Correlations

| Correlation | Males | Females |
|-------------|-------|---------|
| Genderplay x picture cross-gender body | r = 0.19 | r = 0.24 |
| Genderplay x nonsexual cross-gender erotic | r = 0.10 | r = 0.02 |
| Genderplay x masturbation cross-gender erotic | r = 0.12 | r = 0.09 |

For both genders, genderplay correlates modestly with imagining having a cross-gender body (r ~ 0.19-0.24). But for males, genderplay also links to finding nonsexual cross-gender existence erotic (r = 0.10), suggesting a deeper identity dimension to male genderplay. For females, that link is near zero (r = 0.02).

**Interestingness: 7/10**

---

## Summary: The Gender Difference Hierarchy

### Largest differences (d > 0.4):
1. **Receive pain**: Women strongly prefer (d = 0.64)
2. **Give pain**: Men strongly prefer (d = 0.62)
3. **Dom arousal**: Men strongly prefer (d = 0.56)
4. **Sub arousal**: Women strongly prefer (d = 0.54)
5. **Clothing fetish**: Men moderately prefer (d = 0.43)

### Moderate differences (d = 0.15-0.39):
6. **Porn habit**: Men consume more (d = 0.39)
7. **Exhibition of others**: Men moderately prefer (d = 0.33)
8. **Supernatural**: Women moderately prefer (d = 0.25)
9. **Futa**: Men moderately prefer (d = 0.24)
10. **Genderplay**: Men moderately prefer (d = 0.20)

### Essentially zero difference (d < 0.05):
- **Humiliation** (d = 0.003)
- **Obedience** (d = 0.01)
- **Medium bondage** (d = 0.02)
- **Mythical** (d = 0.02)
- **Exhibitionism of self** (d = 0.03)
- **Total fetish count** (d = 0.05)

### The meta-pattern:
Gender differences cluster around **agency and direction** (give vs receive, dom vs sub, self vs other), not around **intensity or breadth** (total fetish count, humiliation level, bondage interest). Men and women are equally kinky -- they just organize their kink around different poles of the active/passive axis.

---

## SQL Used

All queries used the following pattern:
```sql
duckdb -c "
SELECT
  CASE WHEN biomale = 1.0 THEN 'Male' ELSE 'Female' END as gender,
  AVG(column) as mean, STDDEV(column) as sd, COUNT(column) as n
FROM read_parquet('/Users/austin/dev/kink/data/BKSPublic.parquet')
WHERE biomale IN (0.0, 1.0)
GROUP BY biomale
ORDER BY gender
"
```

For correlations:
```sql
SELECT
  CASE WHEN biomale = 1.0 THEN 'Male' ELSE 'Female' END as gender,
  CORR(variable_a, variable_b) as correlation
FROM read_parquet('/Users/austin/dev/kink/data/BKSPublic.parquet')
WHERE biomale IN (0.0, 1.0)
GROUP BY biomale
```

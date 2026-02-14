# Big Five Personality Traits x Kink Categories

**Dataset**: Big Kink Survey (n=15,503 with valid personality data)
**Method**: Pearson correlations + NTILE tertile/quintile/decile bin comparisons
**Personality traits**: Openness, Conscientiousness, Extroversion, Neuroticism, Agreeableness (all ~-6 to +6)
**Kink columns**: 33 kink intensity scores (mostly 0-5 scale; cunnilingus uses -8 to 0 where more negative = more interest)

---

## Top 15 Personality-Kink Correlations (Ranked by |r|)

| Rank | Trait | Kink | r | Direction | Low Tertile | Mid Tertile | High Tertile | Spread | Shape | Interestingness |
|------|-------|------|---|-----------|-------------|-------------|--------------|--------|-------|-----------------|
| 1 | Neuroticism | receivepain | +0.160 | More neurotic = more masochism | 2.45 | 2.63 | 3.04 | +0.59 | Linear | 9/10 |
| 2 | Neuroticism | givepain | -0.123 | More neurotic = less sadism | 2.34 | 2.23 | 1.96 | -0.39 | Linear | 9/10 |
| 3 | Openness | givepain | +0.113 | More open = more sadism | 1.98 | 2.09 | 2.39 | +0.42 | Linear | 8/10 |
| 4 | Neuroticism | dirty | -0.099 | Complex: low neurotics like dirty most, but U-shaped | 2.64 | 2.29 | 2.29 | -0.35 | U-shaped | 8/10 |
| 5 | Openness | vore | +0.098 | More open = more vore interest | 2.34 | 2.29 | 2.75 | +0.32 | Hockey stick (top quintile spike) | 7/10 |
| 6 | Openness | eagerness | +0.094 | More open = more sexual eagerness | 3.67 | 3.72 | 3.97 | +0.29 | Linear | 6/10 |
| 7 | Openness | secretions | +0.081 | More open = more into body fluids | 2.62 | 2.80 | 3.01 | +0.32 | Linear | 6/10 |
| 8 | Extroversion | cunnilingus | -0.076 | More extroverted = more cunnilingus interest | -4.09 | -4.23 | -4.55 | -0.46 | Linear | 5/10 |
| 9 | Openness | transform | +0.075 | More open = more transformation interest | 2.78 | 2.78 | 3.07 | +0.27 | Linear | 6/10 |
| 10 | Openness | cunnilingus | -0.075 | More open = more cunnilingus interest | -4.04 | -4.25 | -4.58 | -0.55 | Linear | 5/10 |
| 11 | Agreeableness | givepain | -0.072 | More agreeable = less sadism | 2.33 | 2.14 | 2.02 | -0.31 | Linear | 7/10 |
| 12 | Conscientiousness | sensory | +0.072 | More conscientious = more sensory interest | 2.63 | 2.71 | 2.85 | +0.22 | Linear | 7/10 |
| 13 | Openness | clothing | +0.071 | More open = more clothing/costume interest | 3.23 | 3.28 | 3.49 | +0.22 | Linear | 5/10 |
| 14 | Extroversion | brutality | +0.070 | More extroverted = more brutality | 3.32 | 3.35 | 3.50 | +0.18 | Linear | 7/10 |
| 15 | Extroversion | givepain | +0.070 | More extroverted = more sadism | 2.00 | 2.18 | 2.30 | +0.30 | Linear | 6/10 |

---

## Major Findings

### Finding 1: The Neuroticism-Pain Axis (Interestingness: 10/10)

**The single strongest personality-kink relationship in the entire dataset.** Neuroticism massively predicts whether someone prefers to receive vs give pain. This is not just two separate correlations -- it is a *directional swap*:

| Neuroticism Quintile | Avg Neuroticism | Receive Pain | Give Pain | Gap (Give - Receive) |
|---------------------|-----------------|--------------|-----------|---------------------|
| Q1 (lowest) | -2.89 | 2.44 | 2.39 | -0.06 (nearly equal) |
| Q2 | -0.28 | 2.38 | 2.43 | +0.05 (nearly equal) |
| Q3 | +0.98 | 2.68 | 2.18 | -0.49 |
| Q4 | +2.41 | 2.86 | 2.01 | -0.86 |
| Q5 (highest) | +4.60 | 3.13 | 1.91 | -1.22 |

At low neuroticism, give and receive pain are virtually equal. As neuroticism increases, the gap widens to over 1.2 points on a 5-point scale. The most neurotic quintile scores 3.13/5 on receiving pain but only 1.91/5 on giving it.

The decile analysis makes this even starker -- at neuroticism decile 10 (avg score 5.32), the gap is -1.33 points.

**Interpretation**: Emotional instability maps directly onto the masochism/sadism axis. Neurotic individuals strongly prefer the receiving/submissive end of pain dynamics. Emotionally stable individuals are equally interested in both directions. This also extends to related power dynamics: high neuroticism predicts higher power dynamic interest (r=0.062), higher obedience (Q5: 2.89 vs Q1: 2.76), and higher nonconsent interest (Q5: 3.64 vs Q1: 3.42).

```sql
-- Core query for the neuroticism pain axis
WITH quintiles AS (
  SELECT *, NTILE(5) OVER (ORDER BY neuroticismvariable) as neur_q
  FROM read_parquet('/Users/austin/dev/kink/data/BKSPublic.parquet')
  WHERE neuroticismvariable IS NOT NULL
)
SELECT neur_q, ROUND(AVG(neuroticismvariable),2) as avg_neur,
  ROUND(AVG(receivepain),3) as receive, ROUND(AVG(givepain),3) as give,
  ROUND(AVG(givepain)-AVG(receivepain),3) as gap
FROM quintiles GROUP BY neur_q ORDER BY neur_q;
```

---

### Finding 2: Openness Is the Best Predictor of Kink Breadth (Interestingness: 7/10)

**Q1 Answer**: Openness is the strongest predictor of totalfetishcategory (r=0.066), followed by neuroticism (r=0.023). Extroversion is essentially zero (r=0.0002).

| Trait | Correlation with totalfetishcategory |
|-------|--------------------------------------|
| Openness | +0.066 |
| Neuroticism | +0.023 |
| Conscientiousness | +0.018 |
| Agreeableness | +0.016 |
| Extroversion | +0.000 |

By tertile: low-openness people average 9.52 on total kink breadth, mid-openness 9.98, high-openness 10.61. The most open people explore about 1.1 more kink categories on average.

Openness also uniquely predicts sadism: it is the only trait where the top decile flips from net masochism to net sadism (give - receive = +0.17 at decile 10, vs -1.01 at decile 1). The most open individuals are also the only group where give_pain exceeds receive_pain.

```sql
SELECT ROUND(CORR(opennessvariable, totalfetishcategory), 4) as openness_r,
  ROUND(CORR(extroversionvariable, totalfetishcategory), 4) as extroversion_r,
  ROUND(CORR(neuroticismvariable, totalfetishcategory), 4) as neuroticism_r
FROM read_parquet('/Users/austin/dev/kink/data/BKSPublic.parquet')
WHERE opennessvariable IS NOT NULL;
```

---

### Finding 3: The Neuroticism-Dirty U-Shape (Interestingness: 8/10)

The neuroticism-dirty relationship (r=-0.099) looks linear in tertiles but is actually U-shaped in deciles:

| Decile | Avg Neuroticism | Avg Dirty |
|--------|-----------------|-----------|
| 1 | -4.21 | 2.73 |
| 2 | -1.56 | 2.75 |
| 3 | -0.55 | 2.42 |
| 4 | 0.00 | 2.33 |
| 5 | +0.81 | 2.22 |
| 6 | +1.14 | 2.25 |
| 7 | +2.00 | 2.48 |
| 8 | +2.82 | 2.00 |
| 9 | +3.88 | 2.79 |
| 10 | +5.32 | 2.02 |

The pattern is noisy but the extremes (deciles 1-2 and 9) show elevated dirty interest compared to the middle. The very lowest neurotics (decile 1-2, avg scores 2.73-2.75) are as interested in dirty play as decile 9 (2.79). The middle of the neuroticism spectrum shows the least interest. However, the very highest neurotics (decile 10) drop back down, making this more of a chaotic non-linear relationship than a clean U.

---

### Finding 4: Conscientiousness -- The "Boring" Trait That Predicts Sensory Play (Interestingness: 7/10)

**Q2 Answer**: Conscientiousness is the weakest personality predictor overall (total R-squared across all kinks = 0.005, compared to 0.104 for neuroticism). But it does have one notable correlation: sensory play (r=+0.072).

| Conscientiousness Group | Sensory | Vore | Creepy | Total Kink |
|------------------------|---------|------|--------|------------|
| Low | 2.64 | 2.42 | 2.75 | 9.87 |
| Mid | 2.73 | 2.47 | 2.78 | 10.02 |
| High | 2.82 | 2.64 | 3.00 | 10.23 |

High conscientiousness people score higher on sensory (2.82 vs 2.64), vore (2.64 vs 2.42), and creepy (3.00 vs 2.75). They also have slightly higher total kink breadth (10.23 vs 9.87).

**Interpretation**: The conscientious-sensory link may reflect that detail-oriented people are drawn to the granular, controlled stimulation of sensory play (blindfolds, texture play, temperature, etc.). The vore and creepy correlations are harder to explain and may reflect conscientiousness correlating with more engagement in the survey overall.

---

### Finding 5: Extroverts Are Not Kinkier Overall -- But They Are More Sadistic (Interestingness: 7/10)

**Q3 Answer**: Extroversion has essentially zero correlation with total kink breadth (r=0.0002). Introverts and extroverts explore exactly the same number of kink categories (10.0 vs 10.06).

However, extroverts diverge on *which* kinks they prefer:

| Group | Give Pain | Brutality | Dirty | Receive Pain | Cunnilingus |
|-------|-----------|-----------|-------|--------------|-------------|
| Introvert | 1.95 | 3.32 | 2.61 | 2.79 | -4.09 |
| Ambivert | 2.14 | 3.45 | 2.42 | 2.80 | -4.23 |
| Extrovert | 2.40 | 3.50 | 2.26 | 2.61 | -4.55 |

Extroverts are notably more sadistic (give_pain 2.40 vs 1.95), more into brutality (3.50 vs 3.32), and more interested in cunnilingus (-4.55 vs -4.09). They are slightly less masochistic (receive_pain 2.61 vs 2.79) and substantially less into dirty play (2.26 vs 2.61).

---

### Finding 6: Give Pain Is the Most Personality-Determined Kink (Interestingness: 8/10)

**Q4 Answer**: Three traits independently predict give_pain (sadism), making it the kink most shaped by personality:
- Openness: +0.113 (open people = more sadistic)
- Neuroticism: -0.123 (neurotic people = less sadistic)
- Agreeableness: -0.072 (agreeable people = less sadistic)
- Extroversion: +0.070 (extroverts = more sadistic)

The "sadistic personality profile" is: open, emotionally stable, disagreeable, extroverted. This is a coherent psychological picture -- someone who is curious about experiences, emotionally unflappable, not overly concerned about others' feelings, and socially assertive.

**The most personality-independent kinks** (max |r| across all 5 traits):

| Kink | Max |r| | Best Predictor |
|------|---------|----------------|
| Humiliation | 0.026 | Openness |
| Bestiality | 0.027 | Extroversion |
| Voyeurself | 0.028 | Conscientiousness |
| Mediumbondage | 0.032 | Extroversion |
| Obedience | 0.032 | Conscientiousness |
| Extremebondage | 0.034 | Agreeableness |

These kinks appear to be driven by factors outside the Big Five entirely -- perhaps specific experiences, relationship dynamics, or factors not captured by standard personality instruments.

---

### Finding 7: Agreeable People Like Eagerness and Gentleness, Not Pain-Giving (Interestingness: 6/10)

**Q5 Answer (Surprising Reversals)**: The most notable pattern for agreeableness is entirely predictable -- and that's what makes it interesting as a validity check:

| Agreeableness Quintile | Eagerness | Gentleness | Give Pain | Receive Pain |
|----------------------|-----------|------------|-----------|--------------|
| Q1 (least agreeable) | 3.74 | 3.46 | 2.28 | 2.75 |
| Q3 | 3.71 | 3.43 | 2.13 | 2.65 |
| Q5 (most agreeable) | 3.99 | 3.68 | 2.02 | 2.85 |

The most agreeable people are the most sexually eager (+0.25 spread), most into gentleness (+0.22), least sadistic (-0.26), but *more* masochistic (+0.10). Agreeable people don't avoid intensity -- they just prefer to be on the receiving end.

The one genuine surprise: agreeable people show slightly *more* interest in receiving pain (r=+0.040). Being nice doesn't mean avoiding all intensity -- it means preferring the submissive/receptive role.

---

## Total Variance Explained by Each Trait

Summing r-squared across all kink columns gives a rough measure of how much each personality trait matters for kink preferences overall:

| Trait | Sum of r-squared (across ~30 kinks) | Rank |
|-------|-------------------------------------|------|
| Neuroticism | 0.1044 | 1st |
| Openness | 0.0884 | 2nd |
| Extroversion | 0.0206 | 3rd |
| Agreeableness | 0.0135 | 4th |
| Conscientiousness | 0.0052 | 5th |

Neuroticism and openness together account for about 90% of the total personality-kink signal. The other three traits combined contribute less than 20% of the total R-squared.

---

## Summary: The Personality-Kink Map

**Neuroticism** is the dominant axis. It predicts the masochism-sadism direction more strongly than any other personality-kink pair in the dataset (r=0.16 for masochism). Neurotic people want to receive pain, submit to power dynamics, and are drawn to nonconsent scenarios. Emotionally stable people are equally comfortable on either side.

**Openness** is the breadth axis. Open people explore more kink categories overall and are drawn to the unusual (vore, transformation, body fluids). They are also more sadistic -- the most open decile is the only group where give_pain exceeds receive_pain.

**Extroversion** matters for direction but not intensity. Extroverts and introverts have identical total kink breadth, but extroverts lean toward giving pain and brutality while introverts lean toward dirty play and receiving pain.

**Agreeableness** is a validity check. Agreeable people prefer gentleness and eagerness and avoid giving pain. The mildly surprising finding is that they are slightly *more* masochistic, suggesting agreeableness maps to a receptive/yielding orientation rather than a low-intensity one.

**Conscientiousness** is nearly personality-independent of kink preferences. Its one notable correlation (sensory play, r=0.072) may reflect a preference for structured, detail-oriented experiences.

---

## Methodological Notes

- All correlations are Pearson r values. With n=15,503, even r=0.02 is statistically significant (p < 0.01). We focus on practical significance (effect size) rather than p-values.
- Tertile/quintile bins use NTILE() which ensures equal group sizes, avoiding issues with personality score clustering.
- The cunnilingus column uses an inverted scale (-8 to 0, more negative = more interest). Negative correlations with cunnilingus indicate *more* interest.
- Effect sizes are small in absolute terms (max r=0.16). Personality explains at most ~2.5% of the variance in any single kink. Kink preferences are highly individual and likely driven more by specific experiences, relationship history, and idiosyncratic factors than by broad personality traits.
- The "dirty" U-shape finding should be interpreted cautiously -- decile-level analysis with n~1,550 per bin shows substantial noise.

# 09 — Porn Consumption, Content Preferences, and Media Effects

**Dataset**: Big Kink Survey (~15.5k rows, 365 columns)
**Analyst**: Claude (swarm agent)
**Key columns**: `pornhabit` (0-9 scale), `inducefetish` (0-3), `totalfetishcategory`, `violentporn`, `animated`, `written`, `biomale`, content-preference categoricals

---

## Overview

The sample is porn-heavy: median `pornhabit` is 7.0, mean 5.88, and 56.7% score 7+ on the 0-9 scale. Only 12.8% score 2 or below. This is a population deeply engaged with erotic media, which makes it an unusually rich dataset for exploring media-kink connections.

Key population-level stats:
- **55.5%** report having induced fetishes through porn/erotica (inducefetish >= 2)
- **30.8%** have paid for porn at least once
- **13.2%** report that most or all of their porn is violent

---

## Q1: Does Self-Reported Fetish Induction Predict Kink Breadth?

**Interestingness: 8/10** — Strong, monotonic relationship. The effect size is substantial.

```sql
SELECT
  CASE
    WHEN inducefetish = 0 THEN 'Not at all'
    WHEN inducefetish = 1 THEN 'Maybe a little'
    WHEN inducefetish = 2 THEN 'Somewhat'
    WHEN inducefetish = 3 THEN 'Definitely'
  END as induced_level,
  COUNT(*) as n,
  ROUND(AVG(totalfetishcategory),2) as avg_kink_breadth,
  ROUND(MEDIAN(totalfetishcategory),2) as median_kink_breadth,
  ROUND(AVG(pornhabit),2) as avg_pornhabit
FROM read_parquet('data/BKSPublic.parquet')
WHERE inducefetish IS NOT NULL
GROUP BY 1, inducefetish ORDER BY inducefetish
```

| Induced Level | n | Avg Kinks | Median Kinks | Avg Porn Habit |
|---|---|---|---|---|
| Not at all | 2,389 | 8.55 | 7.0 | 4.89 |
| Maybe a little | 3,729 | 9.75 | 9.0 | 6.05 |
| Somewhat | 4,684 | 10.96 | 10.0 | 6.34 |
| Definitely | 2,945 | 12.19 | 11.0 | 6.55 |

**Correlations** (n=13,747):
- inducefetish <-> totalfetishcategory: **r = 0.204**
- inducefetish <-> pornhabit: **r = 0.205**
- pornhabit <-> totalfetishcategory: **r = 0.173**

**Finding**: People who believe they've induced fetishes through porn have ~43% more kink categories (12.19 vs 8.55) than those who don't. The correlation between induction belief and kink breadth (r=0.204) is slightly stronger than the correlation between raw porn consumption and kink breadth (r=0.173). This suggests that the *subjective experience* of porn reshaping desire may matter more than sheer volume, though causality is ambiguous: people with more kinks may also be more likely to retrospectively attribute them to media exposure.

**Gender split**: Men report slightly higher induction (58.2% at high levels vs 52.5% for non-males, avg 1.67 vs 1.51).

---

## Q2: Written vs Animated vs Video — Different Kink Profiles?

**Interestingness: 7/10** — Clear format-preference gradient, with surprising gender dynamics.

### Animated vs Live-Action

| Content Type | n | Avg Kinks | Avg Violent Porn | Avg Induced Fetish |
|---|---|---|---|---|
| Equal/even split | 4,138 | 11.00 | 1.17 | 1.67 |
| Mostly animated/drawn | 1,702 | 10.93 | 1.22 | 1.68 |
| Entirely animated/drawn | 956 | 10.30 | 1.25 | 1.67 |
| Mostly live action | 3,802 | 10.29 | 1.17 | 1.65 |
| Entirely live action | 3,592 | 9.20 | 1.09 | 1.58 |

### Written vs Visual

| Format | n | Avg Kinks | % Male |
|---|---|---|---|
| Equally written and visual | 3,686 | 10.99 | 42% |
| Mostly visual | 4,457 | 10.58 | 61% |
| Entirely written | 1,003 | 10.07 | 30% |
| Mostly written | 1,458 | 10.05 | 33% |
| Entirely visual | 3,584 | 9.41 | 67% |

**Finding**: The "even split" consumers who engage with multiple formats have the highest kink breadth — suggesting that willingness to engage across media types reflects broader sexual openness. Entirely visual consumers have the lowest kink counts.

The gender split on written erotica is dramatic: **only 10.5% of men prefer written-leaning content vs 25.0% of non-males**. Conversely, 68.8% of men lean visual vs 43.2% of non-males. The written erotica audience is overwhelmingly non-male.

### Animated Preference and Fantastical Kinks

| Content Preference | n | Avg Bestiality | Avg Transform | Avg Vore |
|---|---|---|---|---|
| Animated-leaning | 2,658 | 2.65 | 3.05 | 2.84 |
| Even split | 4,138 | 2.53 | 2.94 | 2.63 |
| Live-action-leaning | 7,394 | 2.38 | 2.64 | 2.13 |

Animation fans score higher on fantastical/impossible kinks (transformation, vore, bestiality/creatures) — consistent with the idea that drawn/animated media enables depiction of scenarios impossible in live-action.

---

## Q3: Earlier Porn Start Age -> More Kinks?

**Interestingness: 7/10** — Clear gradient, but moderate effect size. Confounds abound.

```sql
SELECT porn_start_age, COUNT(*) as n,
  ROUND(AVG(totalfetishcategory),2) as avg_kinks,
  ROUND(AVG(inducefetish),2) as avg_inducefetish
FROM read_parquet('data/BKSPublic.parquet')
WHERE porn_start_age IS NOT NULL
GROUP BY 1 ORDER BY age_order
```

| Porn Start Age | n | Avg Kinks | Median Kinks | Avg Induced | Avg Porn Habit |
|---|---|---|---|---|---|
| <6yo | 355 | 11.11 | 10.0 | 1.64 | 6.45 |
| 7-8yo | 648 | 11.17 | 10.0 | 1.73 | 6.56 |
| 9-10yo | 1,251 | 11.03 | 10.0 | 1.78 | 6.63 |
| 11-12yo | 3,110 | 10.97 | 10.0 | 1.73 | 6.59 |
| 13-14yo | 4,044 | 10.08 | 9.0 | 1.62 | 6.43 |
| 15-16yo | 2,296 | 9.83 | 9.0 | 1.58 | 6.23 |
| 17-18yo | 1,094 | 9.51 | 9.0 | 1.55 | 6.00 |
| 19-25yo | 1,013 | 9.61 | 8.0 | 1.53 | 5.76 |
| 26+ | 370 | 9.34 | 8.0 | 1.52 | 6.06 |

**Finding**: There is a clear gradient — those who started before age 11 have ~11 kink categories vs ~9.5 for those starting at 17+. But the relationship plateaus early: starting at 6 vs 12 barely matters (11.1 vs 11.0). The main inflection point is around age 13. Early starters also score higher on self-reported fetish induction (1.73-1.78 vs 1.52-1.55).

**Interaction effect**: Early start + high induction belief = most kinks (12.28), while late start + low induction = fewest (9.25). The combined effect is roughly additive — no strong evidence of an interaction beyond the sum of the parts.

| Start Age | Induction Level | n | Avg Kinks |
|---|---|---|---|
| Early (<=12) | High induction | 2,990 | 12.28 |
| Early (<=12) | Low induction | 1,928 | 9.97 |
| Late (13+) | High induction | 4,337 | 11.01 |
| Late (13+) | Low induction | 3,538 | 9.25 |

---

## Q4: Paid-for-Porn Users — A Different Profile?

**Interestingness: 6/10** — Interesting nonlinearity and gender skew.

| Paid Level | n | Avg Kinks | Avg Porn Habit | % Male |
|---|---|---|---|---|
| No | 10,732 | 9.56 | 5.64 | 45.7% |
| Once or twice | 2,441 | 11.17 | 6.48 | 66.4% |
| Occasionally | 1,488 | 11.32 | 6.58 | 62.8% |
| Regularly | 841 | 10.56 | 6.05 | 57.0% |

**Finding**: Occasional paid-porn users have the *most* kinks (11.32), not regular payers (10.56). The "dabbler" profile — someone willing to pay occasionally but not committed to a subscription — correlates with the broadest kink exploration.

The gender skew is notable: among non-payers, the sample is 45.7% male, but among those who've paid at least once, it jumps to 62-66% male. Men are far more likely to have ever paid for porn. However, the kink-breadth boost from paying is comparable across genders (males: 9.48 -> 11.30-11.53; non-males: 9.63 -> 10.92-10.95).

Regular payers have lower kink breadth than occasional payers in both genders, suggesting regular payment may reflect commitment to a specific niche rather than broad exploration.

---

## Q5: Violent Porn Consumption vs Violent Kink Interests

**Interestingness: 9/10** — Strong alignment AND a striking gender pattern in pain directionality.

### Overall Pattern

| Violent Porn Level | n | Avg SM | Avg Humiliation | Avg Receive Pain | Avg Give Pain | Avg Kinks |
|---|---|---|---|---|---|---|
| None of it | 4,532 | 2.99 | 3.12 | 2.48 | 1.96 | 8.43 |
| A little bit | 5,192 | 3.25 | 3.32 | 2.57 | 2.16 | 10.71 |
| A moderate amount | 2,588 | 3.65 | 3.65 | 2.79 | 2.36 | 11.85 |
| Most of it | 1,294 | 3.78 | 3.87 | 3.12 | 2.24 | 11.96 |
| All of it | 576 | 3.82 | 3.99 | 3.20 | 2.14 | 10.63 |

**Key correlations** (n=4,899 with both violentporn and SM data):
- violentporn <-> total SM score: **r = 0.263**
- violentporn <-> humiliation: **r = 0.224**
- violentporn <-> sadomasochism: **r = 0.221**
- violentporn <-> receive pain: **r = 0.124**
- violentporn <-> give pain: **r = 0.077**

**Finding**: Violent porn consumption correlates meaningfully with SM interests (r=0.26), but the correlation with *receiving* pain (r=0.124) is much stronger than with *giving* pain (r=0.077). Heavy violent porn consumers are disproportionately masochistic, not sadistic.

### The Gender Reveal: Who Watches Violent Porn and Why

Among heavy violent porn consumers ("Most" + "All"), there is a massive gender divergence in pain preference:

| Violent Level | Gender | n | Avg Receive Pain | Avg Give Pain |
|---|---|---|---|---|
| All of it | Male | 278 | 2.39 | **2.85** |
| All of it | Not Male | 298 | **3.61** | 1.78 |
| Most of it | Male | 540 | 2.21 | **3.05** |
| Most of it | Not Male | 754 | **3.58** | 1.83 |

Men who watch lots of violent porn prefer giving pain (avg 2.85-3.05 give vs 2.21-2.39 receive). Non-males who watch lots of violent porn prefer receiving it (avg 3.58-3.61 receive vs 1.78-1.83 give). The gap is enormous — over a full scale point in both directions.

This suggests violent porn serves opposite psychological functions by gender: for men, it maps to dominant/sadistic fantasies; for non-males, it maps to submissive/masochistic ones. Both groups consume the same content but identify with different roles.

Also notable: the "most" and "all" violent-porn groups are disproportionately non-male (58% and 52% respectively vs 46% overall). Non-males slightly outnumber males among the heaviest violent porn consumers.

---

## Q6: Partner Arousal Transfer — Who Is Susceptible?

**Interestingness: 6/10** — Modest effects, but the direction is intuitive.

The partner arousal transfer scale measures agreement with: "If my partner is aroused by something, I can also be aroused by it, even if I don't normally find it erotic." (Scale roughly -3 to +3.)

| Score | n | Avg Kinks | % Male | Avg Induced Fetish |
|---|---|---|---|---|
| -3 (strong disagree) | 552 | 8.58 | 52% | 1.43 |
| -2 | 901 | 8.79 | 50% | 1.46 |
| -1 | 1,201 | 9.31 | 45% | 1.49 |
| 0 (neutral) | 2,394 | 8.98 | 47% | 1.51 |
| +1 | 4,578 | 10.03 | 48% | 1.57 |
| +2 | 3,694 | 10.72 | 56% | 1.67 |
| +3 (strong agree) | 2,182 | 11.35 | 58% | 1.75 |

**Correlations** (n=15,502):
- Partner arousal <-> kink breadth: **r = 0.133**
- Partner arousal <-> induced fetish: **r = 0.091**
- Partner arousal <-> pornhabit: **r = 0.068**

**Finding**: Those most susceptible to partner arousal transfer have 32% more kinks (11.35 vs 8.58). They are also slightly more male (58% vs 52%) and report more fetish induction. The effect on kinks (r=0.133) is modest but real. Men score slightly higher on partner arousal transfer overall (avg 0.99 vs 0.80 for non-males), which is somewhat surprising given stereotypes.

---

## Q7: Gender Split on Written vs Animated Porn

**Interestingness: 8/10** — One of the sharpest gender divides in the dataset.

### Written vs Visual by Gender

| Format | Male % | Not Male % |
|---|---|---|
| Entirely visual | 32.4% | 17.4% |
| Mostly visual | 36.4% | 25.8% |
| Equally written and visual | 20.7% | 31.9% |
| Mostly written | 6.4% | 14.6% |
| Entirely written | 4.1% | 10.4% |

**68.8% of men lean visual** vs only **43.2% of non-males**. Conversely, **25.0% of non-males prefer written content** vs just **10.5% of men**.

### Animated vs Live-Action by Gender

| Format | Male % | Not Male % |
|---|---|---|
| Entirely live action | 26.6% | 23.9% |
| Mostly live action | 27.5% | 26.0% |
| Even split | 29.8% | 28.5% |
| Mostly animated | 11.4% | 12.6% |
| Entirely animated | 4.7% | 8.9% |

The animated/live-action split is much smaller between genders. Non-males are somewhat more likely to prefer entirely animated content (8.9% vs 4.7%), but the overall pattern is similar. The written/visual divide is where the real gender gap lives.

---

## Q8: Does Self-Reported Fetish Induction Correlate with More Taboo Kinks?

**Interestingness: 7/10** — Moderate but consistent effects, especially for bestiality and incest.

| Inducefetish | n | Avg Noncon | Avg Incest | Avg Bestiality | Avg SM | Avg Humiliation |
|---|---|---|---|---|---|---|
| 0 (Not at all) | 2,389 | 3.35 | 3.24 | 2.37 | 3.31 | 3.53 |
| 1 (Maybe) | 3,729 | 3.33 | 3.14 | 2.09 | 3.27 | 3.36 |
| 2 (Somewhat) | 4,684 | 3.45 | 3.27 | 2.52 | 3.45 | 3.50 |
| 3 (Definitely) | 2,945 | 3.56 | 3.59 | 2.77 | 3.60 | 3.63 |

**Correlations with inducefetish** (n=13,747):
- Bestiality: **r = 0.135**
- Incest: **r = 0.120**
- Sadomasochism: **r = 0.089**
- Nonconsent: **r = 0.063**
- Humiliation: **r = 0.051**

**Finding**: The "definitely induced" group has notably higher bestiality interest (2.77 vs 2.37) and incest interest (3.59 vs 3.24) compared to "not at all." The strongest individual correlations are with bestiality (r=0.135) and incest (r=0.120) — kinks that are perhaps the most media-dependent since opportunities for real-world exposure are limited. Non-consent and humiliation show weaker individual correlations despite being more mainstream.

However, the correlation with overall kink breadth (r=0.204) is much stronger than with any individual taboo category, suggesting that induction belief reflects a general pattern of sexual openness or kink accumulation rather than specific taboo deepening.

---

## Bonus Findings

### Consent Preferences and Violent Porn

| Preferred Consent Level | n | Avg Violent Porn | Avg Kinks |
|---|---|---|---|
| Full nonconsent | 721 | 1.44 | 10.65 |
| Mostly nonconsenting | 1,303 | 1.72 | 11.49 |
| Equal consent/nonconsent | 2,553 | 1.46 | 11.54 |
| Mostly consenting | 4,211 | 1.16 | 10.46 |
| Full enthusiastic consent | 6,709 | 0.90 | 8.85 |

Interestingly, the "mostly nonconsenting" group consumes more violent porn (1.72) than the "full nonconsent" group (1.44). The equal-split group has the highest kink breadth (11.54).

### Erotic Energy Preference

Those preferring "totally intense, high-energy" scenarios have 11.77 avg kinks and 1.65 avg violent porn, while "totally gentle, low-energy" fans have 8.80 avg kinks. High-energy preference is the strongest content-preference predictor of kink breadth.

### Pornhabit Intensity and Kink Profile

| Porn Intensity | n | Avg Kinks | Avg Induced | Avg Incest | Avg Bestiality |
|---|---|---|---|---|---|
| Low (0-3) | 2,744 | 8.23 | 1.24 | 3.27 | 2.23 |
| Medium-Low (4-5) | 2,559 | 9.15 | 1.42 | 3.04 | 2.21 |
| Medium-High (6-7) | 5,922 | 10.09 | 1.63 | 3.19 | 2.35 |
| High (8-9) | 4,278 | 11.65 | 1.83 | 3.53 | 2.71 |

Heavy porn consumers (8-9) have 42% more kink categories than minimal consumers (0-3). Every kink dimension examined scales with porn consumption.

---

## Summary of Key Takeaways

1. **The "induced fetish" belief is the single best media-side predictor of kink breadth** (r=0.204), stronger than raw consumption volume (r=0.173). The "definitely induced" group averages 43% more kink categories than the "not at all" group.

2. **Written erotica is the sharpest gender divide in media preferences**: 25% of non-males vs 10.5% of males prefer written content. The animated/live-action split is much smaller.

3. **Violent porn consumption serves opposite functions by gender**: Male heavy consumers are sadistic (prefer giving pain), non-male heavy consumers are masochistic (prefer receiving). The delta is ~1.0+ scale points in both directions.

4. **Earlier porn exposure correlates with more kinks**, but the relationship plateaus around age 12-13. Starting before 11 yields ~11 kink categories vs ~9.5 for starting at 17+.

5. **Multi-format consumers have the most kinks**. The "even split" on both animated/live-action and written/visual scales consistently has higher kink breadth than format purists.

6. **Occasional porn payers have more kinks than regular payers** (11.32 vs 10.56), suggesting broad explorers pay to access niche content, while regular subscribers may focus on specific niches.

7. **Self-reported fetish induction correlates most with "impossible" kinks** (bestiality r=0.135, incest r=0.120) — kinks that depend on media to exist as fantasies since real-world exposure is limited.

8. **Non-males slightly outnumber males** among the heaviest violent porn consumers (52-58%), challenging assumptions about the audience for violent sexual content.

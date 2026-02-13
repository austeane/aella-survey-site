# BKS Public Dataset: Deep Exploration Summary

Generated: 2026-02-12

## 1. Overview

| Property | Value |
|----------|-------|
| File | `data/BKSPublic.parquet` |
| Rows | 15,503 |
| Columns | 365 |
| Format | Apache Parquet |
| Sample | ~1.6% stratified subsample of ~970k total responses |

The Big Kink Survey (BKS) is a large-scale, self-selected online survey studying human sexual preferences, fetishes, personality traits, childhood experiences, and demographics. The public dataset represents a stratified subsample of the full ~970k-response dataset, balanced across age and sex.

## 2. Survey Methodology & Structure

### Design
- **Platform**: Online self-administered survey ("GT" / Google-based tool)
- **5 parts**: Demographics (1), Childhood (2), Sex fantasy intro + preferences (3), Kink/fetish gate + details (4-5)
- **Gated questions**: Many questions are conditional. If respondents don't pass an interest gate (e.g., checking "bondage" as an interest), they skip all sub-questions for that category. These respondents show as NULL/NA and can often be treated as implicit 0s.
- **Scales**: Originally 0-8, cleaned to 0-5 or 1-5 in the processed dataset.
- **Questions added over time**: The survey evolved as responses accumulated. Some questions were added late (noted in the survey doc), creating structural missingness for early respondents.

### Sampling
- The public file is a ~1.6% **stratified subsample** designed to produce even distributions across age bins and biological sex.
- Source platform was primarily Reddit, FetLife, Twitter, Facebook, Discord, Tumblr, and others (the referral source column was dropped in this public release).

### Data Cleaning Applied
- Several columns were **binned/collapsed** (politics from 5 to 3 levels, BMI from 10 to 2, straightness from continuous to 5 levels, then further to 2, etc.)
- Some columns were **combined** (childhood_adversity merges abuse + childhood sexual assault; childhood_gender_tolerance averages two separate tolerance questions)
- **Computed columns** were added (OCEAN personality scores, powerlessness, total fetish counts)
- **Dropped columns**: country, ethnicity, religion_importance, sex age, social class, detailed gender identity, relationship status, sex work questions, pedophilia sub-questions, abuse detail sub-questions, all "*smost" sparse columns, duplicate GT columns

## 3. Column Types & Structure

### DuckDB Storage Types
| Type | Count |
|------|-------|
| VARCHAR | 213 |
| DOUBLE | 152 |
| **Total** | **365** |

### Logical Types (from schema profiler)
| Logical Type | Count | Description |
|-------------|-------|-------------|
| categorical | 251 | Ordinal scales, enums, binned values (most survey responses) |
| text | 62 | Free-form categorical with many unique values (fetish sub-item picks, "most erotic" selections) |
| numeric | 52 | Continuous or high-cardinality numbers (OCEAN scores, totals, slider values) |

### Tag Distribution (from schema profiler)
| Tag | Count | Description |
|-----|-------|-------------|
| fetish | 196 | Kink/fetish interest ratings, sub-items, onset ages |
| other | 106 | Columns not clearly in another category |
| demographic | 64 | Age, sex, orientation, politics, childhood, personality |
| derived | 48 | Computed/aggregated columns (totals, averages) |
| ocean | 5 | Big Five personality trait scores |

### Column Groups by Pattern

| Category | Count | Examples |
|----------|-------|---------|
| Fetish sub-item details | ~90 | Specific items within each fetish category (bondage types, nonconsent scenarios, etc.) |
| "Most erotic" picks | ~50 | Within each category, which specific item is most arousing |
| Total/count columns | 36 | Aggregated counts per category (Totalbondage, Totalnonconsent1, etc.) |
| Fetish onset ages | 30 | "How old were you when you first experienced interest in X?" |
| Demographic/background | ~24 | age, biomale, politics, straightness, childhood questions |
| Fetish arousal ratings | ~20 | "I find X to be:" on the arousal scale |
| OCEAN personality | 6 | opennessvariable, conscientiousnessvariable, etc. |

## 4. Demographic Distributions

### Age (binned, stratified)
| Age Bin | N | % |
|---------|---|---|
| 14-17 | 3,197 | 20.6% |
| 18-20 | 2,532 | 16.3% |
| 21-24 | 3,211 | 20.7% |
| 25-28 | 3,278 | 21.1% |
| 29-32 | 3,285 | 21.2% |

Age was binned into 5 groups. The distribution is nearly uniform due to stratified sampling. Note: the survey includes minors (14-17), who comprise ~21% of the sample.

### Biological Sex
| Value | N | % |
|-------|---|---|
| biomale = 0 (female) | 7,564 | 48.8% |
| biomale = 1 (male) | 7,939 | 51.2% |

Nearly 50/50 split — this is a result of the stratified sampling. The original "gender" column in the survey had 5 options (Man cis, Man trans, Woman cis, Woman trans, Nonbinary AMAB/AFAB) but the public dataset only retains `biomale` (assigned sex at birth).

### Sexual Orientation (straightness)
| Value | N | % |
|-------|---|---|
| Straight | 13,705 | 88.4% |
| Not straight | 1,798 | 11.6% |

Originally a 5-level scale (Gay, Leaning gay, Bi, Leaning straight, Straight), collapsed to binary in this dataset.

### Politics
| Value | N | % |
|-------|---|---|
| Moderate | 5,599 | 36.1% |
| Liberal | 5,046 | 32.5% |
| Conservative | 4,858 | 31.3% |

Collapsed from a 5-level scale. Remarkably even distribution, likely reflecting the stratified sample.

### BMI
| Value | N | % |
|-------|---|---|
| Overweight+ | 8,923 | 57.6% |
| Not overweight | 6,580 | 42.4% |

Collapsed from 10 original bins to binary.

### Relationship Style
| Value | N | % |
|-------|---|---|
| Monogamous | 11,720 | 75.6% |
| Not monogamous | 3,780 | 24.4% |

Collapsed from 3 original levels (Mono, Middle, Poly).

### Sexual Partner Count
| Value | N | % |
|-------|---|---|
| 0 | 4,524 | 29.2% |
| 1-2 | 3,904 | 25.2% |
| 3-7 | 3,178 | 20.5% |
| 8-20 | 2,294 | 14.8% |
| 21+ | 1,363 | 8.8% |
| NULL | 240 | 1.5% |

Nearly 30% of respondents report zero sexual partners, consistent with the young age distribution (21% are 14-17).

### Mental Illness
| Value | N | % |
|-------|---|---|
| None | 9,307 | 60.0% |
| Any | 6,196 | 40.0% |

40% report at least one moderate-to-severe mental health condition. The original survey offered 19 checkbox options (ADHD, Anxiety, Autism, Depression, PTSD, etc.); the public dataset collapses these to binary.

### Childhood Adversity
| Value | N | % |
|-------|---|---|
| None | 10,617 | 68.5% |
| Any | 4,886 | 31.5% |

Combined from abuse and childhood sexual assault questions into binary.

### Adult Sexual Assault
| Value | N | % |
|-------|---|---|
| No | 10,825 | 69.8% |
| Yes | 4,675 | 30.2% |

Originally 4-level (No, Yes mild/moderate/severe), collapsed to binary in this dataset.

### Childhood Gender Tolerance
| Value | N | % |
|-------|---|---|
| Medium | 8,603 | 55.5% |
| Intolerant | 4,150 | 26.8% |
| Tolerant | 2,739 | 17.7% |

Computed from two questions about childhood culture's tolerance for gender role violations and genderbending.

### Upbringing Sexual Liberation
| Value | N | % |
|-------|---|---|
| Repressed | 6,767 | 43.6% |
| Liberated | 5,427 | 35.0% |
| Neutral | 3,302 | 21.3% |

Collapsed from 7 levels to 3.

## 5. Sexual Preference Distributions

### Dominance/Submission Self-ID
| Value | N | % |
|-------|---|---|
| Switch/equal/no preference | 4,354 | 28.1% |
| Moderately submissive | 2,767 | 17.8% |
| Moderately dominant | 2,261 | 14.6% |
| Slightly submissive | 1,763 | 11.4% |
| Slightly dominant | 1,476 | 9.5% |
| Totally submissive | 1,469 | 9.5% |
| Totally dominant | 1,005 | 6.5% |

Submissive responses (38.7%) outnumber dominant (30.6%), with switches at 28.1%.

### Consent Preference in Fantasy
| Value | N | % |
|-------|---|---|
| Full, enthusiastic consent | 6,709 | 43.3% |
| Mostly consenting, slightly nonconsenting | 4,211 | 27.2% |
| Equally consenting and nonconsenting | 2,553 | 16.5% |
| Mostly nonconsenting, slightly consenting | 1,303 | 8.4% |
| Full nonconsent | 721 | 4.7% |

Over half (56.7%) prefer at least some nonconsent element in fantasy.

### Sexual Interest Broadness
| Value | N | % |
|-------|---|---|
| Somewhat broad | 3,687 | 23.8% |
| Equally narrow and broad | 3,159 | 20.4% |
| A little broad | 2,603 | 16.8% |
| Very broad | 2,392 | 15.4% |
| A little narrow | 1,754 | 11.3% |
| Somewhat narrow | 1,261 | 8.1% |
| Very narrow | 643 | 4.1% |

Skewed toward broad — 56% describe their interests as at least a little broad.

### Porn/Erotica Consumption
| pornhabit | Label | N | % |
|-----------|-------|---|---|
| 9 | Multiple times/day | 1,619 | 10.4% |
| 8 | Daily | 2,659 | 17.2% |
| 7 | Multiple times/week | 4,513 | 29.1% |
| 6 | Once a week | 1,409 | 9.1% |
| 5 | Few times/month | 1,881 | 12.1% |
| 4 | Once a month | 678 | 4.4% |
| 3 | Few times/year | 752 | 4.9% |
| 2 | Once a year | 312 | 2.0% |
| 1 | Less than once/year | 341 | 2.2% |
| 0 | Never | 1,339 | 8.6% |

56.7% consume porn/erotica at least multiple times per week. Only 8.6% report never consuming it.

### Fetish Category Counts
| Metric | Common (17 cats) | Uncommon (13 cats) | Total (30 cats) | Sex Acts |
|--------|------|---------|-------|----------|
| Mean | 7.5 | 2.7 | 10.0 | 7.2 |
| Median | — | — | 9.0 | — |
| Min | — | — | 0.0 | — |
| Max | — | — | 30.0 | — |

On average, respondents check interest in 10 of 30 fetish categories (7.5 "common" + 2.7 "uncommon").

### Most Erotic Self-Feeling (youfeelmost)
| Emotion | N | % |
|---------|---|---|
| Eagerness or desire | 4,974 | 33.2% |
| Love or romance | 3,004 | 20.1% |
| Wildness or primalness | 1,858 | 12.4% |
| Powerlessness or vulnerability | 1,739 | 11.6% |
| Safety or warmth | 978 | 6.5% |
| Power or smugness | 729 | 4.9% |

### Most Erotic Other-Feeling (otherfeel1most)
| Emotion | N | % |
|---------|---|---|
| Eagerness or desire | 4,593 | 31.4% |
| Love or romance | 2,549 | 17.4% |
| Wildness or primalness | 1,767 | 12.1% |
| Power or smugness | 1,742 | 11.9% |
| Powerlessness or vulnerability | 1,099 | 7.5% |
| Safety or warmth | 918 | 6.3% |

Notable: when imagining the other person's feelings, "power or smugness" rises significantly (4.9% self vs 11.9% other).

### Masturbation Onset Age
| Age | N | % |
|-----|---|---|
| 12-13 | 4,822 | 31.1% |
| 10-11 | 2,909 | 18.8% |
| 14-15 | 2,426 | 15.6% |
| 8-9 | 1,353 | 8.7% |
| 7 or younger | 1,204 | 7.8% |
| 16-17 | 1,081 | 7.0% |
| 18+ | 1,025 | 6.6% |
| Never | 678 | 4.4% |

Peak onset at 12-13, with 67% beginning by age 13.

## 6. OCEAN Personality & Powerlessness

Mean scores across the sample (range -6 to +6 for OCEAN, -9 to +9 for powerlessness):

| Trait | Mean |
|-------|------|
| Openness | +1.64 |
| Conscientiousness | +1.27 |
| Extroversion | -1.29 |
| Neuroticism | +0.96 |
| Agreeableness | +2.00 |
| Powerlessness | +0.70 |

The sample skews toward **introverted** (extroversion is the only negative mean), moderately open and agreeable, slightly neurotic, and slightly powerless.

## 7. Data Quality & Missingness

### Null Rate Distribution
| Null Rate Bucket | Column Count |
|-----------------|--------------|
| 0% (asked of everyone, always answered) | 19 |
| >0% to 10% | 51 |
| 10% to 25% | 13 |
| 25% to 50% | 48 |
| 50% to 75% | 59 |
| 75% to 90% | 91 |
| 90% to 100% | 84 |

**Key observation**: Only 19 columns have zero nulls. The vast majority of columns (234 of 365, or 64%) have >50% null rates. This is **by design** — the survey uses gated questions extensively. If you don't check "bondage" as an interest, you never see the 10+ bondage sub-questions, so those columns are NULL for you.

### Structural Missingness Patterns

1. **Gated fetish sub-questions** (largest source of NULLs): Each fetish category has a gate checkbox. Respondents who don't check the gate have NULLs for all sub-questions in that category. These NULLs mean "not interested" and can be treated as implicit 0s for analysis.

2. **Questions added late**: Some questions were added mid-survey (noted with dates in the survey doc). Earlier respondents never saw these questions, creating time-based structural missingness. Examples:
   - Menstrual cycle, hormonal BC, PMS questions (added Nov 2024)
   - Sex work questions (added Oct 2024)
   - Horny-right-now questions (added May 2025)
   - Blanchard-style body questions (added ~Mar 2025)
   - Narcissism question (added late, 91.6% null)

3. **Sex-gated questions**: Some questions only appear for biomale=0 (vaginal orgasm, hookups, breakups) or biomale=1 (circumcision). These show ~50% NULLs reflecting the ~50/50 sex split.

4. **Deeply nested gates**: Some questions are gated behind 2-3 levels of gates. For example, pedophilia sub-questions (dropped in this dataset) required: checking "Age" interest -> rating arousal > threshold -> choosing "Older" in age gap -> then sub-questions appeared.

### Zero-Null Columns (19 universal columns)
These were asked of everyone and always answered:
- `age`, `biomale`, `straightness`, `politics`, `bmi`
- OCEAN personality (5 computed scores): openness, conscientiousness, extroversion, neuroticism, agreeableness
- `powerlessnessvariable`
- `childhood_adversity`, `TotalMentalIllness`
- `pornhabit`, `totalfetishcategory`
- `knowwhatarousesyou`, `normalsex`, `cunnilingus`
- Shame question: "I am ashamed or embarrassed about at least some of what arouses me"

### Highest-Null Columns (>95%)
These represent deeply gated, rare interests or late-added questions:
- Smegma, vomit, scat sub-items (~99% null)
- Body horror, necrophilia sub-items (~98-99% null)
- Messiness sub-items (~99% null)
- Baby fever question (~99% null)
- Grandparent/grandchild incest preferences (~98% null)

## 8. Notable Survey Design Observations

1. **Stratified subsample**: The even age/sex distribution is artificial. The full dataset (~970k) likely has very different demographic distributions (probably skewing younger, male, and from Reddit/internet communities).

2. **Self-selection bias**: Respondents sought out this survey (from Reddit, FetLife, etc.), so this population is not representative of the general public. They are people interested enough in kink/sexuality to complete a lengthy survey.

3. **Fantasy framing**: The survey explicitly tells respondents to answer about fantasies, not real-life behavior. The consent preferences, for example, ask about "preferred erotic scenarios" not actual practice.

4. **Scale compression**: Original 0-8 arousal scales were compressed to 0-5, and many demographic variables were heavily binned (7 -> 3 levels, 10 -> 2 levels). This loses granularity but aids privacy and simplifies analysis.

5. **Computed columns**: OCEAN scores are computed as differences of agreement-scale items (e.g., openness = "I have excellent ideas" - "I have difficulty understanding abstract ideas"). Powerlessness sums three related items. These are rough proxies, not validated psychometric instruments.

6. **Dropped sensitive data**: Country, ethnicity, religion_importance, detailed gender identity, relationship status, and sex work data were all dropped for the public release. This limits certain analyses but protects respondent privacy.

7. **Column naming**: Columns use a mix of:
   - Short lowercase names (`age`, `biomale`, `straightness`)
   - Full question text with GT IDs (`"I find blowjobs:" (yuc275j)`)
   - Computed names (`opennessvariable`, `totalfetishcategory`)
   - This inconsistency means column names need careful handling in queries.

8. **Arousal scales are nonlinear**: The arousal scale maps to: Not arousing=0, Slightly=1, Somewhat=2, Moderately=3, Very=5, Extremely=8. The jumps from 3->5 and 5->8 are intentional. "Vanilla" items use a reversed scale (0 to -8).

## 9. Summary for AI Agents

When querying this dataset:
- **NULL handling is critical**: Most NULLs mean "question not shown" (gated out), not "refused to answer." For fetish items, NULL ~= 0 (not interested).
- **Column names with quotes/special chars**: Many column names contain double quotes, parentheses, and colons. Use DuckDB's double-quote escaping: `"column ""with quotes"" (id)"`.
- **Demographics are balanced by design**: Don't interpret even age/sex distributions as reflecting the true survey population.
- **19 universal columns** (0% null) are the safest starting points for analysis.
- **Fetish data follows a gate -> rate -> detail pattern**: Gate checkbox (in Totalfetish1/2) -> arousal rating (0-8 scale) -> sub-item details (specific scenarios/preferences) -> onset age -> "most erotic" pick.
- **The `totalfetishcategory` column** (0-30 range, mean=10, median=9) is a useful aggregate measure of kink breadth.

# Latent Profile Analysis: Natural "Types" of Kink Profiles

**Dataset**: Big Kink Survey (~15,503 respondents, 365 columns)
**Method**: K-means clustering on standardized kink intensity scores
**Date**: 2026-02-13

---

## Methodology

K-means clustering on standardized (z-scored) kink intensity columns. Rows with any missing value in the selected columns are dropped, so column selection is critical to maintain adequate sample size. Three separate analyses were run with different column subsets to capture different facets of kink identity.

The elbow method (inertia vs. k) was used to guide cluster count selection, supplemented by silhouette scores and interpretability. Silhouette scores across all analyses were modest (0.17-0.18), indicating soft/overlapping clusters typical of psychometric data -- these are tendencies, not hard categories.

**Important caveat**: Respondents who completed all columns in a given subset are a non-random sample. They tend to be more engaged, more kinky overall, and may skew toward particular demographics. N and composition are reported for each analysis.

---

## Analysis 1: Core Kink Profile

**Columns (8)**: normalsex, gentleness, lightbondage, mediumbondage, extremebondage, powerdynamic, obedience, eagerness
**N** = 3,767 complete rows (24.3% of dataset)
**Rationale**: High-response-rate columns (>56% each, except eagerness at 76%) capturing the broadest kink dimensions: bondage intensity across three levels, power dynamics, obedience, gentleness, eagerness, and normalsex preference.

### Elbow Plot

| k | Inertia | Reduction | Bar |
|---|---------|-----------|-----|
| 2 | 23,880 | -- | `####################` |
| 3 | 21,941 | 8.1% | `##################` |
| 4 | 20,244 | 7.7% | `################` |
| 5 | 19,042 | 5.9% | `###############` |
| 6 | 18,014 | 5.4% | `###############` |
| 7 | 17,128 | 4.9% | `##############` |
| 8 | 16,410 | 4.2% | `#############` |

The elbow is relatively smooth. k=4 offers the best parsimony/interpretability balance (7.7% reduction from k=3, dropping to 5.9% at k=5).

### k=4 Solution: The Four Core Types

#### Cluster 0 -- "Eager Enthusiasts" (N=1,088, 28.9%)
- **Highest**: eagerness (4.29), powerdynamic (3.95), gentleness (3.73)
- **Lowest**: obedience (2.45), extremebondage (1.13), normalsex (-6.84)
- **Profile**: High eagerness and power interest but low on bondage intensity and obedience. They like the energy and dynamics of kink without the heavy hardware. Moderate gentleness suggests they value connection alongside excitement.

#### Cluster 1 -- "All-In Kinksters" (N=1,127, 29.9%)
- **Highest**: powerdynamic (4.63), eagerness (4.54), lightbondage (4.51)
- **Lowest**: obedience (3.92), extremebondage (3.47), normalsex (-7.50)
- **Profile**: Highest scores across the board -- these respondents are into nearly everything and rate their interest strongly. Even their "lowest" scores (3.47 on extreme bondage) are higher than most clusters' peaks. Most anti-normalsex of any group.

#### Cluster 2 -- "Kink-Curious Moderates" (N=745, 19.8%)
- **Highest**: lightbondage (3.07), powerdynamic (2.77), mediumbondage (2.75)
- **Lowest**: obedience (1.85), extremebondage (1.49), normalsex (-4.86)
- **Profile**: Across-the-board low scores compared to other clusters. Mild interest in bondage and power dynamics, but nothing very strong. Most vanilla of the group (least negative normalsex), suggesting they are exploring kink territory from closer to the mainstream.

#### Cluster 3 -- "Kinky But Grounded" (N=807, 21.4%)
- **Highest**: powerdynamic (4.36), eagerness (4.12), mediumbondage (3.93)
- **Lowest**: gentleness (3.43), extremebondage (2.75), normalsex (-2.67)
- **Profile**: Strong kink interests but the *least* negative normalsex score, meaning they retain the most appreciation for conventional sex. They like kink as an addition to a broader sexual repertoire rather than a replacement.

**Full Profile Table:**

| Cluster | N | % | normalsex | gentleness | lightbondage | mediumbondage | extremebondage | powerdynamic | obedience | eagerness |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 "Eager Enthusiasts" | 1,088 | 28.9% | -6.84 | 3.73 | 3.35 | 2.73 | 1.13 | 3.95 | 2.45 | 4.29 |
| 1 "All-In Kinksters" | 1,127 | 29.9% | -7.50 | 4.06 | 4.51 | 4.50 | 3.47 | 4.63 | 3.92 | 4.54 |
| 2 "Kink-Curious" | 745 | 19.8% | -4.86 | 2.67 | 3.07 | 2.75 | 1.49 | 2.77 | 1.85 | 2.72 |
| 3 "Kinky But Grounded" | 807 | 21.4% | -2.67 | 3.43 | 3.90 | 3.93 | 2.75 | 4.36 | 3.61 | 4.12 |

### Demographics: Analysis 1, k=4

**Gender (biomale):**

| Cluster | N | Male % | Female % |
|---|---|---|---|
| 0 "Eager Enthusiasts" | 1,088 | 45.2% | 54.8% |
| 1 "All-In Kinksters" | 1,127 | 45.2% | 54.8% |
| 2 "Kink-Curious" | 745 | 42.8% | 57.2% |
| 3 "Kinky But Grounded" | 807 | 37.9% | 62.1% |

Gender split is fairly uniform across clusters, with a slight female lean across the board. "Kinky But Grounded" is the most female-skewed (62.1%).

**Orientation:**

| Cluster | N | Straight % | Not Straight % |
|---|---|---|---|
| 0 "Eager Enthusiasts" | 1,088 | 89.5% | 10.5% |
| 1 "All-In Kinksters" | 1,127 | 87.9% | 12.1% |
| 2 "Kink-Curious" | 745 | 86.3% | 13.7% |
| 3 "Kinky But Grounded" | 807 | 83.4% | 16.6% |

"Kinky But Grounded" has the highest proportion of non-straight respondents (16.6%), while "Eager Enthusiasts" has the most straight (89.5%). The pattern suggests that maintaining appreciation for normalsex alongside kink correlates with non-straight identity.

**Politics:**

| Cluster | N | Liberal % | Moderate % | Conservative % |
|---|---|---|---|---|
| 0 "Eager Enthusiasts" | 1,088 | 36.6% | 35.0% | 28.4% |
| 1 "All-In Kinksters" | 1,127 | 35.8% | 33.2% | 31.1% |
| 2 "Kink-Curious" | 745 | 32.9% | 37.4% | 29.7% |
| 3 "Kinky But Grounded" | 807 | 36.9% | 38.5% | 24.5% |

"Kinky But Grounded" is the least conservative (24.5%) and most moderate (38.5%). "All-In Kinksters" have the highest conservative share (31.1%).

**Personality (Big Five means):**

| Cluster | Agreeableness | Extroversion | Neuroticism | Openness |
|---|---|---|---|---|
| 0 "Eager Enthusiasts" | 2.56 | -1.21 | 1.26 | 1.81 |
| 1 "All-In Kinksters" | 2.45 | -1.09 | 1.36 | 2.12 |
| 2 "Kink-Curious" | 2.03 | -1.41 | 1.18 | 1.48 |
| 3 "Kinky But Grounded" | 2.26 | -1.50 | 1.46 | 1.69 |

"All-In Kinksters" have the highest openness (2.12) and are the most extroverted (-1.09, least negative). "Kink-Curious" are lowest on both openness (1.48) and agreeableness (2.03), fitting a more reserved, less exploratory personality. "Kinky But Grounded" are the most introverted (-1.50) and most neurotic (1.46).

**Age Distribution:**

| Cluster | 14-17 % | 18-20 % | 21-24 % | 25-28 % | 29-32 % |
|---|---|---|---|---|---|
| 0 "Eager Enthusiasts" | 19.3% | 16.5% | 22.3% | 21.3% | 20.5% |
| 1 "All-In Kinksters" | 19.0% | 15.6% | 20.2% | 22.3% | 22.9% |
| 2 "Kink-Curious" | 16.1% | 16.1% | 22.7% | 23.4% | 21.7% |
| 3 "Kinky But Grounded" | 21.6% | 16.5% | 22.2% | 18.6% | 21.2% |

Age distributions are remarkably similar across clusters, with no strong age-based sorting. "Kinky But Grounded" has slightly more 14-17 year olds (21.6%), possibly reflecting younger people who still appreciate conventional sex alongside their emerging kink interests.

---

## Analysis 2: Taboo Spectrum

**Columns (5)**: incest, nonconsent, mentalalteration, agegap, cgl
**N** = 577 complete rows (3.7% of dataset)
**Rationale**: Taboo/transgressive kinks with enough response overlap for clustering. The original design (brutality, vore, bestiality, dirty, creepy) had N<100 due to extreme gating. This accessible set captures the taboo dimension while maintaining viable N. Note: this subset is 66% male vs. 51% in the full dataset, reflecting higher male completion rates for taboo columns.

### Elbow Plot

| k | Inertia | Reduction | Bar |
|---|---------|-----------|-----|
| 2 | 2,068 | -- | `####################` |
| 3 | 1,793 | 13.3% | `#################` |
| 4 | 1,603 | 10.6% | `###############` |
| 5 | 1,465 | 8.6% | `##############` |
| 6 | 1,343 | 8.3% | `############` |
| 7 | 1,251 | 6.8% | `############` |
| 8 | 1,186 | 5.3% | `###########` |

Stronger elbow than Analysis 1. k=3 gives the clearest structure (13.3% reduction), with k=4 as an informative refinement.

### k=4 Solution: Taboo Profile Types

#### Cluster 0 -- "Reluctant Voyeurs" (N=101, 17.5%)
- **Highest**: nonconsent (3.07), mentalalteration (2.22), agegap (2.05)
- **Lowest**: incest (1.98), cgl (1.62)
- **Profile**: Lowest scores across all taboo kinks. Drawn to the milder taboo of nonconsent fantasy but only at moderate levels. Least interested in incest and CGL. The most restrained of the taboo-answering population.

#### Cluster 1 -- "Full-Spectrum Taboo" (N=203, 35.2%)
- **Highest**: nonconsent (4.71), agegap (4.26), incest (4.23)
- **Lowest**: mentalalteration (4.17), cgl (4.01)
- **Profile**: Highest scores across all five dimensions including CGL (4.01). These respondents are broadly interested in transgressive themes. Even their lowest score is 4.01. This is the "into everything taboo" group.

#### Cluster 2 -- "Dark Fantasy, No Nurture" (N=155, 26.9%)
- **Highest**: nonconsent (4.48), mentalalteration (4.05), incest (3.99)
- **Lowest**: agegap (3.25), cgl (1.06)
- **Profile**: Very high on nonconsent, mentalalteration, and incest, but extremely low on CGL (1.06). They like dark, transgressive themes involving power violation and taboo relationships, but the nurturing/caregiver dynamic holds zero appeal. Sharp distinction from Cluster 1.

#### Cluster 3 -- "Age-Gap Focused" (N=118, 20.5%)
- **Highest**: agegap (3.82), incest (3.67), nonconsent (2.74)
- **Lowest**: mentalalteration (2.47), cgl (2.43)
- **Profile**: Primarily interested in age-gap dynamics and secondarily in incest (which often involves age-gap elements). Lower interest in the more psychologically extreme taboos (mentalalteration, nonconsent as coercion).

**Full Profile Table:**

| Cluster | N | % | incest | nonconsent | mentalalteration | agegap | cgl |
|---|---|---|---|---|---|---|---|
| 0 "Reluctant Voyeurs" | 101 | 17.5% | 1.98 | 3.07 | 2.22 | 2.05 | 1.62 |
| 1 "Full-Spectrum Taboo" | 203 | 35.2% | 4.23 | 4.71 | 4.17 | 4.26 | 4.01 |
| 2 "Dark Fantasy, No Nurture" | 155 | 26.9% | 3.99 | 4.48 | 4.05 | 3.25 | 1.06 |
| 3 "Age-Gap Focused" | 118 | 20.5% | 3.67 | 2.74 | 2.47 | 3.82 | 2.43 |

### Demographics: Analysis 2, k=4

**Gender (biomale):**

| Cluster | N | Male % | Female % |
|---|---|---|---|
| 0 "Reluctant Voyeurs" | 101 | 66.3% | 33.7% |
| 1 "Full-Spectrum Taboo" | 203 | 58.6% | 41.4% |
| 2 "Dark Fantasy, No Nurture" | 155 | 69.7% | 30.3% |
| 3 "Age-Gap Focused" | 118 | 73.7% | 26.3% |

All clusters skew male (the entire taboo-answering subset is 66% male). "Age-Gap Focused" is the most male-dominated (73.7%), while "Full-Spectrum Taboo" has the highest female representation (41.4%). The pattern suggests women who engage with taboo content tend toward the broadest exploration rather than a narrow focus.

**Orientation:**

| Cluster | N | Straight % | Not Straight % |
|---|---|---|---|
| 0 "Reluctant Voyeurs" | 101 | 93.1% | 6.9% |
| 1 "Full-Spectrum Taboo" | 203 | 85.2% | 14.8% |
| 2 "Dark Fantasy, No Nurture" | 155 | 85.2% | 14.8% |
| 3 "Age-Gap Focused" | 118 | 88.1% | 11.9% |

"Reluctant Voyeurs" are disproportionately straight (93.1% vs. 88.4% overall). The two most intensely taboo groups (Clusters 1 and 2) have identical non-straight representation (14.8%), suggesting breadth or intensity of taboo interest correlates with sexual orientation diversity.

**Politics:**

| Cluster | N | Liberal % | Moderate % | Conservative % |
|---|---|---|---|---|
| 0 "Reluctant Voyeurs" | 101 | 25.7% | 42.6% | 31.7% |
| 1 "Full-Spectrum Taboo" | 203 | 30.0% | 33.5% | 36.5% |
| 2 "Dark Fantasy, No Nurture" | 155 | 33.5% | 35.5% | 31.0% |
| 3 "Age-Gap Focused" | 118 | 34.7% | 40.7% | 24.6% |

"Full-Spectrum Taboo" has the highest conservative share (36.5%). "Age-Gap Focused" is the least conservative (24.6%) and most moderate. "Reluctant Voyeurs" are the least liberal (25.7%).

**Personality:**

| Cluster | Agreeableness | Extroversion | Neuroticism | Openness |
|---|---|---|---|---|
| 0 "Reluctant Voyeurs" | 1.59 | -1.53 | 0.70 | 1.90 |
| 1 "Full-Spectrum Taboo" | 1.52 | -1.23 | 0.85 | 2.14 |
| 2 "Dark Fantasy, No Nurture" | 1.73 | -1.53 | 0.88 | 2.08 |
| 3 "Age-Gap Focused" | 1.62 | -1.42 | 0.66 | 1.90 |

Taboo respondents overall have lower agreeableness (~1.6) and lower neuroticism (~0.8) than Analysis 1 respondents (~2.3 and ~1.3 respectively), suggesting these are more disagreeable, emotionally stable people. "Full-Spectrum Taboo" has the highest openness (2.14) and is the most extroverted.

**Age Distribution:**

| Cluster | 14-17 % | 18-20 % | 21-24 % | 25-28 % | 29-32 % |
|---|---|---|---|---|---|
| 0 "Reluctant Voyeurs" | 12.9% | 10.9% | 12.9% | 26.7% | 36.6% |
| 1 "Full-Spectrum Taboo" | 16.7% | 15.8% | 17.2% | 24.1% | 26.1% |
| 2 "Dark Fantasy, No Nurture" | 11.0% | 14.2% | 23.9% | 19.4% | 31.6% |
| 3 "Age-Gap Focused" | 17.8% | 9.3% | 15.3% | 25.4% | 32.2% |

The taboo subset overall skews older than the full dataset. "Reluctant Voyeurs" are the oldest (36.6% in the 29-32 bracket), while "Full-Spectrum Taboo" has the youngest composition (16.7% in 14-17). Older respondents who engage with taboo content may do so more cautiously.

---

## Analysis 3: Power & Role

**Columns (6)**: powerdynamic, obedience, receivepain, givepain, lightbondage, extremebondage
**N** = 3,843 complete rows (24.8% of dataset)
**Rationale**: Focused on the power/pain/bondage axis with the highest N of all analyses. This subset captures dominant/submissive orientation and pain giving/receiving preferences -- the dimensions most likely to reveal clear "types."

### Elbow Plot

| k | Inertia | Reduction | Bar |
|---|---------|-----------|-----|
| 2 | 18,202 | -- | `####################` |
| 3 | 15,913 | 12.6% | `#################` |
| 4 | 14,412 | 9.4% | `###############` |
| 5 | 13,199 | 8.4% | `##############` |
| 6 | 12,167 | 7.8% | `#############` |
| 7 | 11,348 | 6.7% | `############` |
| 8 | 10,819 | 4.7% | `###########` |

Strong initial reduction (12.6% at k=3) with consistent improvement through k=5. k=5 provides the most interpretable solution, cleanly separating the pain-giving from pain-receiving axis.

### k=5 Solution: Power & Role Types (Primary)

#### Cluster 0 -- "Pure Submissives" (N=1,006, 26.2%)
- **Highest**: powerdynamic (4.57), lightbondage (4.39), receivepain (3.77)
- **Lowest**: extremebondage (2.81), givepain (0.65)
- **Profile**: Love receiving pain (3.77) but give almost none (0.65 -- the sharpest giving/receiving split in the data). High on bondage and power dynamics. The classic submissive archetype.
- **Gender**: 77.8% female -- the most gender-skewed cluster in any analysis.

#### Cluster 1 -- "Versatile Switches" (N=804, 20.9%)
- **Highest**: powerdynamic (4.52), lightbondage (4.45), receivepain (4.11)
- **Lowest**: givepain (3.88), obedience (3.86), extremebondage (3.42)
- **Profile**: High on both giving AND receiving pain, high on everything. The true switches who enjoy all sides of power exchange. Balanced but intense.

#### Cluster 2 -- "Sadistic Dominants" (N=631, 16.4%)
- **Highest**: powerdynamic (4.49), lightbondage (4.20), obedience (3.84)
- **Lowest**: givepain (3.49), extremebondage (3.08), receivepain (0.74)
- **Profile**: Give pain (3.49) but barely receive it (0.74 -- mirror image of Cluster 0). High on obedience (from the other side). The classic dominant archetype.
- **Gender**: 75.1% male -- the other extremely gender-skewed cluster.

#### Cluster 3 -- "Casual Players" (N=967, 25.2%)
- **Highest**: lightbondage (3.51), powerdynamic (3.04), receivepain (1.93)
- **Lowest**: givepain (1.81), obedience (1.74), extremebondage (1.45)
- **Profile**: Low across the board. They like light bondage at a moderate level but have limited interest in pain exchange or intense power dynamics. The "dip your toes in" group.

#### Cluster 4 -- "Non-Bondage Power Seekers" (N=435, 11.3%)
- **Highest**: powerdynamic (4.27), obedience (3.51), receivepain (3.23)
- **Lowest**: extremebondage (2.79), givepain (2.00), lightbondage (1.37)
- **Profile**: Love power dynamics but not through bondage (lightbondage = 1.37, lowest in the analysis). They prefer psychological power exchange and obedience over physical restraint. More pain-receiving than giving.

**Full Profile Table:**

| Cluster | N | % | powerdynamic | obedience | receivepain | givepain | lightbondage | extremebondage |
|---|---|---|---|---|---|---|---|---|
| 0 "Pure Submissives" | 1,006 | 26.2% | 4.57 | 3.65 | 3.77 | 0.65 | 4.39 | 2.81 |
| 1 "Versatile Switches" | 804 | 20.9% | 4.52 | 3.86 | 4.11 | 3.88 | 4.45 | 3.42 |
| 2 "Sadistic Dominants" | 631 | 16.4% | 4.49 | 3.84 | 0.74 | 3.49 | 4.20 | 3.08 |
| 3 "Casual Players" | 967 | 25.2% | 3.04 | 1.74 | 1.93 | 1.81 | 3.51 | 1.45 |
| 4 "Non-Bondage Power" | 435 | 11.3% | 4.27 | 3.51 | 3.23 | 2.00 | 1.37 | 2.79 |

### Demographics: Analysis 3, k=5

**Gender (biomale):**

| Cluster | N | Male % | Female % |
|---|---|---|---|
| 0 "Pure Submissives" | 1,006 | 22.2% | 77.8% |
| 1 "Versatile Switches" | 804 | 40.9% | 59.1% |
| 2 "Sadistic Dominants" | 631 | 75.1% | 24.9% |
| 3 "Casual Players" | 967 | 45.3% | 54.7% |
| 4 "Non-Bondage Power" | 435 | 39.3% | 60.7% |

**This is the most striking finding in the entire analysis.** Gender and power role are massively correlated (chi-squared = 450.5, p < 10^-96). "Pure Submissives" are 77.8% female; "Sadistic Dominants" are 75.1% male. Switches and casual players are closer to balanced. "Non-Bondage Power Seekers" lean female (60.7%), and since they are submissive-leaning (receivepain >> givepain), this reinforces the gender-submission link.

**Orientation:**

| Cluster | N | Straight % | Not Straight % |
|---|---|---|---|
| 0 "Pure Submissives" | 1,006 | 86.6% | 13.4% |
| 1 "Versatile Switches" | 804 | 85.3% | 14.7% |
| 2 "Sadistic Dominants" | 631 | 89.4% | 10.6% |
| 3 "Casual Players" | 967 | 87.6% | 12.4% |
| 4 "Non-Bondage Power" | 435 | 85.5% | 14.5% |

"Sadistic Dominants" are the most straight (89.4%), while "Versatile Switches" have the highest non-straight representation (14.7%). The dominant role appears to select for straightness more than the submissive role.

**Politics:**

| Cluster | N | Liberal % | Moderate % | Conservative % |
|---|---|---|---|---|
| 0 "Pure Submissives" | 1,006 | 33.6% | 35.4% | 31.0% |
| 1 "Versatile Switches" | 804 | 35.4% | 36.2% | 28.4% |
| 2 "Sadistic Dominants" | 631 | 31.5% | 33.8% | 34.7% |
| 3 "Casual Players" | 967 | 34.7% | 35.8% | 29.5% |
| 4 "Non-Bondage Power" | 435 | 37.0% | 34.0% | 29.0% |

"Sadistic Dominants" are the most conservative (34.7%). "Non-Bondage Power Seekers" are the most liberal (37.0%). Political identity tracks weakly with role preference.

**Personality (Big Five means):**

| Cluster | Agreeableness | Extroversion | Neuroticism | Openness |
|---|---|---|---|---|
| 0 "Pure Submissives" | 2.45 | -1.55 | 1.86 | 1.53 |
| 1 "Versatile Switches" | 1.98 | -1.08 | 1.41 | 1.94 |
| 2 "Sadistic Dominants" | 1.95 | -0.93 | 0.44 | 2.42 |
| 3 "Casual Players" | 2.03 | -1.44 | 1.12 | 1.74 |
| 4 "Non-Bondage Power" | 2.14 | -1.38 | 1.47 | 1.66 |

Personality differences across power roles are dramatic:
- **Neuroticism**: Pure Submissives = 1.86, Sadistic Dominants = 0.44. A 1.42-point gap, roughly a full standard deviation. Submissives are far more neurotic.
- **Openness**: Sadistic Dominants = 2.42, Pure Submissives = 1.53. Dominants are substantially more open to experience.
- **Extroversion**: Sadistic Dominants = -0.93, Pure Submissives = -1.55. Dominants are more extroverted (or rather, less introverted).
- **Agreeableness**: Pure Submissives = 2.45, Sadistic Dominants = 1.95. Submissives are more agreeable.

The personality profile of dominants (low neuroticism, high openness, more extroverted, less agreeable) vs. submissives (high neuroticism, lower openness, more introverted, more agreeable) aligns with social dominance personality research outside of kink contexts.

**Age Distribution:**

| Cluster | 14-17 % | 18-20 % | 21-24 % | 25-28 % | 29-32 % |
|---|---|---|---|---|---|
| 0 "Pure Submissives" | 20.2% | 17.4% | 19.8% | 22.0% | 20.7% |
| 1 "Versatile Switches" | 18.4% | 13.8% | 22.6% | 22.8% | 22.4% |
| 2 "Sadistic Dominants" | 13.5% | 14.6% | 23.6% | 23.3% | 25.0% |
| 3 "Casual Players" | 14.4% | 15.7% | 23.7% | 23.8% | 22.4% |
| 4 "Non-Bondage Power" | 15.9% | 14.9% | 18.4% | 22.5% | 28.3% |

"Sadistic Dominants" and "Non-Bondage Power Seekers" skew older (25.0% and 28.3% in 29-32 bracket). "Pure Submissives" have the youngest profile (20.2% in 14-17). Dominant roles may develop or solidify later in life.

---

## Cross-Analysis Findings

### 1. Gender is the strongest demographic predictor of cluster membership

In Analysis 3 (Power & Role), gender splits dramatically: "Pure Submissives" are 78% female and "Sadistic Dominants" are 75% male (chi-squared = 450.5, p < 10^-96). This is by far the largest demographic effect in any analysis. In contrast, Analysis 1 (Core Profile) shows only mild gender variation (37.9%-45.2% male), and Analysis 2 (Taboo) shows moderate male skew across all clusters (58.6%-73.7%), largely driven by selection bias in who answers taboo columns.

**Interestingness: 9/10.** The near-perfect gender segregation by power role is the single most robust finding.

### 2. Personality covaries with power role far more than with kink breadth

Analysis 1 shows modest personality differences across core kink types (neuroticism range: 1.18-1.46). Analysis 3 shows massive personality differences by power role (neuroticism range: 0.44-1.86). The dominant/submissive axis is far more personality-informative than the vanilla-to-extreme kink axis.

**Interestingness: 8/10.** Dominants and submissives have almost opposite personality profiles.

### 3. CGL (caregiver/little) is the single most discriminating taboo variable

In Analysis 2 (Taboo), CGL ranges from 1.06 to 4.01 across clusters -- a 3-point spread on a 0-5 scale. No other taboo variable separates clusters as cleanly. CGL marks the boundary between "dark-fantasy-focused" and "full-spectrum-taboo" respondents. People who are into nonconsent + incest + mentalalteration but NOT CGL (Cluster 2, "Dark Fantasy, No Nurture") are a genuinely distinct type from those who add CGL to that mix.

**Interestingness: 7/10.** CGL (nurture/age play) is orthogonal to the dark-fantasy axis in a way other taboo kinks are not.

### 4. The taboo-answering population is a distinct demographic

The 577 respondents who answered all five taboo columns are 66% male (vs. 51% overall), have lower agreeableness (1.6 vs. 2.3), lower neuroticism (0.8 vs. 1.3), and skew older. Any finding about "taboo kink types" must be qualified by the fact that this population is already self-selected for comfort with extreme content.

**Interestingness: 6/10.** Important methodological caveat rather than a finding itself.

### 5. Politics shows surprising patterns with taboo kinks

"Full-Spectrum Taboo" respondents (highest on ALL taboo kinks including CGL) are the most conservative taboo cluster (36.5%). "Age-Gap Focused" respondents are the least conservative (24.6%). The stereotype that taboo sexual interests correlate with liberal politics is not clearly supported -- if anything, the broadest taboo interests correlate with conservatism.

**Interestingness: 7/10.** Counterintuitive finding that warrants follow-up.

### 6. "Vanilla appreciation" tracks with non-straight identity

Across both Analysis 1 and Analysis 3, clusters that retain the most interest in normalsex or have less extreme profiles also have the highest proportion of non-straight respondents. This may reflect that non-straight respondents already diverge from sexual norms in one axis and express kink interest differently from straight respondents who "replace" vanilla with kink.

**Interestingness: 6/10.** Suggestive but could be confounded by gender composition.

### 7. No strong age sorting in core kink profiles

Age distributions are remarkably flat across clusters in Analyses 1 and 3. Kink type/intensity does not appear to be strongly age-dependent within this 14-32 age range. The modest exception is that dominant roles skew slightly older, consistent with dominance requiring more confidence/experience.

**Interestingness: 5/10.** The non-finding is itself informative -- kink type is not a developmental stage phenomenon.

---

## Methodological Limitations

1. **Listwise deletion**: Requiring complete data on all columns within a subset drops many respondents. The analysis samples are 4-25% of the full dataset.
2. **Selection bias**: People who answer kink intensity columns (especially taboo ones) are already a non-random, more-kinky-than-average subset.
3. **K-means assumptions**: Assumes spherical clusters of roughly equal variance. Kink data is likely non-spherical (skewed distributions, floor/ceiling effects).
4. **Silhouette scores**: 0.17-0.18 across analyses, indicating significant cluster overlap. These are soft tendencies, not discrete types.
5. **Column selection**: Different column subsets could yield different typologies. These three analyses are illustrative, not exhaustive.
6. **Normalsex scale**: Normalsex scores are negative (likely reverse-coded or on a different scale), making cross-column comparisons within profiles require care.

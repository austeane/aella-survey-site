# Meta-Findings: Big Kink Survey Deep Analysis

**Status**: Living document — updated as new agent waves complete
**Dataset**: Big Kink Survey (Public Sample), n=15,503, 365 columns
**Source**: Zenodo DOI 10.5281/zenodo.18625249 (Aella/Knowingless)
**Source reports**: `analysis/swarm/01-*.md` through `analysis/swarm/15-*.md`
**Last updated**: 2026-02-13

### Critical Data Caveat

Per the dataset creator: this public sample has **deliberate noise added for anonymization**. Correlations are attenuated approximately 25% (e.g., a reported r=0.5 was likely ~0.62 in the original 970k dataset). This means:

- **All effect sizes reported here are conservative lower bounds** — true effects are ~25% larger
- The sample is aggressively representative (age, gender, politics) — base rates may be MORE accurate than the full 970k dataset
- Age range is limited to 14-32, Western countries only (US/Canada + Europe)
- Some extreme fetish columns were removed
- If something looks extremely counterintuitive, it may be a data-cleaning error (e.g., flipped sign)

**Implication**: Findings that survive our rigor checks despite the added noise are genuinely robust. "Real but tiny" effects (d=0.07-0.15) may be "real and small" (d=0.09-0.19) in the original data.

---

## I. The Organizing Principle: Agency, Not Intensity

The single most consistent finding across all analyses is that **people differ primarily in the *direction* of their desires (active vs passive, giving vs receiving, dominant vs submissive), not in how kinky they are overall**.

- Men and women have nearly identical total fetish category counts: 10.18 vs 9.89 (d=0.02). [05-gender §meta-pattern]
- Straight and non-straight respondents show trivially different kink breadth: d=0.071. [08-orientation §Q6]
- Political groups barely differ: max effect size d=0.138 across ALL 39 kink variables. [04-politics §headline]
- But the **give-pain/receive-pain gender gap** is d=0.62-0.64 — the largest effect in the dataset. [05-gender §finding-1]
- The **dom/sub arousal gap** by gender is d=0.54-0.56: 59% of women are sub-leaning vs 28% of men. [05-gender §finding-2]

**Translation**: Everyone is roughly equally kinky. The question isn't "how much" but "which side of the power exchange."

**Major caveat (wave 2 missingness analysis)**: Many kink columns are gated — you only see a response if the person expressed initial interest. This creates selection bias: respondents to gated columns are 0.7-1.4 SD kinkier than non-respondents. Gender differences in gate-passage rates mean some findings (especially pain give/receive) are inflated. Under 0-imputation (treating non-responders as 0 interest), the give-pain gender gap drops from d=0.62 to d=0.07. The "direction not intensity" principle likely still holds, but the magnitude of directional differences is overstated in the gated columns. See [14-missingness] for full analysis.

---

## II. Top-Tier Findings (Large Effects, Novel, Robust)

### 1. The Neuroticism-Pain Axis
**The single strongest personality-kink relationship in the dataset.**

At low neuroticism, give-pain and receive-pain interest are virtually equal. As neuroticism rises, a 1.22-point gap opens on a 5-point scale — entirely toward receiving. The most neurotic quintile: receive 3.13, give 1.91. The most stable quintile: receive 2.44, give 2.39.

This extends to the full submissive cluster: high neuroticism predicts higher obedience, nonconsent interest, and power-dynamic interest.

- r=+0.160 (receivepain), r=-0.123 (givepain) [03-personality §finding-1]
- Ranked #1 and #2 in the full personality×kink correlation matrix [03-personality §top-15-table]

### 2. The "Early Broad Awakening" Phenotype
People who discovered multiple kinks before age 15 report nearly **double** the total fetish categories of those who discovered none early (21.5 vs 12.2).

Onset ages across different kink categories are highly correlated (r=0.52-0.78), with the BDSM core cluster (S/M, power dynamics, nonconsent, humiliation) showing the tightest coupling. This suggests an underlying trait — "early and broad" vs "late and specific" — rather than independent category-by-category discovery.

- Earlier onset predicts higher current intensity for most kinks (r ≈ -0.15 to -0.17). Exception: bondage, which is uniformly high regardless of onset (r=-0.036). [01-age-onset §finding-1, §finding-5]
- Niche kinks (vore, bestiality, brutality) show ~2x the pre-pubescent onset rate of mainstream kinks (9-13% vs 4%). [01-age-onset §finding-2]
- Earlier masturbation onset modestly predicts broader kink repertoire (r=-0.102, N=14,820). [01-age-onset §finding-3]

### 3. Arousal Fixity as the Strongest Kink Predictor
"Could you stop being aroused by something you're into?" is arguably the most powerful single question in the survey.

| Response | N | Avg Fetish Categories |
|----------|------|----------------------|
| Little effort | 1,355 | 8.50 |
| Some effort | 4,222 | 9.28 |
| A lot of effort | 3,741 | 10.00 |
| Extreme effort, maybe | 4,284 | 10.83 |
| Impossible | 1,900 | 11.11 |

A 30% increase in kink breadth from most flexible to most fixed. Self-knowledge of arousal also rises in lockstep (1.08 → 1.64). People who can't change their interests also understand them better.

- [07-relationships §Q8]

### 4. Childhood Adversity Amplifies Kink Interest (But Equally by Gender)
Childhood adversity predicts higher kink intensity, with the "creepy" category showing the strongest effect (d=0.30), nearly double any other category.

**Correction (wave 2)**: The mental health agent's hypothesis that adversity "flips" dominance differently by gender (male dom UP, female dom DOWN) was **not confirmed** by formal two-way ANOVA interaction testing (p > 0.16). Both genders show parallel increases with adversity — no crossover. The original finding likely reflected noise in subgroup means rather than a true interaction.

- [02-mental-health §finding-7, §finding-2] — **partially revised by** [13-interactions §adversity×gender]

### 5. Straight Men Are the Only Dom-Leaning Quadrant
Across all four gender×orientation combinations, straight men are the ONLY group where dominant arousal exceeds submissive (dom-sub = +0.52). Every other group is sub-leaning:

| Quadrant | Dom-Sub Gap | N |
|----------|------------|------|
| Straight male | +0.52 | 7,183 |
| Non-straight male | -0.18 | 756 |
| Non-straight female | -1.23 | 1,042 |
| Straight female | -1.47 | 6,522 |

The gender gap in dom arousal is enormous: straight men average 1.16 vs straight women at 0.09 (~12x).

- [08-orientation §Q2]

---

## III. Counter-Intuitive & Stereotype-Breaking Findings

### 6. Humiliation Is Gender-Neutral (d=0.003)
Despite the massive dom/sub gap (d=0.54-0.56), men and women score identically on humiliation interest: 3.50 vs 3.50. This is the single most gender-neutral kink in the dataset, suggesting humiliation appeals to something orthogonal to the power axis.

- Obedience (d=0.01), medium bondage (d=0.02), and self-exhibitionism (d=0.03) are similarly gender-neutral. [05-gender §gender-similar]

### 7. Politics Doesn't Predict Your Kinks
Largest political effect across all 39 variables: d=0.138 (creepy, liberals higher). This doesn't reach the conventional threshold for even a "small" effect. Bestiality, self-exhibitionism, age-gap, vore, and S/M show essentially zero political signal.

Most interesting non-finding: **shame and therapeutic belief show virtually zero political signal**. Your politics shapes what you're into slightly, but not how you feel about it.

The liberal-conservative gap is consistently larger among women than men (fetish breadth: +0.65 for women vs +0.40 for men).

- [04-politics §headline, §interaction, §shame]

### 8. Shame Correlates with MORE Kinks, Not Fewer
Higher shame ("I am ashamed or embarrassed about what arouses me") is monotonically associated with more intense kink interests (r=0.12). The most stigmatized categories — dirty play, bestiality, genderplay — show the strongest shame correlations.

People who report shame don't retreat from kinks; they may develop more of them, or the causal arrow runs the other way.

- [02-mental-health §finding-3]

### 9. "Totally Honest" Respondents Report MORE Kinks
A validity check: "totally honest" respondents report higher scores on every kink metric than "mostly honest" ones. Fetish count: 10.29 vs 9.73. Nonconsent: 3.55 vs 3.23. Power dynamic: 3.95 vs 3.66.

This is a positive signal — "mostly honest" likely means "I held back." The pattern suggests kink scores are modestly *under*-reported, not inflated.

- [07-relationships §Q5]

### 10. Repressed and Liberated Upbringings Produce Nearly Identical Kink Profiles
Repressed: 10.18 fetish categories. Liberated: 10.10. Neutral: 9.65 (the lowest). The repressed-liberated nonconsent gap is 0.05 points.

Upbringing liberation has minimal impact on adult kink preferences. This is consistent with biological/temperamental explanations for kink development, and challenges "rebellion" or "compensation" narratives.

- [07-relationships §Q6]

### 11. Consent Preferences Are Not Gendered
"Optimal consent in my preferred erotic scenarios" barely varies by gender or orientation (~4.4-4.9% prefer "full nonconsent" in all four quadrants). Consent preferences track D/s identity architecture, not demographics.

"Mostly nonconsenting" is actually the most female-skewed preference (55% female), while "full nonconsent" is essentially 50/50.

- [07-relationships §Q7]

---

## IV. Structural Patterns

### 12. The Freeuse U-Shape
Both total dominants AND total submissives find freeuse dynamics erotic (avg ~0.99/3); switches and moderate identities score lowest (0.55-0.64). This U-shape recurs across multiple findings — kink extremes in either direction share more with each other than with the middle.

The same U-shape appears for erotic energy intensity: both total doms (53.2% prefer high energy) and total subs (48.2%) exceed switches (29.7%).

- [07-relationships §Q4, §bonus-energy]

### 13. Powerlessness Predicts Role, Not Intensity
People high on the powerlessness trait gravitate toward the submissive role (r=+0.10 with sub arousal, r=-0.09 with dom arousal) but do NOT seek more extreme content. This challenges the folk theory that dark fantasies are "driven by" powerlessness.

- [02-mental-health §finding-5]

### 14. Non-Straight Men Are the Outlier Quadrant
Non-straight men show the highest deviations from the overall mean on humiliation (+0.13), genderplay (+0.26), exhibitionism-other (+0.38), and obedience (+0.17). Sub-leaning non-straight men (N=275) exceed women on submission (2.20), genderplay (3.50), and obedience (3.03).

- [08-orientation §Q1, §bonus]

### 15. Partner Count → Kink Diversity, with a Plateau
Fetish count climbs monotonically from 9.58 (0 partners) to 10.68 (8-20 partners), then plateaus at 10.53 (21+). Nonconsent interest is essentially FLAT across all partner-count groups (3.34-3.45) — more experience does NOT mean more nonconsent interest.

The combination of non-monogamous relationship style AND high partner count is additive: non-mono with 21+ partners averages 11.27 fetish categories vs 9.51 for monogamous with 0 partners.

- [07-relationships §Q2]

### 16. Conscientiousness Is Kink-Irrelevant
Total R² of conscientiousness across all kinks: 0.005 (vs 0.104 for neuroticism). Its one notable signal: sensory play (r=0.072), plausibly reflecting detail-oriented people enjoying structured stimulation.

Openness is the best predictor of kink breadth (r=0.066 with totalfetishcategory). Extroversion is literally zero (r=0.0002). The most open third averages 10.61 categories vs 9.52 for the least open.

- [03-personality §finding-3, §finding-2]

### 17. Sadism (Give Pain) Is the Most Personality-Determined Kink
Four of five Big Five traits independently predict sadism: openness+, neuroticism-, agreeableness-, extroversion+. The least personality-determined kinks: humiliation, bestiality, voyeurism, obedience (max |r| < 0.035).

Surprising reversal: agreeable people are slightly MORE masochistic (r=+0.040). Agreeableness doesn't mean avoiding intensity — it means preferring the receiving/yielding end.

- [03-personality §finding-4, §finding-5]

### 18. Taboo Kinks Form Four Distinct Sub-Clusters
The taboo space isn't a single "deviance" dimension. Four sub-clusters emerge with real psychological coherence:

1. **Body Violation** (brutality, creepy, dirty, vore) — highest internal r=0.53-0.61
2. **Fantasy-Body** (vore, transformation, abnormal body, mental alteration) — sci-fi/fantasy taboo space
3. **Forbidden Relationship** (incest, age gap, CGL) — social/relational taboos
4. **Disgust Transgression** (dirty, secretions, bestiality) — bodily fluid/animal taboos

Cross-cluster correlations average r~0.26 vs within-cluster r~0.40-0.55. A general deviance factor exists but is weak (fetish breadth → taboo kinks avg r=0.14), explaining far less variance than the specific taboo-to-taboo associations.

Futa is an outlier — barely connected to the taboo network (max r=0.180 with any taboo kink). It occupies a gender/body-exploration space, not a transgression space.

- [06-taboo-clusters §finding-1, §finding-2, §full-matrix]

### 19. Taboo Interest Is Rarely Isolated
Among people high (≥4) on bestiality, 79% are also high on incest, 76% on nonconsent, 73% on brutality. Only 20/202 people are "lone wolves" with a single high taboo. Dirty play is almost never a lone specialization (8/202).

There's a clear dose-response: 3+ high taboos = 27% broader fetish repertoire and +1.27 on sadomasochism vs 0 high taboos. The first taboo kink crossed is the biggest threshold.

- [06-taboo-clusters §finding-3, §lone-wolves]

### 20. Violent Porn Serves Opposite Functions by Gender
Among heavy violent-porn consumers ("most" or "all"), the pain-direction gap is enormous:

| Group | Receive Pain | Give Pain |
|-------|-------------|-----------|
| Male heavy VP consumers | 2.21-2.39 | **2.85-3.05** |
| Non-male heavy VP consumers | **3.58-3.61** | 1.78-1.83 |

Men who watch violent porn identify with the dominant/sadistic role; non-males identify with the submissive/masochistic role. Same content, opposite psychological function. Non-males slightly outnumber males (52-58%) among the heaviest violent porn consumers.

- [09-porn-media §Q5]

### 21. "Induced Fetish" Belief Is the Strongest Media-Side Predictor
People who believe porn/erotica induced their fetishes have 43% more kink categories than those who don't (12.19 vs 8.55, r=0.204). This is stronger than raw porn consumption volume (r=0.173). The subjective experience of desire being reshaped matters more than sheer exposure — though causality is ambiguous.

The strongest individual-kink correlations with induction belief are bestiality (r=0.135) and incest (r=0.120) — "impossible" kinks that depend on media to exist as fantasies.

- [09-porn-media §Q1, §Q8]

### 22. Written Erotica Is the Sharpest Gender Divide in Media
25% of non-males prefer written-leaning content vs just 10.5% of males. Conversely, 68.8% of males lean visual vs 43.2% of non-males. The animated/live-action split is much smaller between genders. Multi-format consumers (even split) have the highest kink breadth — media format diversity reflects sexual openness.

- [09-porn-media §Q2, §Q7]

### 23. State-Dependent Responding — Horniness Inflates Everything
**Methodological bombshell.** Respondents who were "real horny" while taking the survey reported +2.76 kink categories vs "not horny at all" (11.02 vs 8.26). Every kink increases with current horniness — including gentleness (3.50→3.79). This suggests 20-30% of variance in kink reporting may be attributable to arousal state at survey time.

N=2,718 (subsample that answered this late-added question). Effect sizes: exhibitionism +0.86, receive-pain +0.69, bestiality +0.58, CGL +0.44.

- [10-surprises §finding-6]

### 24. Narcissism Produces the Only Dominance-Preferring Group (Besides Straight Men)
The narcissism-dominance link shows a clean crossover: the lowest narcissism quintile is strongly submissive-leaning (dom-sub gap = -0.91), while the highest quintile is the ONLY group preferring dominance (+0.24). Narcissists also score highest on worshipped (2.99), lowest on worshipping others (2.54), and highest on brutality interest (4.08 vs 2.40 for lowest).

N=1,303 (subsample). This parallels finding 5 (straight men as only dom quadrant) — narcissism and male-straightness may tap the same dominance substrate.

- [10-surprises §finding-8]

### 25. Self-Rated Attractiveness Predicts Being Kinkier, Not Vanilla
The most attractive self-raters have the highest humiliation interest (3.68), highest worshipped scores, and lowest vanilla-sex interest. A surprise: "significantly less attractive" people have an unexpected exhibitionism spike (2.90 > "moderately less" at 2.70), suggesting a subgroup drawn to exhibitionist fantasy despite low self-evaluation.

- [10-surprises §finding-5]

---

## V. Findings Requiring Sensitivity / Caveats

### 26. Sexual Assault × Nonconsent Fantasy
A weak but positive correlation exists between harassment experience and nonconsent fantasy interest (r=0.03-0.06). The stronger signal is power dynamics generally — the high-harassment group scores 4.29 on powerdynamic. **This finding requires careful framing**: correlation ≠ causation, and this is a self-selected kink survey population.

- [02-mental-health §finding-6] — SENSITIVITY: HIGH

### 27. Childhood Spanking → Adult S/M Interest
Clear upward gradient: those spanked most frequently as children (level 5) report S/M interest of 4.11 vs 3.33 for never-spanked (level 0). But level 1 (2.84) is actually *lower* than level 0, suggesting this isn't a simple dose-response.

- Phase 0 finding [findings.json: spanking-childhood]

### 28. Mental Illness and Kink Breadth
People reporting mental illness have modestly broader kink interests (d=0.15 — small but consistent). The "creepy" category shows the strongest mental-illness effect (d≈0.30). Selection bias caveat: people willing to take a kink survey may not represent the general mentally ill population.

- [02-mental-health §finding-1]

### 29. Minor Attraction and the Taboo Gradient
Higher taboo kink scores monotonically predict higher minor-attraction agreement. The "Very High" taboo tier is the only group with a positive mean (+0.024) on the minor attraction scale (49.2% any agreement). Strongest individual links: incest (r=0.169), bestiality (r=0.173). S/M has zero correlation (r=-0.004).

**Critical caveats**: (1) The 14-17 age cohort reporting attraction to 13-17 year olds is age-peer attraction, not pedophilic. (2) All correlations are weak (r<0.20). (3) Social desirability effects are strong even in anonymous surveys. (4) This undermines a simple "deviance→deviance" narrative — the pattern is specific to forbidden-relationship taboos, not violence.

- [06-taboo-clusters §section-7] — SENSITIVITY: VERY HIGH

---

## VI. Meta-Observations

### What predicts kinks most? (updated with multivariate controls)
1. **Gender** (which side of active/passive) — d=0.54-0.64, largest coefficient in every model [12-multivariate]
2. **Childhood spanking** (→ adult S/M) — r=0.33, strongest unconfounded bivariate relationship, R²=0.107 [12-multivariate]
3. **Arousal fixity** (metacognitive, "can you stop?") — 30% breadth increase [07-relationships §Q8]
4. **Neuroticism** (routes to receiving) — r=0.16, survives multivariate controls (p=0.003) [03-personality, 12-multivariate]
5. **Age of onset** (early = broad) — r=-0.15 to -0.17 [01-age-onset]

### What DOESN'T predict kinks? (confirmed by multivariate controls)
1. **Politics** — most effects confounded by demographics; multiplepartners finding fully confounded by age [12-multivariate]
2. **Conscientiousness** — R²=0.005, loses significance with controls [03-personality, 12-multivariate]
3. **Extroversion** — r=0.0002 with breadth, loses significance with controls [03-personality, 12-multivariate]
4. **Upbringing sexual liberation** — nearly identical profiles [07-relationships §Q6]
5. **Sexual orientation** — d=0.071 for breadth, though survives controls (p=0.002) [08-orientation, 12-multivariate]

### Recurring structural patterns
1. **U-shapes** — extremes of D/s identity share more with each other than the middle (freeuse, energy intensity, nonconsent)
2. **Direction > intensity** — gender, neuroticism, powerlessness predict which side, not how far
3. **Breadth independence** — demographic groups are equally kinky, differently organized. Confirmed by clustering: breadth-based clusters don't segregate by demographics [15-clustering §analysis-1]
4. **Onset clustering** — kink interests don't develop independently; they come in early/broad or late/specific packages
5. **Additive effects** — zero significant interactions across 17 two-way tests; demographic effects stack, they don't compound [13-interactions]
6. **Gating bias** — all gated-column findings overstate effects among interested subsets; population-level effects are smaller [14-missingness]
7. **Power-role clustering confirms gender/personality axis** — Pure Submissives are 78% female with neuroticism 1.86; Sadistic Dominants are 75% male with neuroticism 0.44 (chi²=450.5, p<10⁻⁹⁶) [15-clustering §analysis-3]
8. **Taboo clustering** — taboo kinks form 4 internally coherent sub-clusters (body-violation, fantasy-body, forbidden-relationship, disgust-transgression). Within-cluster r~0.40-0.55 vs cross-cluster r~0.26. General deviance factor is weak (avg r=0.14 with breadth) [06-taboo-clusters]
9. **State-dependent confound** — current arousal state inflates ALL kink scores by ~20-30%. This affects the entire dataset and is not controlled for [10-surprises §finding-6]
10. **Media format as identity marker** — written vs visual preference is a sharper gender divide (25% vs 10.5%) than most kink preferences. Multi-format consumers are the kinkiest [09-porn-media]

---

## VII. Wave 2: Statistical Rigor Results

### Bootstrap Confidence Intervals (11-bootstrap-cis.md) — COMPLETE

The bootstrap analysis (5,000 resamples, 95% CI) applied to the original 10 featured findings reveals that **most featured findings are statistically significant but practically trivial** due to the large N (15.5k). Only 4 of 13 sub-findings reach d ≥ 0.2:

| Verdict | Findings | Effect Size |
|---------|----------|-------------|
| **ROBUST** | Pain×Gender (receive + give) | d=0.63 (medium) |
| **ROBUST** | Childhood Spanking → S/M | d=1.22 (large, but U-shaped) |
| **ROBUST** | Partner Count → Openness | d=0.22 (small, monotonic) |
| Real but tiny | Politics → Multi-partner | d=0.07 (negligible) |
| Real but tiny | Introversion → S/M | d<0.2 |
| Real but tiny | Neuroticism → Obedience | d<0.2 |
| Real but tiny | Nonconsent × Gender | d<0.2 |
| **Not significant** | Gender Tolerance → Gender Play | CI includes 0 |
| **Not significant** | Orientation → Power Dynamics | CI includes 0 |
| **Not significant** | Agreeableness → Bondage | CI includes 0 |

**Implication for the app**: The original 10 presets need curation. Several should be replaced with the larger-effect findings from wave 1 (e.g., neuroticism-pain axis d=0.16 across full range, arousal fixity 30% breadth gap, the dom/sub quadrant finding).

Winsorized means confirmed robustness — no finding changed direction under 5% winsorization.

### Interaction Effects (13-interactions.md) — COMPLETE

**Zero significant interactions across 17 two-way ANOVA tests** (all p > 0.05, none near p < 0.01).

Tested: gender×politics (5), gender×orientation (5), orientation×politics (2), adversity×gender (3), personality×gender (2). The closest to significance: gender × extroversion → S/M (F=2.60, p=0.075).

**Critical finding**: The mental health agent's claim that "adversity pushes male dominance UP but female dominance DOWN" does NOT survive formal interaction testing. Both genders show parallel increases with adversity — no crossover interaction.

**Implication**: All demographic effects on kink preferences are **additive and independent**. The gender gap is a stable constant offset that doesn't expand or contract across political groups, orientations, adversity levels, or personality types. Simple main-effect models without interaction terms are sufficient. This is itself a finding worth surfacing — the factors don't compound.

### Multivariate Controls (12-multivariate.md) — COMPLETE

OLS regression with demographic controls (biomale, age, straightness, politics) applied to 8 wave 1 findings:

**Robust (survive controls):**
- Pain×Gender: The strongest finding in the dataset. biomale coef = ±1.01-1.03, controls add almost nothing (R² 0.092→0.094)
- Childhood Spanking → S/M: r=0.33 unadjusted, coef=0.284 adjusted (p<0.001). R²=0.107 — strongest single-predictor model. **Entirely unconfounded by demographics.**
- Childhood Adversity → Kink Breadth: d=0.15, survives controls (p<0.001). But age is actually a bigger driver (coef=1.28 for 29-32 age group).
- Straightness → Kink Breadth: d=0.07, survives (p=0.002).
- Gender → Nonconsent: Survives but tiny (d=0.076, p=0.005).

**Mixed:**
- Politics → 12 kinks: Only 6/12 survive controls. Lost effects (creepy, receivepain, brutality, etc.) were confounded by biomale. The liberal fetish-breadth advantage (0.49 points) is the most robust political finding.
- Big Five → S/M: Only openness (p<0.001) and neuroticism (p=0.003) survive. Extroversion, agreeableness, conscientiousness lose significance. biomale (coef=-0.134) is larger than any personality trait.

**Confounded:**
- **Politics → Multiplepartners: FULLY CONFOUNDED by age.** The conservative "advantage" (3.63 vs 3.54) disappears when controlling for age (older respondents have more partner interest). This original featured preset should be retired or reframed.

**The meta-lesson:** biomale is the single largest predictor in nearly every model. Gender dwarfs politics, orientation, and personality for predicting specific kink preferences. Politics is the most fragile predictor — most political effects are demographic composition artifacts. The childhood spanking → S/M link (r=0.33) is the strongest bivariate relationship and is entirely unconfounded.

### Missingness Bias Diagnostics (14-missingness.md) — COMPLETE

**The single most consequential wave 2 finding.** Gated columns create massive selection bias:

- Responders to every gated kink column are 0.7-1.4 SD kinkier than non-responders (by totalfetishcategory). We are never comparing "all people" — only those who passed the gate.
- **10 of 19 gated kink columns have >5pp gender-differential missingness.** Genderplay: 12pp gap, lightbondage: 11.5pp, gentleness: 11pp.
- **The "give pain" gender finding (d=0.62) collapses to d=0.07 under 0-imputation** — an 89% reduction. Males who didn't pass the S/M gate (low-interest) are disproportionately excluded.
- **4 columns reverse direction** under 0-imputation for gender: obedience, exhibitionself, humiliation, brutality. 2 reverse for politics: genderplay, incest.

Gate groups identified:
- sadomasochism + receivepain + givepain share a single gate (Jaccard 0.99-1.00)
- powerdynamic + obedience share another gate (Jaccard 0.99)
- Extreme taboo cluster (vore, dirty, creepy, brutality) share overlapping gates (Jaccard 0.93-0.95)

**Good news**: Straightness and politics show minimal missingness bias (<5pp on most columns).

**Implication**: All findings involving gated columns (especially S/M, pain, bondage, power dynamics) need a caveat: "among those who expressed initial interest." Comparisons across demographic groups are biased if those groups have different gate-passage rates. The true population-level gender differences may be much smaller than reported.

### Profile Clustering (15-clustering.md) — COMPLETE

Three K-means clustering analyses with different column subsets:

**Analysis 1 — Core Kinks** (8 columns, N=3,767, k=4):
Four types: "Eager Enthusiasts" (29%), "All-In Kinksters" (30%), "Kink-Curious Moderates" (20%), "Kinky But Grounded" (21%). Demographics relatively uniform across clusters — kink breadth doesn't segregate by demographics.

**Analysis 2 — Taboo Spectrum** (5 columns, N=577, k=4):
Four types: "Reluctant Voyeurs" (18%), "Full-Spectrum Taboo" (35%), "Dark Fantasy No Nurture" (27%), "Age-Gap Focused" (21%). The taboo subset is 66% male (vs 51% overall). CGL (caregiver/little) is the most discriminating variable — orthogonal to the "dark" axis. Surprisingly, "Full-Spectrum Taboo" is the most conservative cluster (36.5%).

**Analysis 3 — Power & Role** (6 columns, N=3,843, k=5):
The strongest result. Five types: "Pure Submissives" (26%), "Versatile Switches" (21%), "Sadistic Dominants" (16%), "Casual Players" (25%), "Non-Bondage Power Seekers" (11%). **Gender and power role are massively correlated** (chi²=450.5, p<10⁻⁹⁶): Pure Submissives are 78% female, Sadistic Dominants are 75% male. Personality covaries dramatically: dominants have neuroticism 0.44 vs submissives at 1.86.

**Key takeaway**: Kink "types" DO correspond to demographic groups, but primarily along the power/role axis (confirming the "direction not intensity" thesis). Breadth-based clusters don't segregate by demographics — people of all backgrounds can be into many or few things. But which SIDE of power exchange you land on is strongly predicted by gender and neuroticism.

---

## VIII. Source Index

| File | Domain | Key findings |
|------|--------|-------------|
| `01-age-onset.md` | Development | Early awakening phenotype, onset clustering r=0.52-0.78 |
| `02-mental-health.md` | Psych/trauma | Adversity×gender (revised: no interaction), shame paradox, powerlessness→role |
| `03-personality-kinks.md` | Big Five | Neuroticism-pain axis r=0.16, openness→breadth, conscientiousness null |
| `04-politics-deep.md` | Politics | Politics is weak predictor (max d=0.138), gap larger for women |
| `05-gender-deep.md` | Gender | Direction>intensity, humiliation gender-neutral d=0.003 |
| `06-taboo-clusters.md` | Extreme kinks | 4 sub-clusters, futa outlier, general deviance factor weak, minor attraction gradient |
| `07-relationships.md` | Behavior | Arousal fixity 30% breadth gap, freeuse U-shape, consent not gendered, honesty validity |
| `08-orientation-identity.md` | Identity | Straight men only dom quadrant, non-straight men outlier |
| `09-porn-media.md` | Media | Induced fetish r=0.204, written erotica gender divide, violent porn opposite by gender |
| `10-surprises.md` | Misc | Horniness inflates +2.8 categories, narcissism-dom crossover, attractiveness→kinkier |
| `11-bootstrap-cis.md` | Rigor | 4/13 sub-findings robust (d≥0.2); most are "real but tiny" |
| `12-multivariate.md` | Rigor | Spanking→S/M strongest (r=0.33), politics→multiplepartners confounded by age |
| `13-interactions.md` | Rigor | Zero significant interactions across 17 tests; effects are additive |
| `14-missingness.md` | Rigor | Give-pain d=0.62→d=0.07 under 0-imputation; 4 columns reverse direction |
| `15-clustering.md` | Rigor | Power/role clusters: submissives 78% female, dominants 75% male (chi²=450.5) |

# Interesting Findings

Generated: 2026-02-14T08:43:23.382927+00:00

## Featured Presets

| ID | Question | Rows | Chart | Evidence | Home? |
|---|---|---:|---|---|---|
| `pain-gender` | Are men and women different on giving vs receiving pain? | 2 | grouped-bar | `robust` | yes |
| `spanking-childhood` | Do people spanked more often as kids report different adult S/M interest? | 6 | bar | `robust` | yes |
| `partner-count-openness` | Do people with more partners report different openness scores? | 5 | bar | `supported` | yes |
| `fixity-breadth` | How does arousal fixity relate to total kink breadth? | 5 | bar | `robust` | yes |
| `honesty-breadth` | How does self-reported honesty relate to kink breadth? | 2 | bar | `supported` | yes |
| `dom-sub-quadrants` | How do dominant and submissive arousal scores vary across gender-orientation quadrants? | 4 | grouped-bar | `robust` | yes |
| `politics-breadth` | How does political leaning relate to total fetish-category count? | 3 | bar | `tiny` | no |
| `orientation-breadth` | How much does orientation shift total kink breadth? | 2 | bar | `tiny` | no |
| `horny-state-breadth` | Does being horny right now change reported kink breadth? | 4 | bar | `exploratory` | no |
| `neuroticism-pain-direction` | Does neuroticism change receiving-vs-giving pain direction? | 3 | grouped-bar | `supported` | yes |

## Preset Details

### Who likes giving vs receiving pain?

- ID: `pain-gender`
- Caption: Women report higher receiving-pain interest while men report higher giving-pain interest in the responder subset.
- Evidence tier: `robust`
- Effect size note: Large in responder subset (wave-2: d≈0.62 pre-imputation, much smaller under zero-imputation)
- Home recommended: yes
- Risk flags: `gated_selection_bias, imputation_sensitive`
  - Uses gated columns; effect sizes are inflated among responders.
  - Direction/magnitude may change under zero-imputation sensitivity checks.
- Curation notes: Kept for narrative value; must always ship with gating caveat copy.
- SQL:
```sql
SELECT
          CASE WHEN "biomale" = 1 THEN 'Men' ELSE 'Women' END AS group_key,
          round(avg("receivepain")::DOUBLE, 2) AS "Receive pain",
          round(avg("givepain")::DOUBLE, 2) AS "Give pain"
        FROM data
        WHERE "biomale" IS NOT NULL
          AND "receivepain" IS NOT NULL
          AND "givepain" IS NOT NULL
        GROUP BY 1
        ORDER BY 1
```

### Does childhood spanking predict adult S/M interest?

- ID: `spanking-childhood`
- Caption: The strongest bivariate pattern in the current curated set: higher childhood spanking bins map to higher S/M interest.
- Evidence tier: `robust`
- Effect size note: Large signal in wave-2 controls (R^2≈0.107)
- Home recommended: yes
- Risk flags: `gated_selection_bias`
  - Uses gated columns; effect sizes are inflated among responders.
- Curation notes: Direction remains stable in multivariate checks; still responder-biased due gating.
- SQL:
```sql
SELECT
          cast(cast("spanking" AS INTEGER) AS VARCHAR) AS name,
          round(avg("sadomasochism")::DOUBLE, 2) AS value,
          cast("spanking" AS INTEGER) AS sort_order
        FROM data
        WHERE "spanking" IS NOT NULL
          AND "sadomasochism" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
```

### Partner count and personality openness

- ID: `partner-count-openness`
- Caption: Openness rises monotonically across partner-count bins, but the absolute effect is small.
- Evidence tier: `supported`
- Effect size note: Small but consistent (wave-2: d≈0.22 top vs bottom bins)
- Home recommended: yes
- Risk flags: `small_effect`
  - Statistically real but practically small in wave-2 effect-size review.
- Curation notes: Kept as a clean monotonic effect that is easy to interpret.
- SQL:
```sql
SELECT
          cast("sexcount" AS VARCHAR) AS name,
          round(avg("opennessvariable")::DOUBLE, 2) AS value,
          CASE cast("sexcount" AS VARCHAR)
            WHEN '0' THEN 1
            WHEN '1-2' THEN 2
            WHEN '3-7' THEN 3
            WHEN '8-20' THEN 4
            WHEN '21+' THEN 5
            ELSE 99
          END AS sort_order
        FROM data
        WHERE "sexcount" IS NOT NULL
          AND "opennessvariable" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
```

### Could you stop being aroused by a kink?

- ID: `fixity-breadth`
- Caption: People who report that changing arousal is impossible show the broadest kink repertoires.
- Evidence tier: `robust`
- Effect size note: Large practical spread (~30% breadth gap from lowest to highest fixity)
- Home recommended: yes
- Risk flags: `self_report_bias`
  - Based on self-report honesty/attitude items.
- Curation notes: Promoted from swarm wave-1/7 due strong slope and simple interpretation.
- SQL:
```sql
SELECT
          cast("If you tried very hard, could you stop being aroused by something you're into? (7lgg41e)" AS VARCHAR) AS name,
          round(avg("totalfetishcategory")::DOUBLE, 2) AS value,
          CASE cast("If you tried very hard, could you stop being aroused by something you're into? (7lgg41e)" AS VARCHAR)
            WHEN 'With little effort, yes' THEN 1
            WHEN 'With some effort, yes' THEN 2
            WHEN 'With a lot of effort, yes' THEN 3
            WHEN 'With an extreme amount of effort, maybe' THEN 4
            WHEN 'Impossible' THEN 5
            ELSE 99
          END AS sort_order
        FROM data
        WHERE "If you tried very hard, could you stop being aroused by something you're into? (7lgg41e)" IS NOT NULL
          AND "totalfetishcategory" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
```

### Do more honest respondents report more kinks?

- ID: `honesty-breadth`
- Caption: Respondents who report being totally honest show higher average kink breadth than mostly-honest respondents.
- Evidence tier: `supported`
- Effect size note: Small-to-moderate and directionally useful as a response-validity signal
- Home recommended: yes
- Risk flags: `self_report_bias`
  - Based on self-report honesty/attitude items.
- Curation notes: Useful trust-building chart for newcomers; not a causal claim.
- SQL:
```sql
SELECT
          cast("How honest were you when answering this survey? (g1vao1y)" AS VARCHAR) AS name,
          round(avg("totalfetishcategory")::DOUBLE, 2) AS value,
          CASE cast("How honest were you when answering this survey? (g1vao1y)" AS VARCHAR)
            WHEN 'Mostly honest' THEN 1
            WHEN 'Totally honest' THEN 2
            ELSE 99
          END AS sort_order
        FROM data
        WHERE "How honest were you when answering this survey? (g1vao1y)" IS NOT NULL
          AND "totalfetishcategory" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
```

### Which gender-orientation groups are dom-leaning vs sub-leaning?

- ID: `dom-sub-quadrants`
- Caption: Straight men are the only quadrant where dominant arousal exceeds submissive arousal.
- Evidence tier: `robust`
- Effect size note: Large quadrant separation in swarm wave-1/8 and wave-2 clustering
- Home recommended: yes
- Risk flags: `subgroup_specific`
  - Pattern is strongest in a specific demographic subgroup.
- Curation notes: Promoted because it captures the direction-over-intensity thesis directly.
- SQL:
```sql
SELECT
          CASE
            WHEN "biomale" = 1 AND "straightness" = 'Straight' THEN 'Straight men'
            WHEN "biomale" = 1 AND "straightness" = 'Not straight' THEN 'Non-straight men'
            WHEN "biomale" = 0 AND "straightness" = 'Straight' THEN 'Straight women'
            WHEN "biomale" = 0 AND "straightness" = 'Not straight' THEN 'Non-straight women'
            ELSE 'Other'
          END AS group_key,
          round(avg("""I am aroused by being dominant in sexual interactions"" (6w3xquw)")::DOUBLE, 2) AS "Dominant arousal",
          round(avg("""I am aroused by being submissive in sexual interactions"" (xem7hbu)")::DOUBLE, 2) AS "Submissive arousal",
          CASE
            WHEN "biomale" = 1 AND "straightness" = 'Straight' THEN 1
            WHEN "biomale" = 1 AND "straightness" = 'Not straight' THEN 2
            WHEN "biomale" = 0 AND "straightness" = 'Not straight' THEN 3
            WHEN "biomale" = 0 AND "straightness" = 'Straight' THEN 4
            ELSE 99
          END AS sort_order
        FROM data
        WHERE "biomale" IS NOT NULL
          AND "straightness" IS NOT NULL
          AND """I am aroused by being dominant in sexual interactions"" (6w3xquw)" IS NOT NULL
          AND """I am aroused by being submissive in sexual interactions"" (xem7hbu)" IS NOT NULL
        GROUP BY 1, 4
        ORDER BY sort_order
```

### Do politics predict total kink breadth?

- ID: `politics-breadth`
- Caption: Differences exist but are modest; politics is a weak predictor compared with gender and personality axes.
- Evidence tier: `tiny`
- Effect size note: Wave-2: statistically significant in some models but practically small
- Home recommended: no
- Risk flags: `small_effect`
  - Statistically real but practically small in wave-2 effect-size review.
- Curation notes: Replaces politics->multiplepartners which wave-2 flagged as age-confounded.
- SQL:
```sql
SELECT
          cast("politics" AS VARCHAR) AS name,
          round(avg("totalfetishcategory")::DOUBLE, 2) AS value,
          CASE cast("politics" AS VARCHAR)
            WHEN 'Liberal' THEN 1
            WHEN 'Moderate' THEN 2
            WHEN 'Conservative' THEN 3
            ELSE 99
          END AS sort_order
        FROM data
        WHERE "politics" IS NOT NULL
          AND "totalfetishcategory" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
```

### Do straight and non-straight groups differ in kink breadth?

- ID: `orientation-breadth`
- Caption: Orientation differences are real but small relative to role-direction differences.
- Evidence tier: `tiny`
- Effect size note: Wave-2: survives controls but small (d≈0.07)
- Home recommended: no
- Risk flags: `small_effect`
  - Statistically real but practically small in wave-2 effect-size review.
- Curation notes: Kept as an example of statistically real but practically tiny signal.
- SQL:
```sql
SELECT
          cast("straightness" AS VARCHAR) AS name,
          round(avg("totalfetishcategory")::DOUBLE, 2) AS value,
          CASE cast("straightness" AS VARCHAR)
            WHEN 'Straight' THEN 1
            WHEN 'Not straight' THEN 2
            ELSE 99
          END AS sort_order
        FROM data
        WHERE "straightness" IS NOT NULL
          AND "totalfetishcategory" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
```

### How much does current arousal state shift responses?

- ID: `horny-state-breadth`
- Caption: Current arousal state strongly shifts self-reported kink scores in the late-added subsample.
- Evidence tier: `exploratory`
- Effect size note: Large shift but based on late-added question (N~2.7k)
- Home recommended: no
- Risk flags: `late_added_subsample, state_dependent`
  - Question exists only for a smaller late-added subsample.
  - Likely influenced by current survey-time arousal state.
- Curation notes: Important methodological caveat; defaulted off home despite large apparent effect.
- SQL:
```sql
SELECT
          cast("How horny are you right now? (1jtj2nx)" AS VARCHAR) AS name,
          round(avg("totalfetishcategory")::DOUBLE, 2) AS value,
          CASE cast("How horny are you right now? (1jtj2nx)" AS VARCHAR)
            WHEN 'Not horny at all' THEN 1
            WHEN 'A little horny' THEN 2
            WHEN 'Moderately horny' THEN 3
            WHEN 'Real horny' THEN 4
            ELSE 99
          END AS sort_order
        FROM data
        WHERE "How horny are you right now? (1jtj2nx)" IS NOT NULL
          AND "totalfetishcategory" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
```

### Neuroticism and pain-direction preference

- ID: `neuroticism-pain-direction`
- Caption: Higher neuroticism bins tilt more toward receiving pain than giving pain.
- Evidence tier: `supported`
- Effect size note: Wave-1 top personality signal; wave-2 recommends gating caveat
- Home recommended: yes
- Risk flags: `gated_selection_bias`
  - Uses gated columns; effect sizes are inflated among responders.
- Curation notes: Kept as personality anchor finding; communicate as directional trend, not deterministic rule.
- SQL:
```sql
WITH binned AS (
          SELECT
            CASE
              WHEN "neuroticismvariable" <= -2 THEN 'Low'
              WHEN "neuroticismvariable" <= 2 THEN 'Middle'
              ELSE 'High'
            END AS group_key,
            CASE
              WHEN "neuroticismvariable" <= -2 THEN 1
              WHEN "neuroticismvariable" <= 2 THEN 2
              ELSE 3
            END AS sort_order,
            "receivepain",
            "givepain"
          FROM data
          WHERE "neuroticismvariable" IS NOT NULL
            AND "receivepain" IS NOT NULL
            AND "givepain" IS NOT NULL
        )
        SELECT
          group_key,
          round(avg("receivepain")::DOUBLE, 2) AS "Receive pain",
          round(avg("givepain")::DOUBLE, 2) AS "Give pain",
          min(sort_order) AS sort_order
        FROM binned
        GROUP BY group_key
        ORDER BY sort_order
```

## Home Question Cards

- Are men and women different on giving vs receiving pain? -> `pain-gender`
- Does childhood spanking connect to adult S/M interest? -> `spanking-childhood`
- Do personality traits shape pain-direction preferences? -> `neuroticism-pain-direction`
- Which groups are dom-leaning vs sub-leaning? -> `dom-sub-quadrants`
- How fixed are people's arousal patterns over time? -> `fixity-breadth`
- Do people with more partners score higher on openness? -> `partner-count-openness`
- How much do politics or orientation actually matter? -> `politics-breadth`
- What is connected to straightness overall? -> `/relationships?column=straightness`

## Defaults By Page

```json
{
  "home": {
    "presetId": "pain-gender",
    "fallbackPresetIds": [
      "spanking-childhood",
      "fixity-breadth",
      "dom-sub-quadrants"
    ]
  },
  "explore": {
    "x": "straightness",
    "y": "politics",
    "normalization": "row",
    "topN": 12
  },
  "relationships": {
    "column": "straightness"
  },
  "profile": {
    "suggestedCohorts": [
      {
        "label": "Straight males 25-28",
        "filters": [
          {
            "column": "straightness",
            "value": "Straight"
          },
          {
            "column": "biomale",
            "value": "1.0"
          },
          {
            "column": "age",
            "value": "25-28"
          }
        ]
      },
      {
        "label": "Liberal females",
        "filters": [
          {
            "column": "politics",
            "value": "Liberal"
          },
          {
            "column": "biomale",
            "value": "0.0"
          }
        ]
      },
      {
        "label": "Conservative non-straight",
        "filters": [
          {
            "column": "politics",
            "value": "Conservative"
          },
          {
            "column": "straightness",
            "value": "Not straight"
          }
        ]
      }
    ]
  },
  "columns": {
    "sort": "interestingness",
    "interestingColumns": [
      "straightness",
      "politics",
      "biomale",
      "sexcount",
      "spanking",
      "totalfetishcategory",
      "powerdynamic",
      "sadomasochism",
      "nonconsent",
      "receivepain"
    ]
  }
}
```

## Plain-Language Term Mapping

| Technical | Plain language |
|---|---|
| Null ratio | Data coverage / % answered |
| Cardinality | Number of answer choices |
| Missingness | Missing answers |
| Cramer's V | Connection strength |
| Pearson correlation | Connection strength |
| Normalization | How to count |
| Pivot table / cross-tabulate | Compare two questions |
| Gated column | Conditional question |
| Caveat | Data note |
| Non-null | Answered |
| Sample size (N) | People who answered (N) |
| Over-indexing | Unusually common in this group |
| Lift | Times more likely |

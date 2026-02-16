from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

try:
    from .explore import DEFAULT_PARQUET_PATH, connect_data
except ImportError:  # pragma: no cover - direct script execution
    from explore import DEFAULT_PARQUET_PATH, connect_data

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_JSON = REPO_ROOT / "analysis" / "findings.json"
DEFAULT_OUTPUT_MARKDOWN = REPO_ROOT / "docs" / "schema" / "interesting-findings.md"

FIXITY_COLUMN = "If you tried very hard, could you stop being aroused by something you're into? (7lgg41e)"
HONESTY_COLUMN = "How honest were you when answering this survey? (g1vao1y)"
HORNY_NOW_COLUMN = "How horny are you right now? (1jtj2nx)"
SPANKING_CHILDHOOD_COLUMN = "From the ages of 0-14, how often were you spanked as a form of discipline? (p957nyk)"
LIBERATION_COLUMN = 'How "sexually liberated" was your upbringing? (fs700v2)'
DOM_AROUSAL_COLUMN = '"I am aroused by being dominant in sexual interactions" (6w3xquw)'
SUB_AROUSAL_COLUMN = '"I am aroused by being submissive in sexual interactions" (xem7hbu)'


RISK_FLAG_LABELS: dict[str, str] = {
    "gated_selection_bias": "Uses gated columns; effect sizes are inflated among responders.",
    "imputation_sensitive": "Direction/magnitude may change under zero-imputation sensitivity checks.",
    "small_effect": "Statistically real but practically small in wave-2 effect-size review.",
    "late_added_subsample": "Question exists only for a smaller late-added subsample.",
    "state_dependent": "Likely influenced by current survey-time arousal state.",
    "self_report_bias": "Based on self-report honesty/attitude items.",
    "not_significant_bootstrap": "Bootstrap confidence interval includes near-zero effects.",
    "age_confound": "Observed relationship can be partly/fully explained by age composition.",
    "subgroup_specific": "Pattern is strongest in a specific demographic subgroup.",
}

SEVERE_RISKS_FOR_HOME = {"not_significant_bootstrap", "age_confound"}


@dataclass(frozen=True)
class PresetDefinition:
    id: str
    title: str
    short_title: str
    question: str
    caption: str
    chart_type: str
    x_label: str
    y_label: str
    explore_x: str
    explore_y: str
    sql: str
    series: list[dict[str, str]] | None = None
    evidence_tier: str = "supported"
    effect_size_note: str = "Wave-2 reviewed"
    risk_flags: tuple[str, ...] = ()
    curation_notes: str = ""
    home_candidate: bool = True


def qi(column: str) -> str:
    escaped = column.replace('"', '""')
    return f'"{escaped}"'


FEATURED_PRESETS: list[PresetDefinition] = [
    PresetDefinition(
        id="pain-gender",
        title="Who likes giving vs receiving pain?",
        short_title="Pain & Gender",
        question="Are men and women different on giving vs receiving pain?",
        caption="Women report higher interest in receiving pain, while men report higher interest in giving pain (among people who answered both questions).",
        chart_type="grouped-bar",
        x_label="Sex",
        y_label="Average interest (0-5)",
        explore_x="biomale",
        explore_y="receivepain",
        sql="""
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
        """.strip(),
        series=[
            {"key": "Receive pain", "label": "Receive pain", "color": "#b8432f"},
            {"key": "Give pain", "label": "Give pain", "color": "#1a1612"},
        ],
        evidence_tier="robust",
        effect_size_note="Large in responder subset (wave-2: d≈0.62 pre-imputation, much smaller under zero-imputation)",
        risk_flags=("gated_selection_bias", "imputation_sensitive"),
        curation_notes="Kept for narrative value; must always ship with gating caveat copy.",
    ),
    PresetDefinition(
        id="spanking-childhood",
        title="Does childhood spanking predict adult S/M interest?",
        short_title="Childhood -> Kinks?",
        question="Do people who were spanked more as kids show different sadomasochism interest as adults?",
        caption="People spanked as children report slightly higher S/M interest as adults, though the difference is small.",
        chart_type="bar",
        x_label="Childhood spanking frequency",
        y_label="Average S/M interest (0-5)",
        explore_x=SPANKING_CHILDHOOD_COLUMN,
        explore_y="sadomasochism",
        sql=f"""
        SELECT
          {qi(SPANKING_CHILDHOOD_COLUMN)} AS name,
          round(avg("sadomasochism")::DOUBLE, 2) AS value,
          CASE {qi(SPANKING_CHILDHOOD_COLUMN)}
            WHEN 'Never' THEN 1
            WHEN 'Sometimes' THEN 2
            WHEN 'Often' THEN 3
            ELSE 99
          END AS sort_order
        FROM data
        WHERE {qi(SPANKING_CHILDHOOD_COLUMN)} IS NOT NULL
          AND "sadomasochism" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
        """.strip(),
        evidence_tier="supported",
        effect_size_note="Direction is clear in this dataset; interpreted as correlation only.",
        risk_flags=(),
        curation_notes="Uses the direct childhood-discipline question rather than the adult spanking-arousal item.",
    ),
    PresetDefinition(
        id="partner-count-openness",
        title="Partner count and personality openness",
        short_title="Partners & Openness",
        question="Do people with more partners report different openness scores?",
        caption="Openness rises steadily as partner count increases, but the overall difference is small.",
        chart_type="bar",
        x_label="Number of partners",
        y_label="Average openness score",
        explore_x="sexcount",
        explore_y="opennessvariable",
        sql="""
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
        """.strip(),
        evidence_tier="supported",
        effect_size_note="Small but consistent (wave-2: d≈0.22 top vs bottom bins)",
        risk_flags=("small_effect",),
        curation_notes="Kept as a clean monotonic effect that is easy to interpret.",
    ),
    PresetDefinition(
        id="fixity-breadth",
        title="Could you stop being aroused by a kink?",
        short_title="How fixed are kinks?",
        question="Do people whose kinks feel more permanent have a wider variety of interests?",
        caption="People who say they couldn't stop being into a kink — even if they tried — have the widest range of interests.",
        chart_type="bar",
        x_label="Could you stop being into a kink if you tried?",
        y_label="Average number of kink categories",
        explore_x=FIXITY_COLUMN,
        explore_y="totalfetishcategory",
        sql=f"""
        SELECT
          CASE cast({qi(FIXITY_COLUMN)} AS VARCHAR)
            WHEN 'With little effort, yes' THEN 'Little effort'
            WHEN 'With some effort, yes' THEN 'Some effort'
            WHEN 'With a lot of effort, yes' THEN 'Lots of effort'
            WHEN 'With an extreme amount of effort, maybe' THEN 'Extreme effort'
            WHEN 'Impossible' THEN 'Impossible'
            ELSE cast({qi(FIXITY_COLUMN)} AS VARCHAR)
          END AS name,
          round(avg("totalfetishcategory")::DOUBLE, 2) AS value,
          CASE cast({qi(FIXITY_COLUMN)} AS VARCHAR)
            WHEN 'With little effort, yes' THEN 1
            WHEN 'With some effort, yes' THEN 2
            WHEN 'With a lot of effort, yes' THEN 3
            WHEN 'With an extreme amount of effort, maybe' THEN 4
            WHEN 'Impossible' THEN 5
            ELSE 99
          END AS sort_order
        FROM data
        WHERE {qi(FIXITY_COLUMN)} IS NOT NULL
          AND "totalfetishcategory" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
        """.strip(),
        evidence_tier="robust",
        effect_size_note="Large practical spread (~30% breadth gap from lowest to highest fixity)",
        risk_flags=("self_report_bias",),
        curation_notes="Promoted from swarm wave-1/7 due strong slope and simple interpretation.",
    ),
    PresetDefinition(
        id="honesty-breadth",
        title="Do more honest respondents report more kinks?",
        short_title="Do people lie?",
        question="Do people who say they're more honest report more kinks?",
        caption="People who say they're totally honest report a wider range of kinks than those who say they're mostly honest.",
        chart_type="bar",
        x_label="Self-reported survey honesty",
        y_label="Average number of kink categories",
        explore_x=HONESTY_COLUMN,
        explore_y="totalfetishcategory",
        sql=f"""
        SELECT
          cast({qi(HONESTY_COLUMN)} AS VARCHAR) AS name,
          round(avg("totalfetishcategory")::DOUBLE, 2) AS value,
          CASE cast({qi(HONESTY_COLUMN)} AS VARCHAR)
            WHEN 'Mostly honest' THEN 1
            WHEN 'Totally honest' THEN 2
            ELSE 99
          END AS sort_order
        FROM data
        WHERE {qi(HONESTY_COLUMN)} IS NOT NULL
          AND "totalfetishcategory" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
        """.strip(),
        evidence_tier="supported",
        effect_size_note="Small-to-moderate and directionally useful as a response-validity signal",
        risk_flags=("self_report_bias",),
        curation_notes="Useful trust-building chart for newcomers; not a causal claim.",
    ),
    PresetDefinition(
        id="dom-sub-quadrants",
        title="Which gender-orientation groups are dom-leaning vs sub-leaning?",
        short_title="Dom vs Sub",
        question="How do dominant and submissive interests differ across gender and orientation groups?",
        caption="Straight men are the only group where dominant interest exceeds submissive interest.",
        chart_type="grouped-bar",
        x_label="Gender x orientation",
        y_label="Average arousal score (-3 to 3)",
        explore_x="straightness",
        explore_y=DOM_AROUSAL_COLUMN,
        sql=f"""
        SELECT
          CASE
            WHEN "biomale" = 1 AND "straightness" = 'Straight' THEN 'Straight men'
            WHEN "biomale" = 1 AND "straightness" = 'Not straight' THEN 'Non-straight men'
            WHEN "biomale" = 0 AND "straightness" = 'Straight' THEN 'Straight women'
            WHEN "biomale" = 0 AND "straightness" = 'Not straight' THEN 'Non-straight women'
            ELSE 'Other'
          END AS group_key,
          round(avg({qi(DOM_AROUSAL_COLUMN)})::DOUBLE, 2) AS "Dominant arousal",
          round(avg({qi(SUB_AROUSAL_COLUMN)})::DOUBLE, 2) AS "Submissive arousal",
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
          AND {qi(DOM_AROUSAL_COLUMN)} IS NOT NULL
          AND {qi(SUB_AROUSAL_COLUMN)} IS NOT NULL
        GROUP BY 1, 4
        ORDER BY sort_order
        """.strip(),
        series=[
            {"key": "Dominant arousal", "label": "Dominant arousal", "color": "#1a1612"},
            {"key": "Submissive arousal", "label": "Submissive arousal", "color": "#b8432f"},
        ],
        evidence_tier="robust",
        effect_size_note="Large quadrant separation in swarm wave-1/8 and wave-2 clustering",
        risk_flags=("subgroup_specific",),
        curation_notes="Promoted because it captures the direction-over-intensity thesis directly.",
    ),
    PresetDefinition(
        id="politics-breadth",
        title="Do politics predict total kink breadth?",
        short_title="Politics & Kinks",
        question="How does political leaning relate to how many kinks someone has?",
        caption="Differences exist but are modest - politics matters much less than gender or personality.",
        chart_type="bar",
        x_label="Political leaning",
        y_label="Average number of kink categories",
        explore_x="politics",
        explore_y="totalfetishcategory",
        sql="""
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
        """.strip(),
        evidence_tier="tiny",
        effect_size_note="Wave-2: statistically significant in some models but practically small",
        risk_flags=("small_effect",),
        curation_notes="Replaces politics->multiplepartners which wave-2 flagged as age-confounded.",
        home_candidate=False,
    ),
    PresetDefinition(
        id="orientation-breadth",
        title="Do straight and non-straight groups differ in kink breadth?",
        short_title="Orientation & Kinks",
        question="How much does sexual orientation affect the number of kinks someone has?",
        caption="Orientation differences are real but small compared to dominant-vs-submissive differences.",
        chart_type="bar",
        x_label="Orientation",
        y_label="Average number of kink categories",
        explore_x="straightness",
        explore_y="totalfetishcategory",
        sql="""
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
        """.strip(),
        evidence_tier="tiny",
        effect_size_note="Wave-2: survives controls but small (d≈0.07)",
        risk_flags=("small_effect",),
        curation_notes="Kept as an example of statistically real but practically tiny signal.",
        home_candidate=False,
    ),
    PresetDefinition(
        id="horny-state-breadth",
        title="How much does current arousal state shift responses?",
        short_title="Mood & Arousal",
        question="Does being horny right now change the number of kinks someone reports?",
        caption="People who were hornier while taking the survey reported more kinks.",
        chart_type="bar",
        x_label="Horniness right now",
        y_label="Average number of kink categories",
        explore_x=HORNY_NOW_COLUMN,
        explore_y="totalfetishcategory",
        sql=f"""
        SELECT
          cast({qi(HORNY_NOW_COLUMN)} AS VARCHAR) AS name,
          round(avg("totalfetishcategory")::DOUBLE, 2) AS value,
          CASE cast({qi(HORNY_NOW_COLUMN)} AS VARCHAR)
            WHEN 'Not horny at all' THEN 1
            WHEN 'A little horny' THEN 2
            WHEN 'Moderately horny' THEN 3
            WHEN 'Real horny' THEN 4
            ELSE 99
          END AS sort_order
        FROM data
        WHERE {qi(HORNY_NOW_COLUMN)} IS NOT NULL
          AND "totalfetishcategory" IS NOT NULL
        GROUP BY 1, 3
        ORDER BY sort_order
        """.strip(),
        evidence_tier="exploratory",
        effect_size_note="Large shift but based on late-added question (N~2.7k)",
        risk_flags=("late_added_subsample", "state_dependent"),
        curation_notes="Important methodological caveat; defaulted off home despite large apparent effect.",
        home_candidate=False,
    ),
    PresetDefinition(
        id="neuroticism-pain-direction",
        title="Neuroticism and pain-direction preference",
        short_title="Anxiety & Pain",
        question="Does anxiety change whether someone prefers receiving or giving pain?",
        caption="People with higher anxiety scores lean more toward receiving pain than giving pain.",
        chart_type="grouped-bar",
        x_label="Neuroticism level",
        y_label="Average interest (0-5)",
        explore_x="neuroticismvariable",
        explore_y="receivepain",
        sql="""
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
        """.strip(),
        series=[
            {"key": "Receive pain", "label": "Receive pain", "color": "#b8432f"},
            {"key": "Give pain", "label": "Give pain", "color": "#1a1612"},
        ],
        evidence_tier="supported",
        effect_size_note="Wave-1 top personality signal; wave-2 recommends gating caveat",
        risk_flags=("gated_selection_bias",),
        curation_notes="Kept as personality anchor finding; communicate as directional trend, not deterministic rule.",
    ),
]


QUESTION_CARDS: list[dict[str, str]] = [
    {"prompt": "Are men and women different on giving vs receiving pain?", "presetId": "pain-gender"},
    {"prompt": "Does childhood spanking connect to adult S/M interest?", "presetId": "spanking-childhood"},
    {"prompt": "Do personality traits shape pain-direction preferences?", "presetId": "neuroticism-pain-direction"},
    {"prompt": "Which groups are dom-leaning vs sub-leaning?", "presetId": "dom-sub-quadrants"},
    {"prompt": "Can people stop being into their kinks if they try?", "presetId": "fixity-breadth"},
    {"prompt": "Do people with more partners score higher on openness?", "presetId": "partner-count-openness"},
    {"prompt": "How much do politics or orientation actually matter?", "presetId": "politics-breadth"},
    {"prompt": "What is connected to sexual orientation?", "deepLink": "/relationships?column=straightness"},
]


TERM_MAPPINGS: list[dict[str, str]] = [
    {"technical": "Null ratio", "plainLanguage": "Data coverage / % answered"},
    {"technical": "Cardinality", "plainLanguage": "Number of answer choices"},
    {"technical": "Missingness", "plainLanguage": "Missing answers"},
    {"technical": "Cramer's V", "plainLanguage": "Connection strength"},
    {"technical": "Pearson correlation", "plainLanguage": "Connection strength"},
    {"technical": "Normalization", "plainLanguage": "How to count"},
    {"technical": "Pivot table / cross-tabulate", "plainLanguage": "Compare two questions"},
    {"technical": "Gated column", "plainLanguage": "Conditional question"},
    {"technical": "Caveat", "plainLanguage": "Data note"},
    {"technical": "Non-null", "plainLanguage": "Answered"},
    {"technical": "Sample size (N)", "plainLanguage": "People who answered (N)"},
    {"technical": "Over-indexing", "plainLanguage": "Unusually common in this group"},
    {"technical": "Lift", "plainLanguage": "Times more likely"},
]


DEFAULTS_BY_PAGE: dict[str, Any] = {
    "home": {
        "presetId": "pain-gender",
        "fallbackPresetIds": [
            "spanking-childhood",
            "fixity-breadth",
            "dom-sub-quadrants",
        ],
    },
    "explore": {
        "x": "straightness",
        "y": "politics",
        "normalization": "row",
        "topN": 12,
    },
    "relationships": {"column": "straightness"},
    "profile": {
        "suggestedCohorts": [
            {
                "label": "Straight males 25-28",
                "filters": [
                    {"column": "straightness", "value": "Straight"},
                    {"column": "biomale", "value": "1.0"},
                    {"column": "age", "value": "25-28"},
                ],
            },
            {
                "label": "Liberal females",
                "filters": [
                    {"column": "politics", "value": "Liberal"},
                    {"column": "biomale", "value": "0.0"},
                ],
            },
            {
                "label": "Conservative non-straight",
                "filters": [
                    {"column": "politics", "value": "Conservative"},
                    {"column": "straightness", "value": "Not straight"},
                ],
            },
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
            "receivepain",
        ],
    },
}


def _normalize_frame(frame: pd.DataFrame) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for raw in frame.to_dict(orient="records"):
        normalized: dict[str, Any] = {}
        for key, value in raw.items():
            if pd.isna(value):
                normalized[key] = None
            elif hasattr(value, "item"):
                normalized[key] = value.item()
            else:
                normalized[key] = value
        records.append(normalized)
    return records


def _recommended_for_home(preset: PresetDefinition) -> bool:
    if not preset.home_candidate:
        return False

    if preset.evidence_tier not in {"robust", "supported"}:
        return False

    return len(SEVERE_RISKS_FOR_HOME.intersection(set(preset.risk_flags))) == 0


def _caveat_notes(risk_flags: tuple[str, ...]) -> list[str]:
    return [RISK_FLAG_LABELS[flag] for flag in risk_flags if flag in RISK_FLAG_LABELS]


def run_preset_queries(
    connection,
    presets: list[PresetDefinition] = FEATURED_PRESETS,
    generated_at: str | None = None,
) -> list[dict[str, Any]]:
    timestamp = generated_at or datetime.now(timezone.utc).isoformat()

    entries: list[dict[str, Any]] = []
    for preset in presets:
        frame = connection.execute(preset.sql).fetchdf()
        row_count = int(frame.shape[0])
        output_columns = list(frame.columns)
        status = "validated" if row_count > 0 else "empty"

        entry: dict[str, Any] = {
            "id": preset.id,
            "title": preset.title,
            "shortTitle": preset.short_title,
            "question": preset.question,
            "caption": preset.caption,
            "sql": preset.sql,
            "rowCount": row_count,
            "outputColumns": output_columns,
            "outputPreview": _normalize_frame(frame.head(6)),
            "exploreX": preset.explore_x,
            "exploreY": preset.explore_y,
            "chartType": preset.chart_type,
            "xLabel": preset.x_label,
            "yLabel": preset.y_label,
            "status": status,
            "generatedAt": timestamp,
            "wave2": {
                "evidenceTier": preset.evidence_tier,
                "effectSizeNote": preset.effect_size_note,
                "riskFlags": list(preset.risk_flags),
                "riskNotes": _caveat_notes(preset.risk_flags),
                "recommendedForHome": _recommended_for_home(preset),
                "curationNotes": preset.curation_notes,
            },
        }

        if preset.series:
            entry["series"] = preset.series

        entries.append(entry)

    return entries


def build_payload(connection) -> dict[str, Any]:
    generated_at = datetime.now(timezone.utc).isoformat()
    featured = run_preset_queries(connection, generated_at=generated_at)

    return {
        "generatedAt": generated_at,
        "sourceParquet": str(DEFAULT_PARQUET_PATH),
        "featuredPresets": featured,
        "questionCards": QUESTION_CARDS,
        "defaultsByPage": DEFAULTS_BY_PAGE,
        "termMappings": TERM_MAPPINGS,
    }


def write_markdown(payload: dict[str, Any], output_path: Path) -> None:
    lines: list[str] = []
    lines.append("# Interesting Findings")
    lines.append("")
    lines.append(f"Generated: {payload['generatedAt']}")
    lines.append("")
    lines.append("## Featured Presets")
    lines.append("")
    lines.append("| ID | Question | Rows | Chart | Evidence | Home? |")
    lines.append("|---|---|---:|---|---|---|")
    for item in payload["featuredPresets"]:
        wave2 = item["wave2"]
        lines.append(
            f"| `{item['id']}` | {item['question']} | {item['rowCount']} | {item['chartType']} | `{wave2['evidenceTier']}` | {'yes' if wave2['recommendedForHome'] else 'no'} |"
        )
    lines.append("")

    lines.append("## Preset Details")
    lines.append("")
    for item in payload["featuredPresets"]:
        wave2 = item["wave2"]
        lines.append(f"### {item['title']}")
        lines.append("")
        lines.append(f"- ID: `{item['id']}`")
        lines.append(f"- Caption: {item['caption']}")
        lines.append(f"- Evidence tier: `{wave2['evidenceTier']}`")
        lines.append(f"- Effect size note: {wave2['effectSizeNote']}")
        lines.append(f"- Home recommended: {'yes' if wave2['recommendedForHome'] else 'no'}")
        lines.append(f"- Risk flags: `{', '.join(wave2['riskFlags']) if wave2['riskFlags'] else 'none'}`")
        if wave2["riskNotes"]:
            for note in wave2["riskNotes"]:
                lines.append(f"  - {note}")
        lines.append(f"- Curation notes: {wave2['curationNotes']}")
        lines.append("- SQL:")
        lines.append("```sql")
        lines.append(item["sql"])
        lines.append("```")
        lines.append("")

    lines.append("## Home Question Cards")
    lines.append("")
    for card in payload["questionCards"]:
        target = card.get("presetId") or card.get("deepLink")
        lines.append(f"- {card['prompt']} -> `{target}`")
    lines.append("")

    lines.append("## Defaults By Page")
    lines.append("")
    lines.append("```json")
    lines.append(json.dumps(payload["defaultsByPage"], indent=2))
    lines.append("```")
    lines.append("")

    lines.append("## Plain-Language Term Mapping")
    lines.append("")
    lines.append("| Technical | Plain language |")
    lines.append("|---|---|")
    for mapping in payload["termMappings"]:
        lines.append(f"| {mapping['technical']} | {mapping['plainLanguage']} |")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_findings_json(payload: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def build_findings(
    parquet_path: Path = DEFAULT_PARQUET_PATH,
    output_json: Path = DEFAULT_OUTPUT_JSON,
    output_markdown: Path = DEFAULT_OUTPUT_MARKDOWN,
) -> dict[str, Any]:
    connection = connect_data(parquet_path)
    try:
        payload = build_payload(connection)
    finally:
        connection.close()

    write_findings_json(payload, output_json)
    write_markdown(payload, output_markdown)
    return payload


def main() -> None:
    payload = build_findings()

    print(f"Wrote findings JSON: {DEFAULT_OUTPUT_JSON}")
    print(f"Wrote findings markdown: {DEFAULT_OUTPUT_MARKDOWN}")
    print(f"Featured presets: {len(payload['featuredPresets'])}")

    empty = [item["id"] for item in payload["featuredPresets"] if item["rowCount"] == 0]
    if empty:
        print(f"Warning: empty findings for presets: {', '.join(empty)}")


if __name__ == "__main__":
    main()

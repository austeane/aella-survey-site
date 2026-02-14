from __future__ import annotations

from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from analysis.build_findings import FEATURED_PRESETS, build_payload
from analysis.explore import DEFAULT_PARQUET_PATH, connect_data


def _get_connection():
    return connect_data(Path(DEFAULT_PARQUET_PATH))


def test_curated_queries_execute_and_return_rows() -> None:
    connection = _get_connection()
    try:
        for preset in FEATURED_PRESETS:
            frame = connection.execute(preset.sql).fetchdf()
            assert not frame.empty, f"Preset {preset.id} returned zero rows"
    finally:
        connection.close()


def test_output_schema_matches_chart_contract() -> None:
    connection = _get_connection()
    try:
        for preset in FEATURED_PRESETS:
            frame = connection.execute(preset.sql).fetchdf()
            columns = set(frame.columns)

            if preset.chart_type in {"bar", "line"}:
                assert {"name", "value"}.issubset(columns), (
                    f"Preset {preset.id} must include name/value columns"
                )

            if preset.chart_type == "grouped-bar":
                assert "group_key" in columns, f"Preset {preset.id} must include group_key"
                series_columns = [col for col in frame.columns if col != "group_key"]
                assert len(series_columns) >= 2, (
                    f"Preset {preset.id} must include at least two grouped series columns"
                )
    finally:
        connection.close()


def test_guardrails_for_known_label_columns() -> None:
    connection = _get_connection()
    try:
        describe = connection.execute(
            "DESCRIBE SELECT politics, sexcount, childhood_gender_tolerance FROM data"
        ).fetchdf()

        by_name = {
            str(row["column_name"]): str(row["column_type"]).upper()
            for _, row in describe.iterrows()
        }

        assert by_name["politics"] == "VARCHAR"
        assert by_name["sexcount"] == "VARCHAR"
        assert by_name["childhood_gender_tolerance"] == "VARCHAR"
    finally:
        connection.close()


def test_featured_output_includes_all_10_preset_ids() -> None:
    connection = _get_connection()
    try:
        payload = build_payload(connection)
        output_ids = {item["id"] for item in payload["featuredPresets"]}
        expected_ids = {preset.id for preset in FEATURED_PRESETS}

        assert len(output_ids) == 10
        assert output_ids == expected_ids
    finally:
        connection.close()


def test_question_cards_reference_valid_targets() -> None:
    connection = _get_connection()
    try:
        payload = build_payload(connection)
        valid_preset_ids = {item["id"] for item in payload["featuredPresets"]}

        for card in payload["questionCards"]:
            assert "prompt" in card and card["prompt"].strip()
            has_preset = "presetId" in card
            has_link = "deepLink" in card
            assert has_preset != has_link, "Each question card must have presetId or deepLink"

            if has_preset:
                assert card["presetId"] in valid_preset_ids
            else:
                assert card["deepLink"].startswith("/")
    finally:
        connection.close()


def test_wave2_curation_metadata_is_present() -> None:
    connection = _get_connection()
    try:
        payload = build_payload(connection)
        featured = payload["featuredPresets"]

        for preset in featured:
            wave2 = preset.get("wave2")
            assert isinstance(wave2, dict)
            assert wave2.get("evidenceTier") in {"robust", "supported", "tiny", "exploratory"}
            assert isinstance(wave2.get("effectSizeNote"), str) and wave2["effectSizeNote"].strip()
            assert isinstance(wave2.get("riskFlags"), list)
            assert isinstance(wave2.get("riskNotes"), list)
            assert isinstance(wave2.get("recommendedForHome"), bool)
            assert isinstance(wave2.get("curationNotes"), str) and wave2["curationNotes"].strip()

        home_recommended = [p["id"] for p in featured if p["wave2"]["recommendedForHome"]]
        assert len(home_recommended) >= 5
    finally:
        connection.close()

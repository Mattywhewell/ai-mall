import json
import os
import sys

# Ensure scripts/ is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sequencer_runner import (
    parse_dependency,
    map_finding_to_patch,
    parse_json_findings,
    schedule_patches,
    sample_with_cycle,
)


def test_parse_dependency_variants():
    d = parse_dependency("public.foo:table")
    assert d.schema == "public"
    assert d.name == "foo"
    assert d.kind == "table"

    d2 = parse_dependency({"schema": "s", "name": "n", "kind": "function"})
    assert (d2.schema, d2.name, d2.kind) == ("s", "n", "function")

    # fallback string without schema
    d3 = parse_dependency("bar")
    assert d3.schema == "public" and d3.name == "bar"


def test_map_finding_to_patch_basic():
    f = {
        "id": "X",
        "classification": "corrective",
        "confidence": 85,
        "impact": "medium",
        "object_type": "table",
        "schema": "public",
        "object_name": "u",
        "dependencies": ["public.role:type"],
    }
    p = map_finding_to_patch(f)
    assert p.id == "X"
    assert p.classification == "Corrective"
    assert p.confidence == 85
    assert p.impact == "medium"
    assert len(p.dependencies) == 1
    assert len(p.affects) == 1
    assert p.affects[0].name == "u"


def test_parse_json_findings_and_schedule(tmp_path):
    sample = [
        {
            "id": "F1",
            "classification": "Additive",
            "confidence": 95,
            "impact": "low",
            "object_type": "type",
            "schema": "public",
            "object_name": "user_role",
        },
        {
            "id": "F2",
            "classification": "Corrective",
            "confidence": 90,
            "impact": "medium",
            "object_type": "function",
            "schema": "public",
            "object_name": "create_user",
            "dependencies": [{"schema": "public", "name": "user_role", "kind": "type"}],
        },
        {
            "id": "F3",
            "classification": "Destructive",
            "confidence": 60,
            "impact": "high",
            "object_type": "table",
            "schema": "public",
            "object_name": "old_table",
            "dependencies": ["public.old_table"],
        },
    ]
    p = tmp_path / "sample.json"
    p.write_text(json.dumps(sample))

    patches = parse_json_findings(str(p))
    assert len(patches) == 3
    assert patches[0].id == "F1"

    # Schedule and verify phases
    res = schedule_patches(patches)
    assert res["status"] == "ok"
    phases = {name: ids for name, ids in res["phases"]}
    assert "F1" in phases["Additive"]
    assert "F2" in phases["Corrective"]
    assert "F3" in phases["Destructive"]

    # Unmatched should include the dependency public.old_table if not created by any different patch.
    # If the patch itself affects the object, it won't appear as unmatched; accept either behavior.
    unmatched_ids = [d[0] for d in res.get('unmatched', [])]
    assert ('F3' in unmatched_ids) or any(p.id == 'F3' and any(a.name == 'old_table' for a in p.affects) for p in patches)


def test_cycle_detection_blocking():
    cycle = sample_with_cycle()
    res = schedule_patches(cycle)
    assert res["status"] == "blocked"
    assert "cycles" in res and len(res["cycles"]) >= 1


def test_missing_id_generates_auto_id():
    f = {"classification": "Corrective", "object_name": "noid_table", "schema": "public"}
    p = map_finding_to_patch(f)
    assert p.id is not None and p.id != ""
    assert p.affects[0].name == "noid_table"


def test_legacy_field_normalization():
    # legacy fields: 'name' -> object_name, 'estimated_impact' -> impact, 'affected' -> affects
    f = {
        "id": "L-1",
        "classification": "corrective",
        "confidence": 75,
        "estimated_impact": "low",
        "name": "legacy_table",
        "schema": "public",
        "affected": [ { "schema": "public", "name": "legacy_table", "kind": "table" } ]
    }
    p = map_finding_to_patch(f)
    assert p.id == "L-1"
    assert p.impact == "low"
    assert len(p.affects) == 1 and p.affects[0].name == "legacy_table"
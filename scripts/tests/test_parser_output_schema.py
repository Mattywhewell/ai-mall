import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from jsonschema import Draft7Validator


def load_schema():
    here = os.path.abspath(os.path.dirname(__file__))
    schema_path = os.path.abspath(os.path.join(here, '..', '..', 'docs', 'parser-output.schema.json'))
    with open(schema_path, 'r', encoding='utf-8') as fh:
        return json.load(fh)


def validate(path: str, schema: dict):
    with open(path, 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    v = Draft7Validator(schema)
    errors = sorted(v.iter_errors(data), key=lambda e: e.path)
    assert not errors, "Schema validation errors: " + "; ".join([f"{'.'.join(str(p) for p in e.path) or '<root>'}: {e.message}" for e in errors])


def test_normal_findings_valid():
    schema = load_schema()
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'samples', 'normal-findings.json'))
    validate(path, schema)


def test_cycle_findings_valid():
    schema = load_schema()
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'samples', 'cycle-findings.json'))
    validate(path, schema)


def test_sample_introspection_valid():
    schema = load_schema()
    # Use a tracked sample for CI (original introspection outputs are ignored in .gitignore)
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'samples', 'introspection-sample.json'))
    validate(path, schema)


def test_invalid_missing_classification():
    schema = load_schema()
    # classification is required by schema; omit it intentionally
    doc = [{"id": "X1", "confidence": 90}]
    v = Draft7Validator(schema)
    errors = sorted(v.iter_errors(doc), key=lambda e: e.path)
    assert errors, "Expected validation errors for missing classification"


def test_invalid_wrong_types_and_enums():
    schema = load_schema()
    # confidence as string, invalid enum values
    doc = [{"classification": "Fix", "confidence": "85", "impact": "critical"}]
    v = Draft7Validator(schema)
    errors = sorted(v.iter_errors(doc), key=lambda e: e.path)
    assert errors, "Expected validation errors for wrong types and invalid enums"
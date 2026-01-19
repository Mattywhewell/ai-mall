#!/usr/bin/env python3
"""Simple validator for parser output using the JSON Schema in docs/parser-output.schema.json

Usage: python scripts/validate_parser_output.py <findings.json>
"""
import json
import os
import sys

try:
    from jsonschema import Draft7Validator
except Exception:
    print("Missing dependency 'jsonschema'. Install with: python -m pip install -r requirements.txt", file=sys.stderr)
    sys.exit(2)


def load_schema():
    here = os.path.abspath(os.path.dirname(__file__))
    schema_path = os.path.abspath(os.path.join(here, '..', 'docs', 'parser-output.schema.json'))
    if not os.path.exists(schema_path):
        print(f"Schema not found at: {schema_path}", file=sys.stderr)
        sys.exit(2)
    with open(schema_path, 'r', encoding='utf-8') as fh:
        # NOTE: For schema v2 support, detect a `schema_version` field or add a CLI flag
        # and select the appropriate schema file here (e.g., parser-output.schema.v2.json).
        return json.load(fh)


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/validate_parser_output.py <findings.json>")
        sys.exit(2)

    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"File not found: {path}", file=sys.stderr)
        sys.exit(2)

    with open(path, 'r', encoding='utf-8') as fh:
        data = json.load(fh)

    schema = load_schema()
    validator = Draft7Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda e: e.path)

    if errors:
        print("Validation failed:")
        for e in errors:
            path = ".".join(str(p) for p in e.path) or "<root>"
            print(f"- {path}: {e.message}")
        sys.exit(1)

    print("OK: parser output is valid")


if __name__ == '__main__':
    main()

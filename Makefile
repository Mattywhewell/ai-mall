# Simple Makefile for common developer tasks
# Usage: make help

.PHONY: help introspect introspect-vm parse lint format

help:
	@echo "Available make targets:"
	@echo "  help            - Show this message"
	@echo "  introspect      - Run local introspection (./scripts/introspect-local.sh)"
	@echo "  introspect-vm   - Run VM bootstrap and introspection (scripts/run-introspect-vm.sh)"
	@echo "  parse           - Parse an introspection folder (node scripts/parse-introspection.js <dir>)"
	@echo "  lint            - Run project lint (npm run dev:lint)"
	@echo "  format          - Run automatic formatting/fixes (npm run dev:format)"

introspect:
	./scripts/introspect-local.sh

introspect-vm:
	@echo "Usage: make introspect-vm SUPABASE_DATABASE_URL=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=..."
	export SUPABASE_DATABASE_URL=${SUPABASE_DATABASE_URL}
	./scripts/run-introspect-vm.sh "${SUPABASE_DATABASE_URL}" "${NEXT_PUBLIC_SUPABASE_URL}" "${SUPABASE_SERVICE_ROLE_KEY}" "${GH_REPO}" || true

parse:
	node scripts/parse-introspection.js ${DIR:-.}

# Short aliases
p: parse

lint:
	npm run dev:lint

format:
	npm run dev:format

# Run project checks (lint + format + optional typecheck)
check:
	npm run dev:check

# Convenience alias for introspect
i: introspect

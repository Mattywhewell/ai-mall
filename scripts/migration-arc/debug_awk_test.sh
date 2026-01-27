#!/usr/bin/env bash
cat <<'EOF' > /tmp/awk_test_input.txt
        Principals:
                adele
                admin
        Critical Options: (none)
EOF
awk '/^[[:space:]]*Principals:/{p=1; next} p && /^[[:space:]]+[^:[:space:]]/{gsub(/^[[:space:]]+/,"",$0); print $0; next} p{exit}' /tmp/awk_test_input.txt | sed -n '1,200p'

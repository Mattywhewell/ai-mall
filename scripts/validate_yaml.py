import yaml
import sys
p = '.github/workflows/playwright.yml'
try:
    with open(p, 'r', encoding='utf-8') as f:
        y = yaml.safe_load(f)
    print('YAML parsed OK')
except Exception as e:
    print('YAML parse error:', e)
    sys.exit(1)

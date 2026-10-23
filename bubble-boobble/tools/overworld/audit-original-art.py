"""Audit current feature art without modifying baseline art or reference sources."""
from pathlib import Path
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[2]
repo = root.parent
path = root / 'docs/overworld/evidence/copied-art-removal-audit.json'
data = json.loads(path.read_text())
known = {row.get('copiedSha256', row.get('sha256')) for row in data['assets']}
baseline = set(subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', '76d82db', '--', 'bubble-boobble/assets'], cwd=repo, text=True).splitlines())
feature_matches, protected_matches = [], []
scanned = 0
for image in (root / 'assets').rglob('*.png'):
    scanned += 1
    digest = hashlib.sha256(image.read_bytes()).hexdigest()
    if digest in known:
        relative = str(image.relative_to(repo))
        (protected_matches if relative in baseline else feature_matches).append(relative)
result = {'baseline':'76d82db', 'pngsScanned':scanned, 'copiedIdentities':len(known), 'featureCopiedHashMatches':feature_matches, 'protectedBaselineHashMatches':protected_matches, 'pass':not feature_matches, 'boundary':'Current assets tree only; original reference library and Git history were not modified. Baseline asset matches are reported, never removed.'}
data['currentTreeHashAudit'] = result
path.write_text(json.dumps(data, indent=2) + '\n')
print(json.dumps(result, indent=2))
raise SystemExit(0 if result['pass'] else 1)

#!/usr/bin/env python3
"""Read sprite alpha bounds for screen-fit tests; never modifies source artwork."""
from hashlib import sha256
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
frames = root / 'assets/cartoon/frames'
rows = {}
for path in sorted(frames.rglob('*.png')):
    key = path.relative_to(frames).with_suffix('').as_posix()
    if not key.startswith(('dragon/', 'enemy/', 'boss/', 'badge/')):
        continue
    with Image.open(path) as image:
        alpha = image.convert('RGBA').getchannel('A')
        bounds = alpha.getbbox()
        if bounds is None:
            raise ValueError(f'Actor sprite has no visible alpha: {path}')
        rows[key] = {'size': list(image.size), 'alpha': list(bounds),
                     'sha256': sha256(path.read_bytes()).hexdigest()}
output = root / 'docs/concept-refinement/actor-alpha-bounds.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({'method': 'Pillow alpha>0 getbbox of unchanged source PNGs; right and bottom exclusive', 'frames': rows}, indent=2) + '\n')
print(json.dumps({'frames': len(rows), 'output': str(output.relative_to(root))}))

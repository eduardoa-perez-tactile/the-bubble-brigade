#!/usr/bin/env python3
"""Verify registered living-map source hashes, canvases and stable import settings."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads((ROOT / 'tools/overworld/living-sources/import-manifest.json').read_text())
entries = manifest['assets']
for row in json.loads((ROOT / 'data/overworld-shop-occluders.json').read_text())['districts'].values():
    source = ROOT / row['source']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == row['sourceSha256'], source
    entries.append({'path': row['output'], 'sha256': row['outputSha256']})
for row in entries:
    path = ROOT / row['path']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == row['sha256'], path
    image = Image.open(path).convert('RGBA')
    if 'size' in row:
        assert list(image.size) == row['size'], path
    assert image.getchannel('A').getbbox(), path
    metadata = path.with_suffix('.png.gmeta').read_text()
    assert 'trim = false' in metadata and 'guid = ' in metadata, path
for district in range(1, 6):
    frames = [ROOT / f'assets/overworld-living/district-{district}/coast-{i}.png' for i in range(4)]
    assert len({hashlib.sha256(p.read_bytes()).hexdigest() for p in frames}) >= 3, frames
print(json.dumps({'ok': True, 'sprites': len(entries), 'animatedCoastlines': 5, 'sourceHashesVerified': True}))

#!/usr/bin/env python3
"""Normalize review sheets and extract lossless seeds; never edit production art."""
import hashlib
import json
from pathlib import Path

from PIL import Image

project = Path(__file__).resolve().parents[3]
package = project / 'docs/overworld/living-map-harbor'
previews = package / 'previews'
manifest = json.loads((package / 'map-preservation.json').read_text())
painting = project / manifest['districts'][0]['painting']['path']
if hashlib.sha256(painting.read_bytes()).hexdigest() != manifest['districts'][0]['painting']['sha256']:
    raise SystemExit('Accepted painting changed; refusing seed extraction')
source = Image.open(painting)
provenance = json.loads((previews / 'generation-provenance.json').read_text())
for name, box in provenance['seedCrops'].items():
    source.crop(tuple(box)).save(previews / name)

for name in ('shore', 'lantern'):
    sheet = Image.open(previews / f'{name}-study.png').convert('RGB')
    width, height = sheet.size
    if width % 2 or height % 2:
        raise SystemExit(f'{name}: expected four equal cells in a 2 by 2 sheet')
    boxes = [(x * width // 2, y * height // 2, (x + 1) * width // 2, (y + 1) * height // 2)
             for y in range(2) for x in range(2)]
    sheet.crop(boxes[0]).save(previews / f'{name}-frame-0.png')
    # A single sheet palette avoids independent palette changes between GIF frames.
    indexed = sheet.quantize(colors=256)
    frames = [indexed.crop(box) for box in boxes]
    frames[0].save(previews / f'{name}-loop.gif', save_all=True,
                   append_images=frames[1:], duration=[600, 180, 220, 600], loop=0)
print('Prepared lossless seed crops, paused posters and four-drawing review loops')

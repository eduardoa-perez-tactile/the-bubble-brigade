#!/usr/bin/env python3
"""Extract UI face portraits from existing normalized character frames; no redraw.

Run inside bubble-boobble: python3 tools/cartoon/build-ui-portraits.py
Every output uses the exact same 80x80 head crop of its existing 128x128 source.
"""
from pathlib import Path
import json
import uuid
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SKINS = ['green','blue','red','yellow','purple','orange','cyan','pink','ivory','slate']
CROP = (28, 8, 108, 88)
records = []
for skin in SKINS:
    source = ROOT / 'assets/cartoon/frames/dragon' / skin / 'idle-0.png'
    target = ROOT / 'assets/cartoon/ui/portraits' / (skin + '.png')
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        if image.size != (128, 128):
            raise ValueError(f'Unexpected source dimensions: {source}: {image.size}')
        image.crop(CROP).save(target)
    sidecar = target.with_suffix('.png.gmeta')
    if not sidecar.exists():
        guid = uuid.uuid5(uuid.NAMESPACE_URL, 'bubble-brigade:ui-face:' + skin)
        sidecar.write_text(f'guid = "{guid}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon-hud"\nfilter = "linear"\ncompression = "none"\ntrim = false\n')
    records.append({'skin':skin,'source':str(source.relative_to(ROOT)), 'target':str(target.relative_to(ROOT)), 'crop':[28,8,80,80]})
provenance = ROOT / 'docs/concept-playable/portrait-provenance.json'
provenance.parent.mkdir(parents=True, exist_ok=True)
provenance.write_text(json.dumps({'operation':'exact pixel crop; no character redraw','portraits':records}, indent=2)+'\n')
print(f'Extracted {len(records)} face portraits.')

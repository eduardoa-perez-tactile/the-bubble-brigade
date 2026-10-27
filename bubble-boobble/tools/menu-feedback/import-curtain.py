#!/usr/bin/env python3
"""Import the Imagegen hem cutout without repainting the accepted curtain.

The generated alpha has near-opaque cloth and near-zero matte residue. Normalize
those endpoints while retaining the original painted RGB and edge antialiasing.
Requires Pillow. Source drawings and the exact image-edit prompt are preserved.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCES = Path(__file__).resolve().parent
original = Image.open(SOURCES / 'curtain-opaque-source.png').convert('RGBA')
cutout = Image.open(SOURCES / 'curtain-alpha-cutout.png').convert('RGBA')
assert original.size == cutout.size
rgb = original.convert('RGB').tobytes()
alpha = cutout.getchannel('A').point(
    lambda value: 0 if value <= 8 else 255 if value >= 238 else round((value - 8) * 255 / 230))
original.putalpha(alpha)
assert original.convert('RGB').tobytes() == rgb
assert alpha.crop((0, 0, original.width, int(original.height * .9))).getextrema() == (255, 255)
assert alpha.crop((0, original.height - 1, original.width, original.height)).getextrema() == (0, 0)
target = ROOT / 'assets/cartoon/menu/curtain.png'
original.save(target)
print(json.dumps({'ok': True, 'clothRgbPreserved': True,
                  'bottomRowTransparent': True, 'canvas': list(original.size),
                  'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))

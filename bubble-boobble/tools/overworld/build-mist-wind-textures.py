"""Rebuild the small mathematical mist mask and vector leaf; no map art is edited."""
from pathlib import Path
from math import sin, exp, pi
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2] / 'assets/overworld-living/common/weather'
ROOT.mkdir(parents=True, exist_ok=True)
# Seven unequal, gently curling ribbons form one broken low wisp, not a fog disk.
mist = Image.new('RGBA', (256, 64))
pixels = mist.load()
ribbons = [(0.16, .38, .13, .065, .72), (.34, .52, .16, .08, .85),
           (.56, .39, .16, .075, .84), (.77, .55, .12, .07, .70),
           (.88, .48, .07, .05, .48), (.42, .72, .11, .04, .26),
           (.68, .71, .16, .045, .32)]
for y in range(64):
    for x in range(256):
        u, v = x / 255, y / 63
        density = 0
        for cx, cy, rx, ry, strength in ribbons:
            curl = .035 * sin(u * 16 + cx * 11)
            density += strength * exp(-2 * (((u-cx)/rx)**2 + ((v-cy-curl)/ry)**2))
        feather = sin(pi*u)**.7 * sin(pi*v)**.7
        pixels[x, y] = (255, 255, 255, round(255 * min(.85, density) * feather))
mist.save(ROOT / 'ground-mist.png')
# A small tapered leaf with a restrained ink vein, rendered supersampled.
leaf = Image.new('RGBA', (128, 128))
d = ImageDraw.Draw(leaf)
d.polygon([(14, 96), (20, 65), (42, 35), (75, 20), (109, 18),
           (104, 54), (86, 82), (55, 99), (26, 101)], fill=(245, 245, 245, 255))
d.line([(12, 108), (38, 84), (63, 62), (90, 37)], fill=(161, 161, 161, 245), width=6)
d.line([(40, 82), (39, 59)], fill=(192, 192, 192, 210), width=3)
d.line([(61, 63), (84, 65)], fill=(192, 192, 192, 210), width=3)
leaf.resize((32, 32), Image.Resampling.LANCZOS).save(ROOT / 'wind-leaf.png')

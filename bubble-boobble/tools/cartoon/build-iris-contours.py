"""Rasterize original vector aperture contours; no reference artwork is copied.

Run with Python + Pillow. Four 640² RGBA masks cost 6.25 MiB uncompressed.
The transparent hole's nominal radius is 42% of the square's side. Keep that
ratio in sync with transition.view.tsx. Supersampling supplies a narrow ink edge,
not a blurred vignette. Full opaque perimeter lets native panels extend the mask
to any viewport shape without stretching the hole.
"""
from math import cos, sin, tau
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/cartoon/iris"
SIZE, SCALE = 640, 4
# Uneven, broad arcs; periodic cubic interpolation avoids polygonal corners.
BASE = [8, 11, 5, -3, -7, -4, 3, 7, 4, -4, -10, -7,
        -1, 6, 9, 3, -5, -8, -3, 4, 6, 0, -6, -1]
DRAWINGS = [
    [0, 1, 0, -1, 1, 0, -1, 0, 1, 0, -1, 1, 0, -1, 0, 1, 0, -1, 1, 0, -1, 0, 1, 0],
    [1, 0, -1, 0, -1, 1, 0, 1, 0, -1, 0, -1, 1, 0, 1, 0, -1, 0, -1, 1, 0, 1, 0, -1],
    [0, -1, 1, 0, 0, -1, 1, 0, -1, 1, 0, 0, -1, 1, 0, -1, 1, 0, 0, -1, 1, 0, -1, 1],
    [-1, 0, 0, 1, -1, 0, 0, -1, 1, 0, 1, 0, 0, -1, 1, 0, 0, 1, -1, 0, 0, -1, 1, 0],
]


def contour(values, t):
    index = int(t)
    f = t - index
    a, b, c, d = [values[(index + offset) % len(values)] for offset in [-1, 0, 1, 2]]
    return .5 * (2*b + (-a+c)*f + (2*a-5*b+4*c-d)*f*f + (-a+3*b-3*c+d)*f*f*f)


OUT.mkdir(parents=True, exist_ok=True)
for frame, offsets in enumerate(DRAWINGS):
    values = [(a + b * 1.6) / 1000 for a, b in zip(BASE, offsets)]
    alpha = Image.new("L", (SIZE*SCALE, SIZE*SCALE), 255)
    points = []
    for i in range(1440):
        angle = tau*i/1440
        radius = SIZE*SCALE*.42*(1 + contour(values, i*len(values)/1440))
        points.append((SIZE*SCALE/2 + cos(angle)*radius, SIZE*SCALE/2 + sin(angle)*radius))
    ImageDraw.Draw(alpha).polygon(points, fill=0)
    alpha = alpha.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 255))
    image.putalpha(alpha)
    path = OUT / f"contour-{frame}.png"
    image.save(path, optimize=True)
    meta = path.with_suffix(".png.gmeta")
    if not meta.exists():
        guid = uuid5(NAMESPACE_URL, f"the-bubble-brigade/cartoon/iris/contour-{frame}")
        meta.write_text(f'guid = "{guid}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "none"\ntrim = false\nfilter = "linear"\ncompression = "none"\n')

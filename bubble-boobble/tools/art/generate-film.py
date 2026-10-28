#!/usr/bin/env python3
"""Original film patina, baked into one translucent draw. No reference art inputs.

Run from the project: python3 tools/art/generate-film.py
Four 512-square textures use 4 MiB RGBA; 1 MiB on phone-low.
Warm pigment wash, soft edge shading, grain and sparse dust are combined before export.
"""
import math
from pathlib import Path
import struct
import uuid
import zlib

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/cartoon/film'
SIZE = 512


def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))


def noise(x, y, frame):
    n = (x * 374761393 + y * 668265263 + frame * 2246822519) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    return ((n ^ (n >> 16)) & 65535) / 65535 * 2 - 1


def build(frame):
    dust = [(38 + (i * 113 + frame * 71) % 436,
             34 + (i * 79 + frame * 137) % 444,
             .65 + (i % 3) * .25) for i in range(7)]
    rows = bytearray()
    for y in range(SIZE):
        rows.append(0)
        for x in range(SIZE):
            # A normalized ellipse follows the viewport when stretched. The
            # central playfield stays clear; there is no hard oval border.
            radius = math.hypot((x + .5) / SIZE * 2 - 1, (y + .5) / SIZE * 2 - 1)
            edge = min(1, max(0, (radius - .45) / .95))
            edge = edge * edge * (3 - 2 * edge)
            # A mid-value ochre wash visibly warms/desaturates the print without
            # the milky haze produced by blending a near-white paper texture.
            layers = [((177, 151, 104), .10), ((28, 23, 20), .25 * edge)]
            grain = noise(x, y, frame)
            # White has more impact in linear light, so dark grains use a
            # stronger alpha. The original game silhouettes remain readable.
            layers.append(((255, 250, 237) if grain > 0 else (24, 22, 20),
                           abs(grain) * (.009 if grain > 0 else .025)))
            for dx, dy, r in dust:
                d = math.hypot(x - dx, y - dy)
                if d < r + .7:
                    layers.append(((39, 30, 23), .18 * min(1, r + .7 - d)))
            alpha, rgb = 0., [0., 0., 0.]
            for color, a in layers:
                rgb = [color[c] * a + rgb[c] * (1 - a) for c in range(3)]
                alpha = a + alpha * (1 - a)
            rows.extend(round(v / alpha) for v in rgb)
            rows.append(round(alpha * 255))
    header = struct.pack('>IIBBBBB', SIZE, SIZE, 8, 6, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b'')


OUT.mkdir(parents=True, exist_ok=True)
for frame in range(4):
    path = OUT / f'print-{frame}.png'
    path.write_bytes(build(frame))
    meta = Path(str(path) + '.gmeta')
    guid = uuid.uuid5(uuid.NAMESPACE_URL, f'bubble-brigade:film:print-{frame}')
    meta.write_text(f'''guid = "{guid}"
importer = "texture"

[settings]
kind = "sprite"
atlas = "none"
filter = "linear"
compression = "none"

[settings.overrides.phone-low]
max_size = 256
''')
    print(path.relative_to(ROOT))

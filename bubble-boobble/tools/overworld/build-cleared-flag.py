"""Draw the original Brigade completion pennant from native geometric primitives.

No input artwork. Pillow is used only to rasterize this authored icon at 4x size.
"""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[2]
scale = 4
image = Image.new('RGBA', (160 * scale, 240 * scale))
draw = ImageDraw.Draw(image)
def polygon(points, fill, outline=None, width=1):
    pts = [(x * scale, y * scale) for x, y in points]
    draw.polygon(pts, fill=fill)
    if outline:
        draw.line(pts + [pts[0]], fill=outline, width=width * scale, joint='curve')
def ellipse(box, fill, outline=None, width=1):
    draw.ellipse(tuple(round(v * scale) for v in box), fill=fill, outline=outline, width=width * scale)
ink = '#263e3b'
ellipse((14, 218, 69, 231), '#315d514f')
polygon([(35, 225), (35, 22), (43, 20), (43, 225)], '#d8b779', ink, 3)
polygon([(43, 34), (96, 27), (148, 42), (125, 66), (143, 96), (94, 82), (43, 92)], '#55af93', ink, 4)
polygon([(48, 41), (95, 35), (133, 45), (113, 65), (125, 84), (94, 74), (48, 83)], '#80c9a2')
ellipse((67, 43, 103, 79), '#f4e6ad', ink, 3)
ellipse((74, 49, 82, 57), '#fff8dc')
ellipse((96, 30, 109, 43), '#f4e6ad', ink, 2)
ellipse((58, 67, 68, 77), '#f4e6ad', ink, 2)
ellipse((31, 10, 48, 28), '#f1cc75', ink, 3)
polygon([(35, 213), (43, 213), (43, 225), (35, 225)], '#bc925d')
image.resize((160, 240), Image.Resampling.LANCZOS).save(root / 'assets/overworld-shared/cleared-flag.png')

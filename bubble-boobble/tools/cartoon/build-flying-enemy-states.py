"""Register existing bat/bee captive and death art to the shipped flight body scale.

Only four state PNGs and their animation metadata/trim settings are exported. The
original sheet and every flight PNG stay untouched. Rotation uses an expanded
canvas before registration, so the death drawing cannot be cropped at its edge.
Run from the project directory; --check verifies exports without writing files.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageOps
import argparse
import hashlib
import io
import json
import math
import statistics

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/cartoon-overhaul/sources/enemies.png'
DEST = ROOT / 'assets/cartoon'
# Reviewed regions of the immutable original sheet, excluding adjacent enemies.
REGIONS = {'monsta': (640, 208, 930, 416), 'pulpul': (640, 416, 930, 624)}
BODY_ANCHOR = (82, 76)
ANGLE = 28


def landmark(image):
    """Use the same cream face/goggle colour test as the flight exporter."""
    points = [(x, y) for y in range(image.height) for x in range(image.width)
              if (lambda r, g, b, a: a > 100 and r > 140 and g > 110
                  and g - b > 35 and r - g < 80)(*image.getpixel((x, y)))]
    if not points:
        raise ValueError('Missing body landmark')
    return len(points), tuple(sum(p[i] for p in points) / len(points) for i in (0, 1))


def isolate_body(image):
    """Keep the connected character, removing detached halo/bubble marks."""
    mask = image.getchannel('A').point(lambda a: 255 if a > 100 else 0)
    seen, groups = set(), []
    for y in range(image.height):
        for x in range(image.width):
            if (x, y) in seen or not mask.getpixel((x, y)):
                continue
            pending, group = [(x, y)], []
            seen.add((x, y))
            while pending:
                p = pending.pop()
                group.append(p)
                for q in ((p[0]-1, p[1]), (p[0]+1, p[1]), (p[0], p[1]-1), (p[0], p[1]+1)):
                    if (0 <= q[0] < image.width and 0 <= q[1] < image.height
                            and q not in seen and mask.getpixel(q)):
                        seen.add(q)
                        pending.append(q)
            groups.append(group)
    clean = Image.new('L', image.size)
    for p in max(groups, key=len):
        clean.putpixel(p, 255)
    # Restore the source antialiasing around the opaque connected silhouette.
    image.putalpha(ImageChops.multiply(image.getchannel('A'), clean.filter(ImageFilter.MaxFilter(3))))
    return image.crop(image.getchannel('A').getbbox())


def register(image):
    _, anchor = landmark(image)
    canvas = Image.new('RGBA', (128, 128))
    at = tuple(round(BODY_ANCHOR[i] - anchor[i]) for i in (0, 1))
    canvas.alpha_composite(image, at)
    # Reject clipping before compositing and reject paint on the export border.
    box = image.getchannel('A').getbbox()
    placed = (box[0]+at[0], box[1]+at[1], box[2]+at[0], box[3]+at[1])
    if min(placed[:2]) < 2 or max(placed[2:]) > 126:
        raise ValueError(f'State would clip its canvas: {placed}')
    return canvas


def build(check=False):
    animation_path = DEST / 'animation.json'
    animation = json.loads(animation_path.read_text())
    source_sha = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    sheet = Image.open(SOURCE).convert('RGBA')
    changed, reports = [], []
    for kind, region in REGIONS.items():
        paths = [DEST / f'frames/enemy/{kind}/walk-{i}.png' for i in range(8)]
        reference_hashes = [hashlib.sha256(p.read_bytes()).hexdigest() for p in paths]
        target_area = statistics.median(landmark(Image.open(p).convert('RGBA'))[0] for p in paths)
        source = ImageOps.mirror(isolate_body(sheet.crop(region)))
        source_area, _ = landmark(source)
        # Area defines one uniform linear scale, independent of pose or wingspan.
        scale = math.sqrt(target_area / source_area)
        # Tiny exports lose thresholded cream pixels during antialiasing. Refine
        # against the actual raster instead of assuming source-area math survives
        # filtering; keep the closest result when integer sizes oscillate.
        candidates = []
        for _ in range(8):
            candidate = source.resize(tuple(max(1, round(n*scale)) for n in source.size), Image.Resampling.LANCZOS)
            area, _ = landmark(candidate)
            candidates.append((abs(area-target_area), scale, candidate))
            scale *= math.sqrt(target_area / area)
        _, scale, captive = min(candidates, key=lambda c: c[0])
        frames = {'captured-0': register(captive),
                  'dead-0': register(captive.rotate(ANGLE, Image.Resampling.BICUBIC, expand=True))}
        for state, image in frames.items():
            key = f'enemy/{kind}/{state}'
            path = DEST / f'frames/{key}.png'
            encoded = io.BytesIO()
            image.save(encoded, format='PNG')
            data = encoded.getvalue()
            if path.read_bytes() != data:
                changed.append(str(path.relative_to(ROOT)))
                if not check:
                    path.write_bytes(data)
            metadata = {'feet': [64, 120], 'canvasSize': [128, 128],
                        'visualBounds': list(image.getchannel('A').getbbox()),
                        'bodyAnchor': list(BODY_ANCHOR),
                        'sourceSheet': SOURCE.relative_to(ROOT).as_posix(),
                        'sourceSha256': source_sha, 'sourceRect': list(region),
                        'sourceScale': scale, 'referenceLandmarkArea': target_area,
                        'bodyLandmarkArea': landmark(image)[0],
                        'scaleReference': f'enemy/{kind}/walk-0..7',
                        'scaleReferenceSha256': reference_hashes,
                        'rotationDegrees': ANGLE if state == 'dead-0' else 0,
                        'derivative': state == 'dead-0'}
            animation['frames'][key] = metadata
            meta = path.with_suffix('.png.gmeta')
            before = meta.read_text()
            after = before.replace('trim = false', 'trim = true')
            if before != after:
                changed.append(str(meta.relative_to(ROOT)))
                if not check:
                    meta.write_text(after)
            b = image.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
            reports.append({'frame': key, 'bounds': b, 'paintedSize': [b[2]-b[0], b[3]-b[1]],
                            'landmarkArea': landmark(image)[0], 'referenceMedianArea': target_area})
        if reference_hashes != [hashlib.sha256(p.read_bytes()).hexdigest() for p in paths]:
            raise ValueError('Flight art changed during state export')
    text = json.dumps(animation, indent=2) + '\n'
    if text != animation_path.read_text():
        changed.append(str(animation_path.relative_to(ROOT)))
        if not check:
            animation_path.write_text(text)
    print(json.dumps({'check': check, 'changed': changed, 'frames': reports}, indent=2))
    if check and changed:
        raise SystemExit('Flying enemy state exports are stale')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    build(parser.parse_args().check)

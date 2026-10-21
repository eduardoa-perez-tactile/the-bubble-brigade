#!/usr/bin/env python3
"""Compare a native engine capture with the measured concept, without warping it.

Image differences are diagnostic: preserved actor artwork intentionally differs.
Anchor assertions require actual engine-query coordinates, supplied separately.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageStat, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--actual', required=True, help='Native1536x864 Game Engine PNG')
parser.add_argument('--actual-anchors', help='JSON with engine-measured tiers and optional footer/header bounds')
parser.add_argument('--out', default='docs/concept-reconstruction/reference-comparison')
args = parser.parse_args()
contract = json.loads((ROOT / 'docs/concept-reconstruction/reference-layout.json').read_text())
out = ROOT / args.out
out.mkdir(parents=True, exist_ok=True)
source_path = ROOT / contract['reference']['path']
actual_path = ROOT / args.actual
assert hashlib.sha256(source_path.read_bytes()).hexdigest() == contract['reference']['sha256']
size = (contract['comparisonCanvas']['width'], contract['comparisonCanvas']['height'])
actual = Image.open(actual_path).convert('RGB')
assert actual.size == size, f'Actual capture must be native{size}, got{actual.size}; do not resize gameplay pixels'
reference = Image.open(source_path).convert('RGB').resize(size, Image.Resampling.LANCZOS)
difference = ImageChops.difference(reference, actual)
Image.blend(reference, actual, .5).save(out / 'overlay-50.png')
difference.save(out / 'absolute-difference.png')
reference.save(out / 'reference-normalized.png')
actual.save(out / 'actual-native.png')
side_by_side = Image.new('RGB', (size[0] * 2, size[1] + 32), '#252525')
labels = ImageDraw.Draw(side_by_side)
labels.text((8, 9), 'ORIGINAL CONCEPT (normalized reference)', fill='white')
labels.text((size[0] + 8, 9), 'ACTUAL GAME ENGINE (native pixels)', fill='white')
side_by_side.paste(reference, (0, 32))
side_by_side.paste(actual, (size[0], 32))
side_by_side.save(out / 'side-by-side.png')
regions = {
    'header': (0, 0, 1536, 90),
    'crown': (0, 110, 1536, 285),
    'upper': (0, 280, 1536, 415),
    'middle': (0, 410, 1536, 550),
    'lower': (0, 540, 1536, 675),
    'floor': (0, 655, 1536, 765),
    'footer': (0, 755, 1536, 864),
    'background-focal': (560, 65, 1000, 650),
}
metrics = []
for name, box in regions.items():
    reference.crop(box).save(out / f'{name}-reference.png')
    actual.crop(box).save(out / f'{name}-actual.png')
    Image.blend(reference.crop(box), actual.crop(box), .5).save(out / f'{name}-overlay.png')
    diff = difference.crop(box)
    diff.save(out / f'{name}-difference.png')
    metrics.append({'region': name, 'bounds': box, 'meanAbsoluteRgbDifference': ImageStat.Stat(diff).mean})

checks = []
if args.actual_anchors:
    anchors_path = ROOT / args.actual_anchors
    anchors = json.loads(anchors_path.read_text())
    assert anchors.get('method') and anchors.get('capture'), 'Identify the actual engine query method and capture'
    tolerance = contract['tolerance']['normalizedPixels']
    def check(name, expected, observed):
        error = abs(expected - observed)
        checks.append({'name': name, 'expected': expected, 'actual': observed, 'errorPixels': error,
                       'tolerancePixels': tolerance, 'ok': error <= tolerance})
    for tier in contract['tiers']:
        measured = next((row for row in anchors['tiers'] if row['id'] == tier['id']), None)
        assert measured, f'Missing measured{tier["id"]} tier'
        check(tier['id'] + '.top', tier['normalizedNominalTopY'], measured['topY'])
        expected, observed = tier['normalizedCapSpansX'], measured['spansX']
        checks.append({'name': tier['id'] + '.spanCount', 'expected': len(expected), 'actual': len(observed),
                       'ok': len(expected) == len(observed)})
        for index, (a, b) in enumerate(zip(expected, observed)):
            check(f'{tier["id"]}.{index}.left', a[0], b[0])
            check(f'{tier["id"]}.{index}.right', a[1], b[1])
    for key, expected in [('footer', contract['footer']['normalizedParchmentBounds']),
                          ('score', contract['header']['normalizedScoreParchmentBounds']),
                          ('wave', contract['header']['normalizedWaveParchmentBounds'])]:
        observed = anchors.get(key)
        if observed:
            for edge, value, actual_value in [
                ('left', expected['x'], observed['x']),
                ('top', expected['y'], observed['y']),
                ('right', expected['x'] + expected['width'], observed['x'] + observed['width']),
                ('bottom', expected['y'] + expected['height'], observed['y'] + observed['height'])]:
                check(f'{key}.{edge}', value, actual_value)
report = {'geometryVerified': bool(args.actual_anchors), 'ok': all(row['ok'] for row in checks) if checks else None,
          'actual': str(actual_path.relative_to(ROOT)) if actual_path.is_relative_to(ROOT) else str(actual_path),
          'actualSha256': hashlib.sha256(actual_path.read_bytes()).hexdigest(),
          'referenceSha256': contract['reference']['sha256'], 'actualCaptureSize': list(size),
          'checks': checks, 'imageDifferenceMetrics': metrics,
          'limits': 'Difference images are diagnostic, not an image-similarity pass. Without actual engine anchors, geometry is unverified. Actor drawings are intentionally preserved and may differ from the illustrated source.'}
(out / 'comparison.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'geometryVerified': report['geometryVerified'], 'ok': report['ok'], 'checks': len(checks), 'out': str(out)}))
if checks and not report['ok']:
    raise SystemExit(1)

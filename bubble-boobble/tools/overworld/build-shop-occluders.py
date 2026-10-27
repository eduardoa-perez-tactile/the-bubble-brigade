#!/usr/bin/env python3
"""Slice original counter-front pixels into registered foreground sprites.

No paint is generated or modified. Each output preserves the original RGB values;
only an alpha mask separates the existing front faces for actor occlusion.
The unchanged base painting remains the sole geometry/color source.
"""
from pathlib import Path
import hashlib
import json
import uuid
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
NAMESPACE = uuid.UUID('9676b069-d338-5fa4-8e87-23a2f216b3f7')
# Native 1254px coordinates, traced on each existing cart's timber front faces.
FACES = {
    1: [
        [(744,976),(802,1001),(802,1016),(744,990)],
        [(802,1001),(841,981),(841,997),(802,1016)],
    ],
    2: [
        [(166,971),(199,988),(199,1009),(166,992)],
        [(199,988),(274,958),(274,979),(199,1009)],
    ],
    3: [
        [(805,942),(830,952),(831,979),(807,968)],
        [(830,952),(891,935),(892,959),(831,979)],
    ],
    4: [
        [(791,1012),(850,1035),(850,1055),(790,1030)],
        [(850,1035),(887,1020),(887,1041),(850,1055)],
    ],
    5: [
        [(791,963),(858,988),(858,1012),(791,989)],
        [(858,988),(900,965),(900,991),(858,1012)],
    ],
}


def main():
    manifest = {'version': 1, 'sourceCanvas': [1254,1254], 'registrationCanvas': [1536,1536], 'districts': {}}
    for district, polygons in FACES.items():
        source = ROOT / f'assets/overworld-original/district-{district}/base.png'
        original_bytes = source.read_bytes()
        original_hash = hashlib.sha256(original_bytes).hexdigest()
        base = Image.open(source).convert('RGBA')
        if base.size != (1254,1254):
            raise ValueError(f'district-{district}: source canvas changed from1254px')
        xs = [x for polygon in polygons for x,y in polygon]
        ys = [y for polygon in polygons for x,y in polygon]
        box = (min(xs),min(ys),max(xs)+1,max(ys)+1)
        mask = Image.new('L', base.size)
        draw = ImageDraw.Draw(mask)
        for polygon in polygons:
            draw.polygon(polygon, fill=255)
        front = base.crop(box)
        front.putalpha(mask.crop(box))
        # A technical RGB lock: alpha slicing must never introduce new paint.
        assert front.convert('RGB').tobytes() == base.crop(box).convert('RGB').tobytes()
        target = ROOT / f'assets/overworld-living/district-{district}/shop-front.png'
        target.parent.mkdir(parents=True, exist_ok=True)
        front.save(target)
        guid = uuid.uuid5(NAMESPACE, f'district-{district}/shop-front')
        target.with_suffix('.png.gmeta').write_text(
            f'guid = "{guid}"\nimporter = "texture"\n[settings]\n'
            'kind = "sprite"\natlas = "none"\ncompression = "astc6x6"\n'
            'max_size = 256\ntrim = false\nfilter = "linear"\n'
            '[settings.platform.desktop]\ncompression = "none"\n')
        entry = {
            'image': f'overworld-living/district-{district}/shop-front',
            'source': str(source.relative_to(ROOT)), 'sourceSha256': original_hash,
            'nativeRect': {'x':box[0], 'y':box[1], 'width':box[2]-box[0], 'height':box[3]-box[1]},
            'polygons': polygons,
            'output': str(target.relative_to(ROOT)),
            'outputSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        }
        manifest['districts'][f'district-{district}'] = entry
        assert hashlib.sha256(source.read_bytes()).hexdigest() == original_hash
    path = ROOT / 'data/overworld-shop-occluders.json'
    path.write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({'ok': True, 'manifest': str(path.relative_to(ROOT)), 'sprites': len(FACES), 'sourcePaintingsChanged': False}))


if __name__ == '__main__':
    main()

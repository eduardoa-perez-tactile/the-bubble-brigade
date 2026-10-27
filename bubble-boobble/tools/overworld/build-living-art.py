#!/usr/bin/env python3
"""Import generated drawings as registered sprites; never rewrite a map painting.

Generated pigment is clipped to measured shoreline-only masks. Land/buildings
remain the original painting. Requires Pillow and numpy; raw generation inputs
live beside this script in living-sources, not in the shipping asset tree.
"""
from pathlib import Path
import hashlib
import json
import uuid
import re
import numpy as np
from PIL import Image, ImageChops, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'tools/overworld/living-sources'
OUT = ROOT / 'assets/overworld-living'
NAMESPACE = uuid.UUID('9d29ce1d-af2c-46bd-9292-cc894bfc971d')
MANIFEST = []


def save(image, relative, npc=False, detail=None):
    target = OUT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target)
    guid = uuid.uuid5(NAMESPACE, relative)
    atlas = f'overworld-living-details-{detail}' if detail else ('overworld-living-residents' if npc else 'none')
    size = 128 if npc or detail else 1024
    (target.parent / (target.name + '.gmeta')).write_text(
        f'guid = "{guid}"\nimporter = "texture"\n[settings]\n'
        f'kind = "sprite"\natlas = "{atlas}"\ncompression = "astc6x6"\n'
        f'max_size = {size}\ntrim = false\nfilter = "linear"\n'
        + ('' if npc or detail else '[settings.overrides.phone-low]\nmax_size = 768\n[settings.platform.desktop]\ncompression = "none"\n'))
    MANIFEST.append({'path': str(target.relative_to(ROOT)), 'size': list(image.size),
                     'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})


def npc(role):
    strip = Image.open(SOURCE / f'npc-{role}.png').convert('RGBA')
    cells = [strip.crop((round(i * strip.width / 4), 0,
                        round((i + 1) * strip.width / 4), strip.height)) for i in range(4)]
    boxes = [cell.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox() for cell in cells]
    if not all(boxes):
        raise ValueError(f'{role}: empty drawing')
    # One scale across the whole strip, common foot baseline, no independent resizing.
    scale = min(120 / max(b[2] - b[0] for b in boxes), 124 / max(b[3] - b[1] for b in boxes))
    normalized = []
    for cell, box in zip(cells, boxes):
        cropped = cell.crop(box)
        cropped = cropped.resize((round(cropped.width * scale), round(cropped.height * scale)), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (128, 128))
        canvas.alpha_composite(cropped, ((128 - cropped.width) // 2, 128 - cropped.height))
        normalized.append(canvas)
    # The guide's fourth raised mitten reaches the generated canvas edge. Return
    # to the complete planted drawing, rather than shipping a cut-off hand.
    if role == 'guide':
        normalized[3] = normalized[0].copy()
    for i, frame in enumerate(normalized):
        save(frame, f'common/npc/{role}-{i}.png', npc=True)


def shore_mask(base, district):
    rgb = np.asarray(base.convert('RGB')).astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    sea = (g > r + 18) & (b > r + 18) & (r < 140) & (g < 175) & (b < 195)
    sea_near = np.asarray(Image.fromarray((sea * 255).astype('uint8')).filter(ImageFilter.MaxFilter(7))) > 0
    light = np.asarray(base.convert('L')).astype(np.int16)
    local_dark = np.asarray(base.convert('L').filter(ImageFilter.MinFilter(7))).astype(np.int16)
    if district == 4:
        # Pale spring water has a different palette from the dark ocean. Keep
        # its original two basin silhouettes; clouds and stone stay excluded.
        pools = Image.new('L', base.size)
        pd = ImageDraw.Draw(pools)
        pd.polygon([(875,430),(882,417),(901,405),(927,400),(959,401),(989,405),(1015,416),(1032,431),(1030,444),(1014,455),(984,466),(952,469),(918,464),(891,451)], fill=255)
        pd.polygon([(186,968),(194,954),(214,944),(243,940),(270,946),(293,956),(304,971),(292,985),(267,996),(241,1001),(218,994),(198,985)], fill=255)
        water = (np.asarray(pools) > 0) & (g > r + 3) & (b > r + 7) & (r < 210)
        foam = water & (light > local_dark + 12)
        mask = Image.fromarray((water * 255).astype('uint8'))
        clean = Image.fromarray((foam * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))
        return ImageChops.multiply(clean, mask), mask
    foam = sea_near & (r > 95) & (r < 210) & (g > 145) & (b > 150) & (g > r + 25) & (b > r + 25) & (light > local_dark + 35)
    # Distant scenic haze stays quiet and untouched. Masking is deliberately
    # conservative: no import may overwrite the accepted walkable land plane.
    foam[:330] = False
    source = (ROOT / f'src/overworld/maps/district-{district}.ts').read_text()
    source = re.sub(r'^\s*//.*$', '', source[source.index('={') + 1:], flags=re.M).strip().rstrip(';')
    terrain = json.loads(source)
    protected = Image.new('L', base.size)
    draw = ImageDraw.Draw(protected)
    for polygon in terrain['walkable']:
        draw.polygon([(x * base.width / 1536, y * base.height / 1536) for x, y in polygon], fill=255)
    buildings = {
        1: [(375,20,710,285),(715,160,980,400),(100,290,440,535),(510,690,720,1020),(920,590,1240,900)],
        2: [(50,280,460,600),(550,30,870,355),(925,350,1220,650),(365,810,600,1010),(820,805,1100,1120)],
        3: [(295,30,625,290),(740,40,1010,345),(85,295,470,600),(510,665,770,930),(910,510,1220,820)],
        4: [(270,170,570,400),(630,65,920,365),(120,620,420,890),(465,740,735,1010),(900,700,1220,980)],
        5: [(260,45,565,395),(630,10,825,215),(900,80,1210,420),(55,360,390,630),(460,680,790,960),(990,635,1250,1000)],
    }
    for box in buildings[district]:
        draw.rectangle(box, fill=255)
    foam &= np.asarray(protected) == 0
    if district == 4:
        # Cloud edges are not sea. Only the two real blue pools are animated.
        regions = np.zeros(foam.shape, dtype=bool)
        regions[380:500, 830:1050] = True
        regions[845:980, 165:360] = True
        foam &= regions
    # Reject broad pale haze/cloud masses; retain thin contact lines and ripples.
    pending = set(zip(*np.where(foam)))
    kept = np.zeros(foam.shape, dtype='uint8')
    while pending:
        start = pending.pop()
        component, todo = [start], [start]
        while todo:
            y, x = todo.pop()
            for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (-1, -1)):
                point = (y + dy, x + dx)
                if point in pending:
                    pending.remove(point); component.append(point); todo.append(point)
        ys, xs = zip(*component)
        width, height = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        if len(component) >= 3 and len(component) / (width + height) < 5:
            for y, x in component:
                kept[y, x] = 255
    unprotected = ImageChops.invert(protected)
    clean = ImageChops.multiply(Image.fromarray(kept).filter(ImageFilter.MaxFilter(3)), unprotected)
    # Keep the imported linework as fine as the original contact painting.
    # A wide band produces bright foam slabs at the close follow-camera zoom.
    band = Image.fromarray(kept).filter(ImageFilter.MaxFilter(3))
    # Never place generated pigment on warm stone, architecture or greenery.
    water = ((g > r + 13) & (b > r + 13)).astype('uint8') * 255
    band = ImageChops.multiply(ImageChops.multiply(band, Image.fromarray(water)), unprotected)
    return clean, band


def coast(district):
    base = Image.open(ROOT / f'assets/overworld-original/district-{district}/base.png')
    clean, band = shore_mask(base, district)
    size = (1024, 1024)
    clean, band = (mask.resize(size, Image.Resampling.LANCZOS) for mask in (clean, band))
    paint = Image.open(SOURCE / f'clean-{district}.png').convert('RGBA').resize(size, Image.Resampling.LANCZOS)
    paint.putalpha(clean)
    save(paint, f'district-{district}/coast-clean.png')
    sheet = Image.open(SOURCE / f'coast-{district}.png').convert('RGBA')
    for i in range(4):
        if district == 4:
            # Bespoke local pool drawings avoid drift from a whole-map sheet.
            canvas = Image.new('RGBA', base.size)
            _, pool_mask = shore_mask(base, 4)
            for name, box in [('upper', (860,385,1045,485)), ('lower', (175,925,320,1015))]:
                strip = Image.open(SOURCE / f'pool-{name}.png').convert('RGBA')
                x, y = i % 2, i // 2
                drawing = strip.crop((x*strip.width//2,y*strip.height//2,(x+1)*strip.width//2,(y+1)*strip.height//2))
                drawing = drawing.resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS)
                drawing.putalpha(pool_mask.crop(box))
                canvas.alpha_composite(drawing,box[:2])
            save(canvas.resize(size,Image.Resampling.LANCZOS), f'district-{district}/coast-{i}.png')
            continue
        x, y = i % 2, i // 2
        cell = sheet.crop((round(x * sheet.width / 2), round(y * sheet.height / 2),
                           round((x + 1) * sheet.width / 2), round((y + 1) * sheet.height / 2)))
        cell = cell.resize(size, Image.Resampling.LANCZOS)
        values = np.asarray(cell).astype(np.int16)
        # Keep only the generator's cream foam pigment, not accidental scenery
        # or translucent cyan/grey silhouettes in the raw transparent sheets.
        cream = ((values[:, :, 0] > 175) & (values[:, :, 1] > 185) & (values[:, :, 2] > 165)).astype('uint8') * 255
        alpha = ImageChops.multiply(cell.getchannel('A'), Image.fromarray(cream))
        cell.putalpha(ImageChops.multiply(alpha, band).point(lambda value: round(value * .65)))
        save(cell, f'district-{district}/coast-{i}.png')
    diagnostic = ROOT / '.gameengine' / f'coast-mask-{district}.png'
    band.save(diagnostic)


def lantern():
    folder = ROOT / 'docs/overworld/living-map-harbor/previews'
    seed = Image.open(folder / 'lantern-seed.png').convert('RGBA')
    sheet = Image.open(folder / 'lantern-study.png').convert('RGBA')
    # Protect the accepted dome/rail/background pixel-for-pixel. Only the tiny
    # existing lantern window receives the generated changed lens drawings.
    window = (61, 29, 95, 57)
    for i in range(4):
        x, y = i % 2, i // 2
        cell = sheet.crop((x * sheet.width // 2, y * sheet.height // 2,
                           (x + 1) * sheet.width // 2, (y + 1) * sheet.height // 2))
        cell = cell.resize(seed.size, Image.Resampling.LANCZOS)
        frame = seed.copy()
        if i in (1, 2):
            frame.paste(cell.crop(window), window)
        save(frame, f'district-1/lantern-{i}.png')


def doors():
    sheet = Image.open(SOURCE / 'door.png').convert('RGBA')
    drawings = []
    for i in range(4):
        x, y = i % 2, i // 2
        cell = sheet.crop((x*sheet.width//2,y*sheet.height//2,(x+1)*sheet.width//2,(y+1)*sheet.height//2))
        rgba = np.array(cell)
        # Discard the generator's tiny saturated matte-fringe swatches, never
        # painted door/knob colors. These are import artifacts, not game marks.
        red = (rgba[:,:,0] > 180) & (rgba[:,:,1] < 60)
        green = (rgba[:,:,1] > 160) & (rgba[:,:,0] < 80)
        blue = (rgba[:,:,2] > 180) & (rgba[:,:,0] < 70)
        rgba[red | green | blue, 3] = 0
        cell = Image.fromarray(rgba)
        drawings.append(cell.crop(cell.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()))
    for district in range(1,6):
        base = Image.open(ROOT / f'assets/overworld-original/district-{district}/base.png').convert('RGBA')
        text = (ROOT / f'src/overworld/maps/district-{district}.ts').read_text()
        terrain = json.loads(re.sub(r'^\s*//.*$', '', text[text.index('={')+1:], flags=re.M).strip().rstrip(';'))
        for poi in terrain['pois']:
            if poi['kind'] != 'encounter':
                continue
            x, y = poi['x']*1254/1536, poi['y']*1254/1536
            box = (round(x-38),round(y-115),round(x+38),round(y-10))
            original = base.crop(box)
            rgb = np.asarray(original).astype(np.int16)
            blue = (rgb[:,:,1]>rgb[:,:,0]+10)&(rgb[:,:,2]>rgb[:,:,0]+8)&(rgb[:,:,0]<160)
            blue[:25] = False
            pending = set(zip(*np.where(blue)))
            choices = []
            while pending:
                start=pending.pop(); component=[start];todo=[start]
                while todo:
                    yy,xx=todo.pop()
                    for dy,dx in ((0,1),(0,-1),(1,0),(-1,0)):
                        q=(yy+dy,xx+dx)
                        if q in pending:pending.remove(q);component.append(q);todo.append(q)
                if len(component)>20:
                    center=sum(p[1] for p in component)/len(component)
                    choices.append((len(component)/(1+abs(center-original.width/2)/8),component))
            if not choices:
                raise ValueError(f'No original doorleaf at {district}/{poi["slot"]}')
            component=max(choices,key=lambda entry:entry[0])[1]
            mask=Image.new('L',original.size)
            for yy,xx in component:mask.putpixel((xx,yy),255)
            mask=mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
            leafbox=mask.getbbox()
            for frame in range(4):
                canvas=Image.new('RGBA',original.size)
                if frame==0:canvas=original.copy()
                else:
                    drawing=drawings[frame].resize((leafbox[2]-leafbox[0],leafbox[3]-leafbox[1]),Image.Resampling.LANCZOS)
                    canvas.alpha_composite(drawing,leafbox[:2])
                canvas.putalpha(mask)
                save(canvas.resize((64,96),Image.Resampling.LANCZOS),f'district-{district}/door-{poi["slot"]}-{frame}.png',detail=district)


if __name__ == '__main__':
    for role in ('guide', 'vendor', 'courier'):
        npc(role)
    for district in range(1, 6):
        coast(district)
    lantern()
    doors()
    (SOURCE / 'import-manifest.json').write_text(json.dumps({'assets': MANIFEST,
        'mapPaintingsModified': False, 'method': 'Generated pigment import, shared sprite normalization, exact shoreline-only alpha masking'}, indent=2) + '\n')

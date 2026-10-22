"""Normalize approved enemy strips with one scale per family and fixed anchors.
Flight uses the cream face/goggle landmark so flapping wings cannot move the body.
Hopper parts are mechanical slices of the shipped art, animated by native quads.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json, math, uuid
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'art/enemy-animation'; DEST=ROOT/'assets/cartoon'
CADENCE={'zenchan':4,'mighta':4,'monsta':3,'pulpul':2,'invader':5}

def bounds(im):
    return im.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox()

def landmark(im):
    points=[(x,y) for y in range(im.height) for x in range(im.width)
            if (lambda r,g,b,a:a>100 and r>140 and g>110 and g-b>35 and r-g<80)(*im.getpixel((x,y)))]
    if not points:raise ValueError('Missing flight anchor')
    return (sum(p[0] for p in points)/len(points),sum(p[1] for p in points)/len(points))

def build():
    animation=json.loads((DEST/'animation.json').read_text());atlas=json.loads((DEST/'atlas-layout.json').read_text())
    preview=Image.new('RGBA',(8*128,6*128),'#e8ddc8')
    def save(key,im,**metadata):
        path=DEST/'frames'/(key+'.png');path.parent.mkdir(parents=True,exist_ok=True);im.save(path)
        meta=path.with_suffix('.png.gmeta')
        if not meta.exists():meta.write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/"+key)}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = true\n')
        else:meta.write_text(meta.read_text().replace('trim = false','trim = true'))
        animation['frames'][key]={'feet':[64,120],'canvasSize':list(im.size),'visualBounds':list(im.getchannel('A').getbbox()),**metadata}
        if key not in atlas['frames']:
            n=len(atlas['frames']);atlas['frames'][key]={'x':n%16*128,'y':n//16*128,'w':im.width,'h':im.height}
    animation['enemies']={}
    for row,(kind,ticks) in enumerate(CADENCE.items()):
        sheet=Image.open(SOURCE/f'{kind}-source.png').convert('RGBA')
        cells=[sheet.crop((round(x*sheet.width/4),round(y*sheet.height/2),round((x+1)*sheet.width/4),round((y+1)*sheet.height/2))) for y in range(2) for x in range(4)]
        if kind=='invader':cells[3]=ImageOps.mirror(cells[3])
        flight=kind in ('monsta','pulpul','invader')
        if flight:
            anchors=[landmark(c) for c in cells]
            # Stable body landmark, with enough room for fully extended wings.
            target=(82,76) if kind!='invader' else (76,72)
            extents=[(a[0]-b[0],a[1]-b[1],b[2]-a[0],b[3]-a[1]) for c,a in zip(cells,anchors) for b in [bounds(c)]]
            scale=min(limit/max(e[i] for e in extents) for i,limit in enumerate((target[0]-8,target[1]-8,120-target[0],120-target[1])))
        else:
            cells=[c.crop(bounds(c)) for c in cells]
            scale=min(108/max(c.width for c in cells),108/max(c.height for c in cells))
        for index,c in enumerate(cells):
            im=Image.new('RGBA',(128,128))
            resized=c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.LANCZOS)
            at=(round(target[0]-anchors[index][0]*scale),round(target[1]-anchors[index][1]*scale)) if flight else ((128-resized.width)//2,120-resized.height)
            im.alpha_composite(resized,at)
            save(f'enemy/{kind}/walk-{index}',im,sourceSheet=f'art/enemy-animation/{kind}-source.png',sourceCell=[index%4,index//4],**({'bodyAnchor':list(target)} if flight else {}))
            preview.alpha_composite(im,(index*128,row*128))
        animation['enemies'][kind]={'frames':8,'ticksPerFrame':ticks,'anchor':'body' if flight else 'feet'}
    anchors=SOURCE/'banebou-anchors.png'
    if not anchors.exists():
        sheet=Image.new('RGBA',(256,128))
        for i in range(2):sheet.alpha_composite(Image.open(DEST/f'frames/enemy/banebou/walk-{i}.png'),(i*128,0))
        sheet.save(anchors)
    sheet=Image.open(anchors).convert('RGBA')
    for i in range(2):
        im=sheet.crop((i*128,0,(i+1)*128,128))
        for name,top,bottom in [('body',0,88),('spring',88,104),('feet',104,128)]:
            save(f'enemy/banebou/{name}-{i}',im.crop((0,top,128,bottom)),sourceSheet='art/enemy-animation/banebou-anchors.png',sourceCell=[i,0],sourceRect=[0,top,128,bottom],feet=[64,120-top])
        for phase in range(4):preview.alpha_composite(im,((i*4+phase)*128,5*128))
    animation['enemies']['banebou']={'frames':2,'ticksPerFrame':16,'anchor':'feet','rig':'spring'}
    atlas['height']=math.ceil(len(atlas['frames'])/16)*128
    (DEST/'animation.json').write_text(json.dumps(animation,indent=2)+'\n');(DEST/'atlas-layout.json').write_text(json.dumps(atlas,indent=2)+'\n')
    (ROOT/'.cache').mkdir(exist_ok=True);preview.save(ROOT/'.cache/enemy-animation-preview.png')
    print('Exported five eight-pose enemy cycles and anchored hopper spring rig.')
if __name__=='__main__':build()

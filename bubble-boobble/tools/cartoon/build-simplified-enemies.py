"""Slice reviewed ImageGen masters into registered 128px native sprites.
Creative work stays in immutable source sheets; this only crops/scales/exports.
One scale per family preserves pose compression, with a shared contact baseline.
Run after adding/reviewing every required source; never run the older base exporter
as it intentionally reconstructs the historical humanoid cast.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, json, math, uuid
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'art/enemy-simplification'
DEST=ROOT/'assets/cartoon'
STATES=['travel-0','travel-1','compress','air','captured','dead','shoot','angry']
KINDS=['zenchan','mighta','banebou','invader']

def build():
    animation=json.loads((DEST/'animation.json').read_text())
    atlas=json.loads((DEST/'atlas-layout.json').read_text())
    preview=Image.new('RGBA',(8*128,5*156),'#e8ddc8');labels=ImageDraw.Draw(preview)
    report={}
    def save(key,im,source,index,scale):
        path=DEST/'frames'/(key+'.png');path.parent.mkdir(parents=True,exist_ok=True);im.save(path)
        meta=path.with_suffix('.png.gmeta')
        if not meta.exists():meta.write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/"+key)}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = true\n')
        animation['frames'][key]={'feet':[64,120],'canvasSize':[128,128],
          'visualBounds':list(im.getchannel('A').getbbox()),'sourceSheet':source,
          'sourceCell':[index%4,index//4],'sourceScale':scale,'rig':'single-body'}
        if key not in atlas['frames']:
            n=len(atlas['frames']);atlas['frames'][key]={'x':n%16*128,'y':n//16*128,'w':128,'h':128}
    names=KINDS+(['boss'] if (ART/'boss-source.png').exists() else [])
    for row,kind in enumerate(names):
        source=ART/f'{kind}-source.png'
        sheet=Image.open(source).convert('RGBA')
        cells=[]
        for y in range(2):
            for x in range(4):
                c=sheet.crop((round(x*sheet.width/4),round(y*sheet.height/2),round((x+1)*sheet.width/4),round((y+1)*sheet.height/2)))
                box=c.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox()
                if box is None:raise ValueError(f'{kind} empty cell {x},{y}')
                # Every silhouette must clear its cell; do not silently clip art.
                if box[0]<2 or box[1]<2 or box[2]>c.width-2 or box[3]>c.height-2:raise ValueError(f'{kind} cell touches boundary {x},{y}: {box}')
                cells.append(c.crop(box))
        scale=min(112/max(c.width for c in cells),108/max(c.height for c in cells))
        keys=STATES if kind!='boss' else ['move-0','move-1','windup','release','captured','hit','angry','angry-windup']
        for i,(state,c) in enumerate(zip(keys,cells)):
            resized=c.resize((max(1,round(c.width*scale)),max(1,round(c.height*scale))),Image.Resampling.LANCZOS)
            im=Image.new('RGBA',(128,128));im.alpha_composite(resized,((128-resized.width)//2,120-resized.height))
            key=f'enemy/{kind}/simple-{state}' if kind!='boss' else f'boss/simple-{state}'
            save(key,im,source.relative_to(ROOT).as_posix(),i,scale)
            preview.alpha_composite(im,(i*128,row*156+18));labels.text((i*128+5,row*156+2),f'{kind}: {state}',fill='#26363c')
        if kind!='boss':animation['enemies'][kind]={'frames':2,'ticksPerFrame':8,'anchor':'feet','rig':'single-body','states':STATES}
        report[kind]={'source':source.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'size':list(sheet.size),'scale':scale,'states':keys}
    atlas['height']=math.ceil(len(atlas['frames'])/16)*128
    (DEST/'animation.json').write_text(json.dumps(animation,indent=2)+'\n')
    (DEST/'atlas-layout.json').write_text(json.dumps(atlas,indent=2)+'\n')
    ART.mkdir(exist_ok=True);preview.crop((0,0,1024,len(names)*156)).save(ART/'registered-states.png')
    (ART/'export-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Exported',len(names)*8,'registered single-body poses; bat/bee and simulation unchanged.')
if __name__=='__main__':build()

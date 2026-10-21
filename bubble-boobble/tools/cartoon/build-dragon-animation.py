"""Build only the expanded dragon clips from whole-sheet generated masters.
Shared scale per clip, bottom-center [64,120] anchor, linear-filtered exports.
Never regenerates historical masters, other artwork, or migration evidence.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import colorsys, json, math, uuid
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'art/dragon-animation'
DEST=ROOT/'assets/cartoon'
SKINS={'green':'#81b94b','blue':'#468bc8','red':'#ce6459','yellow':'#e3b953','purple':'#a87fbd','orange':'#dc9351','cyan':'#54b7bf','pink':'#d88eaa','ivory':'#c5c6a5','slate':'#718297'}

def content(image):
    bounds=image.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox()
    if not bounds:raise ValueError('Empty animation cell')
    return image.crop(bounds)

def frames(filename,columns,rows):
    sheet=Image.open(SOURCE/filename).convert('RGBA')
    cells=[content(sheet.crop((round(x*sheet.width/columns),round(y*sheet.height/rows),round((x+1)*sheet.width/columns),round((y+1)*sheet.height/rows)))) for y in range(rows) for x in range(columns)]
    # One scale for all frames: never independently stretch the pose or its limbs.
    scale=min(108/max(c.width for c in cells),108/max(c.height for c in cells))
    out=[]
    for cell in cells:
        cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
        frame=Image.new('RGBA',(128,128))
        frame.alpha_composite(cell,((128-cell.width)//2,120-cell.height))
        out.append(frame)
    return out

def recolor(image,color):
    hue,sat,val=colorsys.rgb_to_hsv(*(int(color[i:i+2],16)/255 for i in (1,3,5)))
    out=image.copy();pixels=[]
    for r,g,b,a in image.getdata():
        if g>r*1.06 and g>b*1.13 and g>45:
            _,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
            nr,ng,nb=colorsys.hsv_to_rgb(hue,min(.88,sat*s/.60),min(1,v*val/.74))
            r,g,b=round(nr*255),round(ng*255),round(nb*255)
        pixels.append((r,g,b,a))
    out.putdata(pixels);return out

def build():
    animation=json.loads((DEST/'animation.json').read_text())
    atlas=json.loads((DEST/'atlas-layout.json').read_text())
    walk=frames('walk-source.png',4,2)
    shoot=frames('shoot-source.png',3,2)
    # The input-step release pose is deliberately locked to the reviewed game art.
    shoot[0]=Image.open(SOURCE/'release-anchor.png').convert('RGBA')
    for clip,masters,columns,filename in [('run',walk,4,'walk-source.png'),('shoot',shoot,3,'shoot-source.png')]:
        for index,master in enumerate(masters):
            for skin,color in SKINS.items():
                frame=recolor(master,color)
                if clip=='shoot' and index==0:
                    anchors=Image.open(SOURCE/'release-anchors.png').convert('RGBA')
                    slot=list(SKINS).index(skin);frame=anchors.crop((slot*128,0,(slot+1)*128,128))
                if skin=='blue' and not (clip=='shoot' and index==0):
                    d=ImageDraw.Draw(frame);top=frame.getchannel('A').getbbox()[1]
                    d.ellipse((23,top+3,57,top+15),fill='#292a29');d.ellipse((26,top+5,56,top+12),fill=color)
                key=f'dragon/{skin}/{clip}-{index}'
                path=DEST/'frames'/(key+'.png');frame.save(path)
                meta=path.with_suffix('.png.gmeta')
                if not meta.exists():
                    meta.write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/"+key)}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = true\n')
                data={'feet':[64,120],'visualBounds':list(frame.getchannel('A').getbbox()),'sourceSheet':f'art/dragon-animation/{filename}','sourceCell':[index%columns,index//columns],'master':f'{clip}-{index}'}
                if clip=='shoot' and index==0:data.update(muzzle=[100,80],sourceSheet='art/dragon-animation/release-anchors.png',sourceCell=[list(SKINS).index(skin),0])
                animation['frames'][key]=data
                if key not in atlas['frames']:
                    n=len(atlas['frames']);atlas['frames'][key]={'x':n%16*128,'y':n//16*128,'w':128,'h':128}
    animation['clips']['run']={'frames':[f'run-{i}' for i in range(8)],'durations':[4]*8,'loop':True}
    animation['clips']['shoot']={'frames':[f'shoot-{i}' for i in range(6)],'durations':[2]*6,'loop':False}
    atlas['height']=math.ceil(len(atlas['frames'])/16)*128
    (DEST/'animation.json').write_text(json.dumps(animation,indent=2)+'\n')
    (DEST/'atlas-layout.json').write_text(json.dumps(atlas,indent=2)+'\n')
    # Trim only transparent texels; the engine preserves the authored 128px bounds
    # and pivot. This makes room for the extra poses without shrinking their art.
    for meta in (DEST/'frames/dragon').rglob('*.png.gmeta'):
        meta.write_text(meta.read_text().replace('trim = false','trim = true'))
    preview=ROOT/'.cache/dragon-animation-preview';preview.mkdir(parents=True,exist_ok=True)
    for clip,count in [('run',8),('shoot',6)]:
        folder=preview/clip;folder.mkdir(exist_ok=True)
        for index in range(count):
            Image.open(DEST/f'frames/dragon/green/{clip}-{index}.png').save(folder/f'{index:02d}.png')
    print('Exported 8 walking and 6 shooting frames for all ten skins (128px, feet [64,120]).')

if __name__=='__main__':build()

"""Build only the expanded dragon clips from whole-sheet generated masters.
Shared authored-grid scale for walk, explicit [64,120] root, linear-filtered exports.
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


# Dated authoring grid: all cells use the same reduction and X origin. The
# second row has one row-level registration correction, never bbox fitting.
WALK_SOURCE='walk-source-2026-10-22-16-registered.png'
# Canonical logical128 canvases contain the eight original keys in even slots
# and genuine authored inbetweens in odd slots. No new per-frame fit is applied.
_OLD_SKULL=[(280,162),(284,164),(278,158),(279,153),(274,145),(279,145),(280,143),(281,140)]
_OLD_SKULL_LOGICAL=[(4+x*.27,[3,9][i//4]+y*.27) for i,(x,y) in enumerate(_OLD_SKULL)]
WALK_SKULL=[]
for i,p in enumerate(_OLD_SKULL_LOGICAL):
    nxt=_OLD_SKULL_LOGICAL[(i+1)%8]
    WALK_SKULL.extend([p,((p[0]+nxt[0])/2,(p[1]+nxt[1])/2)])

def grid_cells(filename,columns,rows):
    sheet=Image.open(SOURCE/filename).convert('RGBA')
    return [sheet.crop((round(x*sheet.width/columns),round(y*sheet.height/rows),round((x+1)*sheet.width/columns),round((y+1)*sheet.height/rows))) for y in range(rows) for x in range(columns)]

def authored_walk():
    return grid_cells(WALK_SOURCE,4,4)

def moving_shot_masters():
    # The contact corrections are measured sole registrations (integer translation
    # only), not per-drawing scaling or opaque-bounds centering.
    contact_y=[0,-1,1,0,1,-1,0,-1,0,0]
    lower=[]
    for i,cell in enumerate(grid_cells('shoot-locomotion-source-2026-10-22.png',5,2)):
        cell=cell.resize((round(cell.width*.31),round(cell.height*.31)),Image.Resampling.LANCZOS)
        out=Image.new('RGBA',(128,128));out.alpha_composite(cell,(-12,8+contact_y[i]));lower.append(out.crop((0,96,128,128)))
    return lower

def build():
    animation=json.loads((DEST/'animation.json').read_text())
    atlas=json.loads((DEST/'atlas-layout.json').read_text())
    walk=authored_walk()
    shoot=frames('shoot-source.png',3,2)
    # The input-step release pose is deliberately locked to the reviewed game art.
    shoot[0]=Image.open(SOURCE/'release-anchor.png').convert('RGBA')
    for clip,masters,columns,filename in [('run',walk,4,WALK_SOURCE),('shoot',shoot,3,'shoot-source.png')]:
        for index,master in enumerate(masters):
            for skin,color in SKINS.items():
                frame=recolor(master,color)
                if clip=='shoot' and index==0:
                    anchors=Image.open(SOURCE/'release-anchors.png').convert('RGBA')
                    slot=list(SKINS).index(skin);frame=anchors.crop((slot*128,0,(slot+1)*128,128))
                if skin=='blue' and not (clip=='shoot' and index==0):
                    d=ImageDraw.Draw(frame)
                    if clip=='run':
                        skull_x,skull_y=WALK_SKULL[index]
                        cx=skull_x-39;cy=skull_y-25
                        d.ellipse((round(cx-17),round(cy-6),round(cx+17),round(cy+6)),fill='#292a29');d.ellipse((round(cx-14),round(cy-4),round(cx+16),round(cy+3)),fill=color)
                    else:
                        top=frame.getchannel('A').getbbox()[1]
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
    # Moving shots use a separately authored crouched gait, not upright run legs
    # grafted onto the low release torso. Crops retain their original logical Y.
    lower=moving_shot_masters()
    recovery=[cell.resize((128,128),Image.Resampling.LANCZOS) for cell in grid_cells('shoot-head-recovery-source-2026-10-22.png',2,1)]
    anchors=Image.open(SOURCE/'release-anchors.png').convert('RGBA')
    for slot,(skin,color) in enumerate(SKINS.items()):
        upper=anchors.crop((slot*128,0,(slot+1)*128,96))
        parts=[('shoot-upper-0',upper,0,'release-anchors.png',slot)]
        for i,face in enumerate(recovery):
            recovering=upper.copy()
            # Face-only compositing preserves the original skull, body, hands,
            # tail, blue crest, and the exact waist row 92..96 for every skin.
            patch=recolor(face,color).crop((58,56,104,92))
            recovering.paste(patch,(58,56))
            parts.append((f'shoot-upper-{i+1}',recovering,0,'shoot-head-recovery-source-2026-10-22.png',i))
        parts.extend((f'shoot-walk-lower-{i}' if i<8 else f'shoot-air-lower-{i-8}',recolor(master,color),96,'shoot-locomotion-source-2026-10-22.png',i) for i,master in enumerate(lower))
        for suffix,frame,origin_y,filename,index in parts:
            key=f'dragon/{skin}/{suffix}'
            path=DEST/'frames'/(key+'.png');frame.save(path)
            meta=path.with_suffix('.png.gmeta')
            if not meta.exists():
                meta.write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/"+key)}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = true\n')
            animation['frames'][key]={'canvasSize':list(frame.size),'sourceOrigin':[0,origin_y],'feet':[64,120-origin_y],'visualBounds':list(frame.getchannel('A').getbbox()),'sourceSheet':f'art/dragon-animation/{filename}','sourceCell':[index%5,index//5] if origin_y else [index,0]}
            if filename=='shoot-head-recovery-source-2026-10-22.png':animation['frames'][key]['faceRecoveryPatch']=[58,56,104,92]
            if not origin_y:animation['frames'][key]['muzzle']=[100,80]
            if key not in atlas['frames']:
                n=len(atlas['frames']);atlas['frames'][key]={'x':n%16*128,'y':n//16*128,'w':frame.width,'h':frame.height}
    animation['clips']['run']={'frames':[f'run-{i}' for i in range(16)],'durations':[2]*16,'loop':True}
    animation['clips']['shoot']={'frames':[f'shoot-{i}' for i in range(6)],'durations':[2]*6,'loop':False}
    atlas['height']=math.ceil(len(atlas['frames'])/16)*128
    (DEST/'animation.json').write_text(json.dumps(animation,indent=2)+'\n')
    (DEST/'atlas-layout.json').write_text(json.dumps(atlas,indent=2)+'\n')
    # Trim only transparent texels; the engine preserves the authored 128px bounds
    # and pivot. This makes room for the extra poses without shrinking their art.
    for meta in (DEST/'frames/dragon').rglob('*.png.gmeta'):
        meta.write_text(meta.read_text().replace('trim = false','trim = true'))
    preview=ROOT/'.cache/dragon-animation-preview';preview.mkdir(parents=True,exist_ok=True)
    for clip,count in [('run',16),('shoot',6)]:
        folder=preview/clip;folder.mkdir(exist_ok=True)
        for index in range(count):
            Image.open(DEST/f'frames/dragon/green/{clip}-{index}.png').save(folder/f'{index:02d}.png')
    print('Exported 16 walking, 6 stationary shooting, 3 moving-shot upper, 8 crouch-walking lower and 2 air lower frames for all ten skins; release0 remains locked.')

if __name__=='__main__':build()

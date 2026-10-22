#!/usr/bin/env python3
"""Untinted specular layer extending the existing code-authored bubble art.
Separate from the player-colored wash/rim so white reflections stay white.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import json,math,uuid
ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'assets/cartoon'
def build():
    scale=4
    image=Image.new('RGBA',(128*scale,128*scale))
    d=ImageDraw.Draw(image)
    # A bright outer contour leaves the colored inner meniscus exposed, so
    # amber/red warnings remain readable under the same neutral reflection.
    d.ellipse(tuple(v*scale for v in (4,4,124,124)),outline=(255,255,255,240),width=11)
    def arc(box,start,end,width,alpha=255):
        box=tuple(v*scale for v in box);line=round(width*scale)
        d.arc(box,start,end,fill=(255,255,255,alpha),width=line)
        cx=(box[0]+box[2])/2;cy=(box[1]+box[3])/2
        rx=(box[2]-box[0]-line)/2;ry=(box[3]-box[1]-line)/2
        for angle in (start,end):
            rad=math.radians(angle);x=cx+rx*math.cos(rad);y=cy+ry*math.sin(rad);r=line/2
            d.ellipse((x-r,y-r,x+r,y+r),fill=(255,255,255,alpha))
    arc((18,18,110,110),207,246,6)
    arc((16,16,112,112),281,305,3.4,250)
    arc((12,12,116,116),34,58,3,245)
    d.ellipse(tuple(v*scale for v in (15,58,19,67)),fill=(255,255,255,240))
    name='bubble-shine';path=DEST/'frames'/f'{name}.png'
    image.resize((128,128),Image.Resampling.LANCZOS).save(path)
    path.with_suffix('.png.gmeta').write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/"+name)}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = false\n')
    atlasPath=DEST/'atlas-layout.json';atlas=json.loads(atlasPath.read_text())
    if name not in atlas['frames']:
        n=len(atlas['frames']);atlas['frames'][name]={'x':n%16*128,'y':n//16*128,'w':128,'h':128}
    atlas['height']=math.ceil(len(atlas['frames'])/16)*128
    atlasPath.write_text(json.dumps(atlas,indent=2)+'\n')
if __name__=='__main__':build()

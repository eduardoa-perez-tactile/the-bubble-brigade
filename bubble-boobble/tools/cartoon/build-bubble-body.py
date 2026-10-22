#!/usr/bin/env python3
"""Reproducible neutral color-wash layer for the existing procedural bubble.
The original ink/rim asset remains independent and unchanged.
"""
from pathlib import Path
import json,math,uuid
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'assets/cartoon'
def build():
    scale=4;size=128*scale
    image=Image.new('RGBA',(size,size));pixels=image.load()
    for y in range(size):
        for x in range(size):
            dx=(x/scale-64)/57.5;dy=(y/scale-64)/57.5;r=math.hypot(dx,dy)
            if r>=1:continue
            # Transparent center with a stronger colored meniscus at the edge.
            edge=max(0,min(1,(r-.58)/.4));alpha=(56+64*edge*edge)*min(1,(1-r)/.025)
            pixels[x,y]=(255,255,255,round(alpha))
    name='bubble-body';path=DEST/'frames'/f'{name}.png';image.resize((128,128),Image.Resampling.LANCZOS).save(path)
    path.with_suffix('.png.gmeta').write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/"+name)}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = true\n')
    atlasPath=DEST/'atlas-layout.json';atlas=json.loads(atlasPath.read_text())
    if name not in atlas['frames']:
        n=len(atlas['frames']);atlas['frames'][name]={'x':n%16*128,'y':n//16*128,'w':128,'h':128}
    atlas['height']=math.ceil(len(atlas['frames'])/16)*128;atlasPath.write_text(json.dumps(atlas,indent=2)+'\n')
if __name__=='__main__':build()

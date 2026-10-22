#!/usr/bin/env python3
"""Normalize approved VFX art without repainting it; keep a reproducible import."""
from pathlib import Path
import json,math,runpy,uuid
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'assets/cartoon'
runpy.run_path(str(Path(__file__).with_name('build-bubble-body.py')),run_name='__main__')
runpy.run_path(str(Path(__file__).with_name('build-bubble-shine.py')),run_name='__main__')
source=Image.open(ROOT/'art/feedback/dust-puff-source-2026-10-22.png').convert('RGBA')
# Ignore alpha<=2 stray generation noise when finding the drawing boundary.
source=source.crop(source.getchannel('A').point(lambda v:255 if v>2 else 0).getbbox());source.thumbnail((128,64),Image.Resampling.LANCZOS)
canvas=Image.new('RGBA',(128,64));canvas.alpha_composite(source,((128-source.width)//2,64-source.height))
path=DEST/'frames/dust-puff.png';canvas.save(path)
path.with_suffix('.png.gmeta').write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/dust-puff")}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = true\n')
atlasPath=DEST/'atlas-layout.json';atlas=json.loads(atlasPath.read_text())
if 'dust-puff' not in atlas['frames']:
 n=len(atlas['frames']);atlas['frames']['dust-puff']={'x':n%16*128,'y':n//16*128,'w':128,'h':64}
atlas['height']=math.ceil(len(atlas['frames'])/16)*128;atlasPath.write_text(json.dumps(atlas,indent=2)+'\n')

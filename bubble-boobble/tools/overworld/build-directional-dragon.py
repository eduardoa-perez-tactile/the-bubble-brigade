# Historical six-frame prototype builder; not used by current production. See build-oblique-dragon.py.
"""Package the one seeded six-frame ImageGen edit with the established Brigade skin palette.
The sprite-pipeline normalizer provides one shared scale and bottom-center anchor.
Runtime mirrors the front walk alternating key, preserving a readable opposite-foot stride.
"""
from pathlib import Path
from PIL import Image
import colorsys, uuid, json
ROOT=Path(__file__).resolve().parents[2]
SKINS={'green':'#81b94b','blue':'#468bc8','red':'#ce6459','yellow':'#e3b953','purple':'#a87fbd','orange':'#dc9351','cyan':'#54b7bf','pink':'#d88eaa','ivory':'#c5c6a5','slate':'#718297'}
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
names=['down-idle','down-walk-0','down-walk-1','up-idle','up-walk-0','up-walk-1']
for i,name in enumerate(names):
 source=Image.open(ROOT/f'tools/overworld/source/direction-normalized/{i+1:02d}.png').convert('RGBA')
 frame=Image.new('RGBA',(128,128));frame.alpha_composite(source,(10,12))
 for skin,color in SKINS.items():
  p=ROOT/f'assets/overworld-shared/dragon/{skin}/{name}.png';p.parent.mkdir(parents=True,exist_ok=True)
  (frame if skin=='green' else recolor(frame,color)).save(p)
  m=p.with_suffix('.png.gmeta')
  if not m.exists():m.write_text(f'guid = "{uuid.uuid4()}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\nfilter = "linear"\natlas = "overworld-shared"\ncompression = "astc6x6"\ntrim = false\nmax_size = 128\n')

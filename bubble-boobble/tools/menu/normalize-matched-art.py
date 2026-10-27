"""Mechanical strip slicing and shared foot registration; preserves generated artwork."""
from PIL import Image,ImageFilter
from pathlib import Path
import json,uuid
root=Path(__file__).resolve().parents[2]/'assets/cartoon/menu'
sources=Path(__file__).resolve().parent/'originals'
# Fixed approved camera and matching cutouts.
Image.open(sources/'exec-6bee963d-60b3-47b7-a397-3e641afe8139.png').save(root/'harbor.png')
focus=Image.open(sources/'exec-239aa6e8-a9e3-4670-b45b-473041cc18ac.png').convert('RGBA');box=focus.getchannel('A').point(lambda a:255 if a>30 else 0).getbbox();part=focus.crop(box);part.resize((128,round(part.height*128/part.width)),Image.Resampling.LANCZOS).save(root/'focus-bubble.png')
strip=Image.open(sources/'exec-d8c78e00-77b4-4330-9a1f-352bb8d5a91d.png').convert('RGBA');frames=[]
for i in range(4):
 slot=strip.crop((round(i*strip.width/4),0,round((i+1)*strip.width/4),strip.height));box=slot.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox();frames.append(slot.crop(box))
scale=480/max(max(p.size) for p in frames)
for i,im in enumerate(frames,1):
 im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);out=Image.new('RGBA',(512,512));out.alpha_composite(im,((512-im.width)//2,512-im.height));out.save(root/f'greeting/{i:02}.png')
# Four lettering rows from the exact approved lettering cutout, same shared scale.
source=Image.open(sources/'exec-7dc3ec40-5554-4cf0-894a-9e85657d28e1.png').convert('RGBA')
rows=[(0,200),(220,420),(440,620),(650,source.height)];parts=[]
for a,b in rows:
 im=source.crop((0,a,source.width,b));box=im.getchannel('A').point(lambda a:255 if a>100 else 0).getbbox();parts.append(im.crop(box))
s=1000/max(p.width for p in parts);(root/'type').mkdir(exist_ok=True)
for name,im in zip(['continue','arcade','options','quit'],parts):
 im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS);out=Image.new('RGBA',(1024,112));out.alpha_composite(im,(0,(112-im.height)//2));out.save(root/f'type/{name}.png')
# A broad feathered diagonal light. Scene geometry is unchanged by its animation.
im=Image.new('RGBA',(512,1024));pix=im.load()
for y in range(1024):
 t=y/1023;center=395-180*t;half=80+110*t
 for x in range(512):
  edge=max(0,1-abs(x-center)/half);fade=min(1,t*8)*min(1,(1-t)*8);pix[x,y]=(198,208,170,round(28*min(1,edge*4)*fade))
im.filter(ImageFilter.GaussianBlur(3)).save(root/'spotlight.png')
for f in root.rglob('*.png'):
 meta=Path(str(f)+'.gmeta')
 if meta.exists():continue
 meta.write_text(f'guid = "{uuid.uuid4()}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "menu-presentation"\nfilter = "linear"\ncompression = "astc6x6"\ntrim = false\nmax_size = 1024\n')

# Lock the held pose to the approved complete cutout, retaining the exact tail silhouette.
im=Image.open(sources/'exec-133476ad-8de9-4959-bf97-dd7096812ce9.png').convert('RGBA');box=im.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox();im=im.crop(box);s=480/max(im.size);im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS);out=Image.new('RGBA',(512,512));out.alpha_composite(im,((512-im.width)//2,512-im.height))
for i in ['01','04']:out.save(root/f'greeting/{i}.png')

# Connected-component extraction avoids neighboring tails crossing nominal strip slots.
import runpy
runpy.run_path(str(Path(__file__).with_name("extract-greeting.py")))

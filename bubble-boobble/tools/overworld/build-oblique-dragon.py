"""Normalize the original 24-pose ImageGen sheet and derive established Brigade skins.
Repacking only extracts authored sprites; no painted pose is reconstructed or borrowed.
Run from the project root. Requires Pillow and the preserved sprite-pipeline normalizer.
"""
from pathlib import Path
from PIL import Image,ImageOps
from collections import deque
import colorsys,json,subprocess,uuid
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'tools/overworld/source/dragon-eightway-source-edit-v3.png'
WORK=ROOT/'tools/overworld/source/oblique-normalized'
WORK.mkdir(exist_ok=True)
im=Image.open(SOURCE).convert('RGBA');w,h=im.size
mask=bytearray(1 if a>64 else 0 for a in im.getchannel('A').getdata());boxes=[]
for i in range(w*h):
 if not mask[i]:continue
 mask[i]=0;queue=deque([i]);count=0;x0=w;y0=h;x1=y1=0
 while queue:
  j=queue.popleft();x=j%w;y=j//w;count+=1;x0=min(x0,x);x1=max(x1,x);y0=min(y0,y);y1=max(y1,y)
  for k in (j-1 if x else -1,j+1 if x<w-1 else -1,j-w,j+w):
   if 0<=k<w*h and mask[k]:mask[k]=0;queue.append(k)
 if count>100:boxes.append((x0,y0,x1+1,y1+1))
assert len(boxes)==24, f'Expected24 connected character poses, got{len(boxes)}'
# Authored rows are separated by240px; the model offsets cells slightly. Order actual
# silhouettes by row then x rather than slicing a limb at an assumed equal-grid border.
boxes.sort(key=lambda b:(round((b[1]+b[3])/2/240),b[0]))
strip=Image.new('RGBA',(256*24,256))
for i,b in enumerate(boxes):
 b=(max(0,b[0]-2),max(0,b[1]-2),min(w,b[2]+2),min(h,b[3]+2))
 frame=im.crop(b);strip.alpha_composite(frame,(i*256+(256-frame.width)//2,246-frame.height))
strip.save(WORK/'strip.png')
normalizer=Path('/Users/eduardoleale/.codex/plugins/cache/openai-curated-remote/game-studio/0.1.2/scripts/normalize_sprite_strip.py')
subprocess.run(['python3',str(normalizer),'--input',str(WORK/'strip.png'),'--out-dir',str(WORK/'frames'),'--frames','24','--frame-size','108'],check=True)
SKINS={'green':'#81b94b','blue':'#468bc8','red':'#ce6459','yellow':'#e3b953','purple':'#a87fbd','orange':'#dc9351','cyan':'#54b7bf','pink':'#d88eaa','ivory':'#c5c6a5','slate':'#718297'}
def recolor(image,color):
 hue,sat,val=colorsys.rgb_to_hsv(*(int(color[i:i+2],16)/255 for i in (1,3,5)));out=image.copy();pixels=[]
 for r,g,b,a in image.getdata():
  if g>r*1.06 and g>b*1.13 and g>45:
   _,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
   nr,ng,nb=colorsys.hsv_to_rgb(hue,min(.88,sat*s/.60),min(1,v*val/.74));r,g,b=round(nr*255),round(ng*255),round(nb*255)
  pixels.append((r,g,b,a))
 out.putdata(pixels);return out
DIRECTIONS=['down','down-right','right','up-right','up','up-left','left','down-left']
preview=Image.new('RGBA',(128*6,128*4),(244,215,154,255));metrics=[]
for i in range(24):
 source=Image.open(WORK/f'frames/{i+1:02d}.png').convert('RGBA')
 # Front/back are symmetric: derive opposite contact by mirroring the first authored
 # contact, ensuring genuinely alternating feet rather than model-biased near duplicates.
 if i in (2,14):source=ImageOps.mirror(Image.open(WORK/f'frames/{i:02d}.png').convert('RGBA'))
 frame=Image.new('RGBA',(128,128));frame.alpha_composite(source,(10,12))
 name=f'{DIRECTIONS[i//3]}-{["idle","walk-0","walk-1"][i%3]}'
 # Clear RGB under alpha0 for export hygiene; retain generated antialiasing.
 frame.putdata([(r,g,b,a) if a else (0,0,0,0) for r,g,b,a in frame.getdata()])
 for skin,color in SKINS.items():
  path=ROOT/f'assets/overworld-shared/dragon-oblique/{skin}/{name}.png';path.parent.mkdir(parents=True,exist_ok=True)
  (frame if skin=='green' else recolor(frame,color)).save(path)
  meta=path.with_suffix('.png.gmeta')
  if not meta.exists():meta.write_text(f'guid = "{uuid.uuid4()}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\nfilter = "linear"\natlas = "overworld-shared"\ncompression = "astc6x6"\ntrim = false\nmax_size = 128\n')
 preview.alpha_composite(frame,((i%6)*128,(i//6)*128));metrics.append({'frame':name,'bounds':frame.getbbox(),'anchor':[64,120]})
preview.save(WORK/'preview.png');(WORK/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')

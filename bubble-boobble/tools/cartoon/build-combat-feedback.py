"""Normalize original cartoon VFX and boss sources; preserve alpha and common registration."""
from pathlib import Path
import json,uuid,math
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'assets/cartoon'
atlas=json.loads((DEST/'atlas-layout.json').read_text())
def save(key,im):
 p=DEST/'frames'/(key+'.png');p.parent.mkdir(parents=True,exist_ok=True);im.save(p)
 meta=p.with_suffix('.png.gmeta')
 if not meta.exists():meta.write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/"+key)}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = true\n')
 if key not in atlas['frames']:
  n=len(atlas['frames']);atlas['frames'][key]={'x':n%16*128,'y':n//16*128,'w':128,'h':128}
sheet=Image.open(ROOT/'art/combat-feedback/fireball-source.png').convert('RGBA')
for i in range(4):
 cell=sheet.crop((round(i*sheet.width/4),0,round((i+1)*sheet.width/4),sheet.height))
 box=cell.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();cell=cell.crop(box)
 cell.thumbnail((232,118),Image.Resampling.LANCZOS)
 frame=Image.new('RGBA',(256,128));frame.alpha_composite(cell,(244-cell.width,(128-cell.height)//2))
 save(f'boss/fireball-{i}',frame)
source=Image.open(ROOT/'art/combat-feedback/potion-source.png').convert('RGBA')
source=source.crop(source.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox())
source.thumbnail((104,112),Image.Resampling.LANCZOS)
frame=Image.new('RGBA',(128,128));frame.alpha_composite(source,((128-source.width)//2,120-source.height))
save('item/thunder_potion',frame)
source=ROOT/'art/combat-feedback/boss-source.png'
if source.exists():
 sheet=Image.open(source).convert('RGBA');cells=[]
 for row in range(2):
  for col in range(4):
   c=sheet.crop((round(col*sheet.width/4),round(row*sheet.height/2),round((col+1)*sheet.width/4),round((row+1)*sheet.height/2)))
   c=c.crop(c.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox());cells.append(c)
 scale=min(340/max(c.width for c in cells),324/max(c.height for c in cells))
 for name,c in zip(['move-0','move-1','windup','release','captured','hit','angry','angry-windup'],cells):
  c=c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.LANCZOS)
  frame=Image.new('RGBA',(384,384));frame.alpha_composite(c,((384-c.width)//2,360-c.height));save('boss/simple-'+name,frame)
animationPath=DEST/'animation.json'
animation=json.loads(animationPath.read_text())
for name in ['move-0','move-1','windup','release','captured','hit','angry','angry-windup']:
 key='boss/simple-'+name
 im=Image.open(DEST/'frames'/(key+'.png'))
 animation['frames'][key]={'feet':[192,360],'canvasSize':[384,384],'visualBounds':list(im.getchannel('A').getbbox()),
  'sourceSheet':'art/combat-feedback/boss-source.png','rig':'single-body'}
animationPath.write_text(json.dumps(animation,indent=2)+'\n')
atlas['height']=math.ceil(len(atlas['frames'])/16)*128
(DEST/'atlas-layout.json').write_text(json.dumps(atlas,indent=2)+'\n')

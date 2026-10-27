from PIL import Image,ImageChops,ImageFilter
from pathlib import Path
from collections import deque
root=Path('assets/cartoon/menu');source=Path('tools/menu/originals/exec-d8c78e00-77b4-4330-9a1f-352bb8d5a91d.png')
im=Image.open(source).convert('RGBA');w,h=im.size;mask=bytearray(1 if v>20 else 0 for v in im.getchannel('A').getdata());components=[]
for seed in range(w*h):
 if mask[seed]!=1:continue
 mask[seed]=0;q=[seed];loX=w;loY=h;hiX=hiY=0;count=0;points=[]
 while q:
  k=q.pop();points.append(k);x=k%w;y=k//w;loX=min(loX,x);hiX=max(hiX,x);loY=min(loY,y);hiY=max(hiY,y);count+=1
  for v in ([k-1] if x else [])+([k+1] if x+1<w else [])+([k-w] if y else [])+([k+w] if y+1<h else []):
   if mask[v]==1:mask[v]=0;q.append(v)
 if count>5000:components.append((count,(max(0,loX-2),max(0,loY-2),min(w,hiX+3),min(h,hiY+3)),points))
boxes=sorted(sorted(components,reverse=True)[:4],key=lambda p:p[1][0]);print('Extracted four complete character components')
frames=[]
for _,box,points in boxes:
 matte=Image.new('L',(w,h));px=matte.load()
 for k in points:px[k%w,k//w]=255
 matte=matte.filter(ImageFilter.MaxFilter(5));part=im.copy();part.putalpha(ImageChops.multiply(im.getchannel('A'),matte));frames.append(part.crop(box))
scale=480/max(max(p.size) for p in frames)
for i,p in enumerate(frames,1):
 p=p.resize((round(p.width*scale),round(p.height*scale)),Image.Resampling.LANCZOS);out=Image.new('RGBA',(512,512));out.alpha_composite(p,((512-p.width)//2,512-p.height));out.save(root/f'greeting/{i:02}.png')
# The exact approved held pose, including its complete tail.
p=Image.open('tools/menu/originals/exec-133476ad-8de9-4959-bf97-dd7096812ce9.png').convert('RGBA');box=p.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox();p=p.crop(box);s=480/max(p.size);p=p.resize((round(p.width*s),round(p.height*s)),Image.Resampling.LANCZOS);out=Image.new('RGBA',(512,512));out.alpha_composite(p,((512-p.width)//2,512-p.height))
for i in ['01','04']:out.save(root/f'greeting/{i}.png')

"""Normalize reviewed original generated art into filtered native sprites.
Creative masters: docs/cartoon-overhaul/sources. Pillow only slices, aligns, scales,
recolors and exports them. Explicit procedural derivatives are identified in metadata.
No original pixel assets, fixtures, goldens or migration evidence are rewritten.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance, ImageOps
import colorsys, json, math, uuid
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'docs/cartoon-overhaul'
DEST=ROOT/'assets/cartoon'
DEST.mkdir(parents=True,exist_ok=True)
images={};metadata={};frames={}
skins={'green':'#81b94b','blue':'#468bc8','red':'#ce6459','yellow':'#e3b953','purple':'#a87fbd','orange':'#dc9351','cyan':'#54b7bf','pink':'#d88eaa','ivory':'#c5c6a5','slate':'#718297'}
def put(name,image,x=0,y=0):images[name]=image

def isolate(cell,components=True):
    cell=cell.convert('RGBA')
    if components:
        mask=cell.getchannel('A').point(lambda a:255 if a>100 else 0)
        small=mask.resize((max(1,cell.width//3),max(1,cell.height//3)),Image.Resampling.NEAREST)
        pixels=small.load();seen=set();groups=[]
        for yy in range(small.height):
            for xx in range(small.width):
                if not pixels[xx,yy] or (xx,yy) in seen:continue
                stack=[(xx,yy)];seen.add((xx,yy));group=[]
                while stack:
                    px,py=stack.pop();group.append((px,py))
                    for nx,ny in [(px-1,py),(px+1,py),(px,py-1),(px,py+1)]:
                        if 0<=nx<small.width and 0<=ny<small.height and (nx,ny) not in seen and pixels[nx,ny]:
                            seen.add((nx,ny));stack.append((nx,ny))
                groups.append(group)
        largest=max(groups,key=len);clean=Image.new('L',small.size)
        # Preserve intentional detached details larger than 2% of the core, but not
        # fragments touching the cell boundaries from neighbouring drawings.
        for group in groups:
            keep=group is largest or (len(group)>len(largest)*.02 and all(2<x<small.width-3 and 2<y<small.height-3 for x,y in group))
            if keep:
                for xy in group:clean.putpixel(xy,255)
        clean=clean.resize(cell.size,Image.Resampling.NEAREST).filter(ImageFilter.MaxFilter(9))
        cell.putalpha(ImageChops.multiply(cell.getchannel('A'),clean))
    box=cell.getchannel('A').point(lambda a:255 if a>100 else 0).getbbox()
    assert box
    return cell.crop(box)

slices={}
def grid(source,cols,rows,index):
    # Generated sheets do not reliably obey equal cells. Segment whole source
    # silhouettes first, then assign the reviewed row/column order. This prevents
    # severed fruit bottoms and clipped antennae at nominal grid boundaries.
    if source not in slices:
        im=Image.open(SOURCE/'sources'/source).convert('RGBA')
        divisor=3;mask=im.getchannel('A').point(lambda a:255 if a>100 else 0).resize((im.width//divisor,im.height//divisor),Image.Resampling.NEAREST)
        pixels=mask.load();seen=set();groups=[]
        for yy in range(mask.height):
            for xx in range(mask.width):
                if not pixels[xx,yy] or (xx,yy) in seen:continue
                stack=[(xx,yy)];seen.add((xx,yy));count=0;left=right=xx;top=bottom=yy
                while stack:
                    px,py=stack.pop();count+=1;left=min(left,px);right=max(right,px);top=min(top,py);bottom=max(bottom,py)
                    for nx,ny in [(px-1,py),(px+1,py),(px,py-1),(px,py+1)]:
                        if 0<=nx<mask.width and 0<=ny<mask.height and (nx,ny) not in seen and pixels[nx,ny]:seen.add((nx,ny));stack.append((nx,ny))
                groups.append((count,(left,top,right,bottom)))
        major=sorted(groups,reverse=True)[:cols*rows]
        assert len(major)==cols*rows,(source,len(major))
        boxes=[b for _,b in sorted(major,key=lambda item:item[1][1]+item[1][3])]
        boxes=[b for row in range(rows) for b in sorted(boxes[row*cols:(row+1)*cols],key=lambda b:b[0]+b[2])]
        boxes=[(max(0,l*divisor-5),max(0,t*divisor-5),min(im.width,(r+1)*divisor+5),min(im.height,(b+1)*divisor+5)) for l,t,r,b in boxes]
        slices[source]=(im,boxes)
    im,boxes=slices[source]
    return im.crop(boxes[index])

def normalize(cell,fit=112,feet=True,flip=False):
    fig=isolate(cell)
    if flip:fig=ImageOps.mirror(fig)
    factor=min(fit/fig.width,fit/fig.height)
    fig=fig.resize((max(1,round(fig.width*factor)),max(1,round(fig.height*factor))),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(128,128));out.alpha_composite(fig,((128-fig.width)//2,120-fig.height if feet else (128-fig.height)//2));return out

def recolor(image,color):
    hue,sat,val=colorsys.rgb_to_hsv(*(int(color[i:i+2],16)/255 for i in (1,3,5)));out=image.copy();pixels=[]
    for r,g,b,a in image.getdata():
        if g>r*1.06 and g>b*1.13 and g>45:
            _,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
            nr,ng,nb=colorsys.hsv_to_rgb(hue,min(.88,sat*s/.60),min(1,v*val/.74));r,g,b=round(nr*255),round(ng*255),round(nb*255)
        pixels.append((r,g,b,a))
    out.putdata(pixels);return out

hero_names=['idle-0','idle-1','run-0','run-1','run-2','run-3','jump-0','jump-1','shoot-0','shoot-1','hurt-0','down-0']
for i,name in enumerate(hero_names):
    # Normalized authored poses. Frame height is held at108 for standing poses,
    # while the downed pose intentionally occupies a shorter silhouette.
    master=normalize(grid('dragon.png',4,3,i),fit=108)
    if name.startswith('shoot'):
        # A64world drawing needs muzzle[100,80] to coincide with authoritative
        # bubble centre (player+40,+24); original48world sheet was too high.
        fig=isolate(grid('shoot.png',2,1,i-8))
        # Reviewed crouched masters keep full head/body mass during firing. Source
        # mouth at60% height, soles at100%; fit the anchored40px vertical delta.
        fig=fig.resize((100,100),Image.Resampling.LANCZOS)
        master=Image.new('RGBA',(128,128));master.alpha_composite(fig,(0,20))
    if name=='down-0':
        fig=isolate(grid('dragon.png',4,3,i));factor=112/fig.width;fig=fig.resize((112,round(fig.height*factor)),Image.Resampling.LANCZOS)
        master=Image.new('RGBA',(128,128));master.alpha_composite(fig,(8,120-fig.height))
    for skin,color in skins.items():
        frame=recolor(master,color)
        if skin=='blue' and name!='down-0':
            d=ImageDraw.Draw(frame);box=frame.getchannel('A').getbbox();top=box[1]
            d.ellipse((23,top+3,57,top+15),fill='#292a29');d.ellipse((26,top+5,56,top+12),fill=color)
        key=f'dragon/{skin}/{name}';put(key,frame)
        metadata[key]={'feet':[64,120],'muzzle':[100,80] if name.startswith('shoot') else [101,57],'visualBounds':list(frame.getchannel('A').getbbox()),'sourceCell':[i%4,i//4],'master':name}

kinds=['zenchan','monsta','pulpul','banebou','invader','mighta']
for row,kind in enumerate(kinds):
    masters=[normalize(grid('enemies.png',4,6,row*4+i),flip=True) for i in range(4)]
    for name,index in [('walk-0',0),('walk-1',1),('angry-0',3),('captured-0',2),('warning-0',3),('escape-0',3),('dead-0',2),('shoot-0',3)]:
        frame=masters[index]
        if name=='dead-0':frame=frame.rotate(28,Image.Resampling.BICUBIC,expand=False)
        put(f'enemy/{kind}/{name}',frame)
        metadata[f'enemy/{kind}/{name}']={'feet':[64,120],'sourceCell':[index,row],'derivative':name in ['warning-0','escape-0','dead-0','shoot-0']}
# Backward compatible public first-slice frame aliases; all now use newmasters.
for name,target in [('walk-0','walk-0'),('walk-1','walk-1'),('captured-0','captured-0'),('warning-0','warning-0'),('escape-0','escape-0')]:put('imp/'+name,images['enemy/zenchan/'+target])

for name,index in [('move-0',0),('move-1',1),('attack-0',2),('captured-0',3),('bottle-0',5)]:
    cell=grid('boss.png',3,2,index)
    put('boss/'+name,normalize(cell,flip=True,feet=index!=5))
for i in range(25):put(f'item/food-{i+1}',normalize(grid('food.png',5,5,i),fit=108,feet=False))
powers=['pink_candy','blue_candy','yellow_candy','shoes','orange_parasol','red_parasol','purple_parasol','crystal_ring','amethyst_ring','ruby_ring','dynamite','clock','thunder_potion']
for i,name in enumerate(powers):put('item/'+name,normalize(grid('powerups.png',5,3,i),fit=108,feet=False))
for name,i in [('boulder-0',13),('laser-0',14)]:put('effect/'+name,normalize(grid('powerups.png',5,3,i),fit=112,feet=False))
for i,name in enumerate(['fire-0','fire-1','water-0','thunder-0','flame-0','spark-0']):put('effect/'+name,normalize(grid('effects.png',3,2,i),fit=112,feet=False))
for i,name in enumerate(['platform-left','platform-middle','platform-right','wall','corner','bracket']):
    fig=isolate(grid('masonry.png',3,2,i));put(name,fig.resize((128,128),Image.Resampling.LANCZOS))
put('platform',images['platform-middle'])

def art(name,fn,x=0,y=0,size=128):
    scale=4;image=Image.new('RGBA',(size*scale,size*scale));fn(ImageDraw.Draw(image),scale);put(name,image.resize((size,size),Image.Resampling.LANCZOS))
def bubble(d,s):
    d.ellipse((6*s,6*s,122*s,122*s),outline='#3d647a',width=3*s)
    d.arc((9*s,9*s,119*s,119*s),190,345,fill='#d7f5f1',width=3*s)
    d.arc((10*s,10*s,118*s,118*s),10,100,fill='#f3c1cf',width=2*s)
    d.arc((19*s,18*s,105*s,106*s),205,252,fill='#fff9e7',width=5*s)
art('bubble',bubble)
def pop(d,s):
    for i in range(8):
        angle=i*math.pi/4;d.line((64*s+30*s*math.cos(angle),64*s+30*s*math.sin(angle),64*s+49*s*math.cos(angle),64*s+49*s*math.sin(angle)),fill='#fff1c4',width=4*s)
    d.ellipse((43*s,43*s,85*s,85*s),outline='#a9e3df',width=2*s)
art('pop',pop)
def shadow(d,s):d.ellipse((8*s,46*s,120*s,80*s),fill=(25,33,36,100))
art('shadow',shadow)
symbols=['circle','diamond','heart','star','club','triangle','moon','flower','square','spade']
for index,(skin,color) in enumerate(skins.items()):
    def badge(d,s,index=index,color=color):
        d.ellipse((15*s,15*s,113*s,113*s),fill='#f6e5be',outline='#252e32',width=7*s)
        ink='#26363c'
        def poly(points):d.polygon([(x*s,y*s) for x,y in points],fill=color,outline=ink,width=3*s)
        if index==0:d.ellipse((35*s,35*s,93*s,93*s),fill=color,outline=ink,width=3*s)
        elif index==1:poly([(64,27),(97,64),(64,101),(31,64)])
        elif index==2:
            poly([(33,53),(47,34),(64,43),(81,34),(96,53),(64,98)])
        elif index==3:
            poly([(64+(35 if j%2==0 else 15)*math.cos(-math.pi/2+j*math.pi/5),64+(35 if j%2==0 else 15)*math.sin(-math.pi/2+j*math.pi/5)) for j in range(10)])
        elif index==4:
            for x,y in [(64,43),(44,69),(84,69)]:d.ellipse(((x-18)*s,(y-18)*s,(x+18)*s,(y+18)*s),fill=color,outline=ink,width=3*s)
            d.rectangle((59*s,74*s,69*s,102*s),fill=ink)
        elif index==5:poly([(64,28),(99,97),(29,97)])
        elif index==6:
            d.ellipse((30*s,28*s,100*s,101*s),fill=color,outline=ink,width=3*s)
            d.ellipse((57*s,21*s,109*s,83*s),fill='#f6e5be')
        elif index==7:
            for j in range(5):
                x=64+24*math.cos(j*math.pi*2/5);y=64+24*math.sin(j*math.pi*2/5)
                d.ellipse(((x-15)*s,(y-15)*s,(x+15)*s,(y+15)*s),fill=color,outline=ink,width=3*s)
            d.ellipse((56*s,56*s,72*s,72*s),fill='#f6e5be',outline=ink,width=2*s)
        elif index==8:poly([(35,35),(93,35),(93,93),(35,93)])
        else:
            poly([(64,28),(96,67),(88,86),(64,78),(40,86),(32,67)])
            d.rectangle((59*s,72*s,69*s,103*s),fill=ink)
    art('badge/'+skin,badge,index*128,768)


# Export reproducible per-frame native sprite assets; master atlas is QA only.
cols=16;rows=math.ceil(len(images)/cols);atlas=Image.new('RGBA',(cols*128,rows*128))
for i,(name,image) in enumerate(images.items()):
    x=i%cols*128;y=i//cols*128;atlas.alpha_composite(image,(x,y));frames[name]=dict(x=x,y=y,w=128,h=128)
    path=DEST/'frames'/(name+'.png');path.parent.mkdir(parents=True,exist_ok=True);image.save(path)
    path.with_suffix('.png.gmeta').write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/"+name)}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = false\n')
for previous in (DEST/'frames').rglob('*.png'):
    if previous.relative_to(DEST/'frames').as_posix()[:-4] not in frames:
        previous.unlink();previous.with_suffix('.png.gmeta').unlink(missing_ok=True)
atlas.save(SOURCE/'normalized-atlas.png')
(SOURCE/'source-slices.json').write_text(json.dumps({name:boxes for name,(_,boxes) in slices.items()},indent=2)+'\n')
(DEST/'atlas-layout.json').write_text(json.dumps(dict(width=atlas.width,height=atlas.height,frames=frames),indent=2)+'\n')
(DEST/'animation.json').write_text(json.dumps(dict(feet=[64,120],frames=metadata,clips={
'idle':{'frames':['idle-0','idle-1','idle-0'],'durations':[120,7,53],'loop':True},
'run':{'frames':['run-0','run-1','run-2','run-3'],'durations':[6,6,6,6],'loop':True},
'jump':{'frames':['jump-0','jump-1'],'durations':[18,42],'loop':False},
'shoot':{'frames':['shoot-0','shoot-1'],'durations':[4,8],'loop':False},
'hurt':{'frames':['hurt-0'],'durations':[12],'loop':False},
'down':{'frames':['down-0'],'durations':[90],'loop':False}},identities=symbols),indent=2)+'\n')
background=Image.open(SOURCE/'sources/courtyard.png').convert('RGB').resize((1536,864),Image.Resampling.LANCZOS)
background.save(DEST/'courtyard.png')
# Explicit lossless linear filtered background matches live/cooked colour.
(DEST/'courtyard.png.gmeta').write_text(f'guid = "9850f803-9455-436c-b07a-57f7aca42a2c"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\nfilter = "linear"\ncompression = "none"\n\n[settings.overrides.phone-low]\nmax_size = 768\n')
Image.new('RGBA',(4,4),'white').save(DEST/'white.png')
(DEST/'white.png.gmeta').write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/white")}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = false\n')
preview=Image.new('RGBA',(12*128,8*128),'#f4e4c2')
for col,name in enumerate(hero_names):preview.alpha_composite(images['dragon/green/'+name],(col*128,0))
for row,kind in enumerate(kinds):
    for col,name in enumerate(['walk-0','walk-1','captured-0','warning-0']):preview.alpha_composite(images[f'enemy/{kind}/{name}'],(col*128,(row+1)*128))
for col,name in enumerate(['platform-left','platform-middle','platform-right','wall','boss/move-0','item/food-1','item/pink_candy','effect/fire-0']):preview.alpha_composite(images[name],(col*128,7*128))
preview.save(SOURCE/'normalized-poses.png')
print('Exported',len(frames),'original cartoon frames, ZERO legacy pixel sprites.')

# Expanded motion clips are maintained from separate whole-strip masters.
# Keep this hook after the base export so a full art rebuild retains them.
import runpy
runpy.run_path(str(ROOT/'tools/cartoon/build-dragon-animation.py'),run_name='__main__')

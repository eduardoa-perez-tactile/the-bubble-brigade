"""Normalize reviewed generated key poses; pack an independent filtered atlas.

Requires Pillow. Sources live outside cooked assets. No original asset is changed.
Creative drawings are image-generated; rings, badges and masonry are code-native art.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import colorsys, hashlib, json, math

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/cartoon-slice'
DEST = ROOT / 'assets/cartoon'
DEST.mkdir(parents=True, exist_ok=True)
atlas = Image.new('RGBA', (2048, 2048))
frames = {}
metadata = {}
names = ['idle-0','run-0','run-1','run-2','jump-0','shoot-0','hurt-0','down-0']
skins = {'green':'#81b94b','blue':'#468bc8','red':'#ce6459','yellow':'#e3b953','purple':'#a87fbd',
         'orange':'#dc9351','cyan':'#54b7bf','pink':'#d88eaa','ivory':'#c5c6a5','slate':'#718297'}

def put(name, image, x, y):
    atlas.alpha_composite(image, (x,y))
    frames[name] = dict(x=x,y=y,w=image.width,h=image.height)

sheet = Image.open(SOURCE/'dragon-source.png').convert('RGBA')
for skin_index,(skin,hex_color) in enumerate(skins.items()):
    target = tuple(int(hex_color[i:i+2],16)/255 for i in (1,3,5))
    hue,saturation,value = colorsys.rgb_to_hsv(*target)
    for pose,name in enumerate(names):
        box=(pose%4*384,pose//4*512,(pose%4+1)*384,(pose//4+1)*512)
        if pose==6:box=(768,512,1110,1024)
        if pose==7:box=(1120,512,1536,1024)
        cell = sheet.crop(box)
        # Ignore zero/low-alpha fringe when finding the figure. Keep original alpha.
        bounds = cell.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
        assert bounds, name
        figure = cell.crop(bounds)
        # Shared source scale prevents independently inflating squat/jump/defeat poses.
        factor = 108/410
        figure = figure.resize((round(figure.width*factor),round(figure.height*factor)),Image.Resampling.LANCZOS)
        pixels = list(figure.getdata())
        recolored=[]
        for r,g,b,a in pixels:
            if g>r*1.06 and g>b*1.13 and g>45:
                _,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
                nr,ng,nb=colorsys.hsv_to_rgb(hue,min(.88,saturation*s/.60),min(1,v*value/.74))
                r,g,b=round(nr*255),round(ng*255),round(nb*255)
            recolored.append((r,g,b,a))
        figure.putdata(recolored)
        frame=Image.new('RGBA',(128,128))
        left=(128-figure.width)//2
        top=120-figure.height
        # A swept ink ear behind the blue master gives P2 a second silhouette.
        if skin=='blue' and pose!=7:
            d=ImageDraw.Draw(frame)
            d.ellipse((23,top+3,57,top+15),fill='#292a29',width=2)
            d.ellipse((26,top+5,56,top+12),fill=hex_color)
        frame.alpha_composite(figure,(left,top))
        index=skin_index*8+pose
        put(f'dragon/{skin}/{name}',frame,index%16*128,index//16*128)
        metadata[f'dragon/{skin}/{name}']={'feet':[64,120],'muzzle':[106,61] if name=='shoot-0' else [101,57],
             'visualBounds':list(frame.getchannel('A').getbbox()),'sourceCell':[pose%4,pose//4]}

enemy = Image.open(SOURCE/'imp-source.png').convert('RGBA')
for index,name in enumerate(['walk-0','walk-1','captured-0','warning-0']):
    boxes=[(0,0,530,724),(543,0,1060,724),(1086,0,1629,724),(1450,0,2172,724)]
    cell=enemy.crop(boxes[index])
    # A sheet is not a ready animation: remove disconnected neighboring fragments
    # at the reviewed crop boundaries before scaling the actual character.
    mask=cell.getchannel('A').point(lambda a:255 if a>100 else 0)
    small=mask.resize((max(1,cell.width//4),max(1,cell.height//4)),Image.Resampling.NEAREST)
    pixels=small.load(); seen=set(); groups=[]
    for yy in range(small.height):
        for xx in range(small.width):
            if pixels[xx,yy]==0 or (xx,yy) in seen:continue
            stack=[(xx,yy)];seen.add((xx,yy));group=[]
            while stack:
                px,py=stack.pop();group.append((px,py))
                for nx,ny in [(px-1,py),(px+1,py),(px,py-1),(px,py+1)]:
                    if 0<=nx<small.width and 0<=ny<small.height and (nx,ny) not in seen and pixels[nx,ny]:
                        seen.add((nx,ny));stack.append((nx,ny))
            groups.append(group)
    largest=max(groups,key=len)
    cleaned=Image.new('L',small.size)
    for xy in largest:cleaned.putpixel(xy,255)
    cleaned=cleaned.resize(cell.size,Image.Resampling.NEAREST).filter(ImageFilter.MaxFilter(11))
    from PIL import ImageChops
    cell.putalpha(ImageChops.multiply(cell.getchannel('A'),cleaned))
    bounds=cell.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
    assert bounds
    figure=cell.crop(bounds)
    factor=min(112/figure.width,112/figure.height)
    figure=figure.resize((round(figure.width*factor),round(figure.height*factor)),Image.Resampling.LANCZOS)
    frame=Image.new('RGBA',(128,128));frame.alpha_composite(figure,((128-figure.width)//2,120-figure.height))
    put('imp/'+name,frame,index*128,640)

# Escape reuses the furious master; its clocked rock/flip is authored in the plan.
frames['imp/escape-0']=dict(frames['imp/warning-0'])

def art(name, fn, x, y, size=128):
    scale=4
    image=Image.new('RGBA',(size*scale,size*scale))
    fn(ImageDraw.Draw(image),scale)
    put(name,image.resize((size,size),Image.Resampling.LANCZOS),x,y)

def bubble(d,s):
    d.ellipse((6*s,6*s,122*s,122*s),outline='#3d647a',width=3*s)
    d.arc((9*s,9*s,119*s,119*s),190,345,fill='#d7f5f1',width=3*s)
    d.arc((10*s,10*s,118*s,118*s),10,100,fill='#f3c1cf',width=2*s)
    d.arc((19*s,18*s,105*s,106*s),205,252,fill='#fff9e7',width=5*s)
art('bubble',bubble,512,640)
def pop(d,s):
    for i in range(8):
        angle=i*math.pi/4
        d.line((64*s+30*s*math.cos(angle),64*s+30*s*math.sin(angle),64*s+49*s*math.cos(angle),64*s+49*s*math.sin(angle)),fill='#fff1c4',width=4*s)
    d.ellipse((43*s,43*s,85*s,85*s),outline='#a9e3df',width=2*s)
art('pop',pop,640,640)
def shadow(d,s):d.ellipse((8*s,46*s,120*s,80*s),fill=(25,33,36,100))
art('shadow',shadow,768,640)
def platform(d,s):
    d.rounded_rectangle((1*s,1*s,127*s,126*s),radius=8*s,fill='#303e40',outline='#20292d',width=2*s)
    d.rectangle((3*s,18*s,125*s,116*s),fill='#667b78')
    d.line((5*s,118*s,123*s,118*s),fill='#374e52',width=9*s)
    d.line((64*s,25*s,59*s,111*s),fill='#4b6262',width=2*s)
    d.rounded_rectangle((1*s,0,127*s,28*s),radius=5*s,fill='#e8d2a3',outline='#333333',width=2*s)
    d.line((5*s,6*s,122*s,6*s),fill='#fff0ca',width=3*s)
    d.line((44*s,2*s,43*s,25*s),fill='#bda77e',width=2*s)
art('platform',platform,896,640)
def wall(d,s):
    d.rectangle((0,0,128*s,128*s),fill='#526a6b')
    d.line((0,126*s,128*s,126*s),fill='#304c52',width=5*s)
    d.line((64*s,0,64*s,128*s),fill='#3b565b',width=3*s)
    d.line((3*s,3*s,125*s,3*s),fill='#80918b',width=3*s)
art('wall',wall,1024,640)
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

# Keep unconverted enemies/items/elements in the independent atlas. Original bytes
# and provenance remain untouched. These families deliberately retain pixel art.
legacy=Image.open(ROOT/'assets/pixel-renderer/atlas.png').convert('RGBA')
atlas.alpha_composite(legacy,(0,1024))
layout=json.loads((ROOT/'assets/pixel-renderer/atlas-layout.json').read_text())
unused_prefixes=('reference/tiles/','derived/circle/','reference/logo','reference/green/','reference/blue/',
                 'reference/red/','reference/yellow/','reference/purple/','reference/orange/',
                 'reference/cyan/','reference/pink/','reference/ivory/','reference/slate/','reference/zenchan/')
for name,(x,y,w,h) in layout['rects'].items():
    if not name.startswith(unused_prefixes):frames['legacy/'+name]=dict(x=x,y=y+1024,w=w,h=h)
atlas.save(SOURCE/'normalized-atlas.png')
(DEST/'atlas-layout.json').write_text(json.dumps(dict(width=2048,height=2048,frames=frames),indent=2)+'\n')
# Native Sprite batches these subimages with GPU alpha. The retained independent
# atlas is useful for frame QA and material previews; production never expands pixels.
import uuid
for previous in (DEST/'frames').rglob('*.png'):
    name=previous.relative_to(DEST/'frames').as_posix()[:-4]
    if name not in frames:
        previous.unlink()
        previous.with_suffix('.png.gmeta').unlink(missing_ok=True)
for name,f in frames.items():
    path=DEST/'frames'/(name+'.png');path.parent.mkdir(parents=True,exist_ok=True)
    atlas.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h'])).save(path)
    meta=path.with_suffix('.png.gmeta')
    meta.write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/"+name)}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = false\n')
Image.new('RGBA',(4,4),'white').save(DEST/'white.png')
white_meta=DEST/'white.png.gmeta'
white_meta.write_text(f'guid = "{uuid.uuid5(uuid.NAMESPACE_URL,"bubble-brigade-cartoon/white")}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon"\nfilter = "linear"\ncompression = "none"\ntrim = false\n')
(DEST/'animation.json').write_text(json.dumps(dict(feet=[64,120],frames=metadata,clips={
    'idle':{'frames':['idle-0'],'durations':[60],'loop':True},
    'run':{'frames':['run-0','run-1','run-2','run-1'],'durations':[5,5,5,5],'loop':True},
    'jump':{'frames':['jump-0'],'durations':[1],'loop':False},
    'shoot':{'frames':['shoot-0'],'durations':[12],'loop':False},
    'hurt':{'frames':['hurt-0'],'durations':[12],'loop':False},
    'down':{'frames':['down-0'],'durations':[90],'loop':False}},identities=symbols),indent=2)+'\n')
background=Image.open(SOURCE/'courtyard-source.png').convert('RGB').resize((1024,768),Image.Resampling.LANCZOS)
ImageEnhance.Brightness(background).enhance(.72).save(DEST/'courtyard.png')
preview=Image.new('RGBA',(8*128,3*128),'#f4e4c2')
for row,skin in enumerate(['green','blue']):
    for col,name in enumerate(names):
        f=frames[f'dragon/{skin}/{name}'];preview.alpha_composite(atlas.crop((f['x'],f['y'],f['x']+128,f['y']+128)),(col*128,row*128))
for col,name in enumerate(['walk-0','walk-1','captured-0','warning-0']):
    f=frames['imp/'+name];preview.alpha_composite(atlas.crop((f['x'],f['y'],f['x']+128,f['y']+128)),(col*128,256))
preview.save(SOURCE/'normalized-poses.png')
print('Exported',len(frames),'frames for the native sprite atlas; master atlas retained in docs only.')

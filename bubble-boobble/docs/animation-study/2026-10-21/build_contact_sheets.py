"""Read-only study exports. Never writes to production assets or reference library."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import re,json,hashlib,math
ROOT=Path(__file__).resolve().parents[3]
LIB=Path('/Users/eduardoleale/workspace/art/cuphead')
OUT=Path(__file__).resolve().parent
P=LIB/'extracted/playable-characters/108720-cuphead/Cuphead/Cuphead'
E=LIB/'extracted/enemies/181706-forest-follies-enemies/Cuphead/Forest Follies Enemies'
F=LIB/'extracted/enemies/158519-treetop-trouble-enemies/Cuphead/Treetop Trouble Enemies/Dragonfly'
FONT='/System/Library/Fonts/Supplemental/Arial.ttf'
font=ImageFont.truetype(FONT,16);small=ImageFont.truetype(FONT,13);title=ImageFont.truetype(FONT,23)
manifest={'referenceRoot':str(LIB),'timing':'Reference exposure, frame rate, pivots and state routing are unverified; ascending numeric filename order checked visually. No Cuphead speed inferred.','sequences':{}}

def group(folder,prefix):
    result=sorted((p for p in folder.glob(prefix+'_*.png') if re.fullmatch(re.escape(prefix)+r'_\d+\.png',p.name)),key=lambda p:int(re.search(r'(\d+)\.png$',p.name)[1]))
    if not result:raise ValueError(f'Empty group {prefix}')
    return result

def own(clip,count,kind='dragon/green'):
    return [ROOT/f'assets/cartoon/frames/{kind}/{clip}-{i}.png' for i in range(count)]

def register(name,files):
    manifest['sequences'][name]=[{'path':str(p),'size':list(Image.open(p).size),'number':int(re.search(r'(\d+)\.png$',p.name)[1]) if p.name.split('-')[-1].split('.')[0].isdigit() or re.search(r'_\d+\.png$',p.name) else None,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
    return files

seq={name:register('Cuphead '+name,group(P,'cuphead_'+prefix)) for name,prefix in [('run','run'),('idle','idle'),('jump','jump'),('shoot','shoot_straight'),('shoot boil','shoot_straight_boil'),('run shoot','run_shoot'),('turn','run_turnaround'),('hit','hit'),('air hit','hit_air')]}
for name,path,prefix in [('daisy takeoff',E/'Deadly Daisy/Jump A','flowergrunt_jump_A'),('daisy jump',E/'Deadly Daisy/Jump B','flowergrunt_jump_B'),('daisy land',E/'Deadly Daisy/Land','flowergrunt_land'),('daisy run',E/'Deadly Daisy/Run','flowergrunt_run'),('acorn drop',E/'Aggravating Acorn/Drop','acorn_drop'),('acorn fall',E/'Aggravating Acorn/Fall','acorn_drop'),('acorn fly',E/'Aggravating Acorn/Fly','acorn_fly'),('dragonfly idle',F/'Idle','lv1_2_dragonfly_idle'),('dragonfly warning',F/'Idle to Attack','lv1_2_dragonfly_attack_warning'),('dragonfly attack',F/'Attack','lv1_2_dragonfly_attack'),('dragonfly recover',F/'Attack To Idle','lv1_2_dragonfly_trans_to_idle')]:seq[name]=register(name,group(path,prefix))

def sheet(filename,heading,rows,columns=8):
    # A single union crop and zoom per sequence retains its authored spacing.
    # Comparing sequences is illustrative: no source pivots or common world scale implied.
    cellw,cellh=156,188;width=columns*cellw;sections=[]
    height=90
    for label,files,authored in rows:
        ims=[Image.open(p).convert('RGBA') for p in files]
        bs=[im.getchannel('A').getbbox() for im in ims]
        union=(min(b[0] for b in bs),min(b[1] for b in bs),max(b[2] for b in bs),max(b[3] for b in bs))
        if authored:union=(0,0,128,128)
        scale=min(140/(union[2]-union[0]),140/(union[3]-union[1]))
        sections.append((label,files,ims,union,scale,height,authored));height+=42+math.ceil(len(files)/columns)*cellh
    canvas=Image.new('RGB',(width,height+24),'#e9e3d4');d=ImageDraw.Draw(canvas)
    d.text((18,10),heading,font=title,fill='#1b2c33')
    d.text((18,42),'Study only. Reading order: left to right, then next row. Labels are source suffixes.',font=font,fill='#34484f')
    d.text((18,63),'Reference timing/pivots unknown. One shared crop/zoom per sequence; no per-frame fitting.',font=small,fill='#34484f')
    for label,files,ims,union,scale,y,authored in sections:
        d.text((14,y+7),label,font=font,fill='#1b2c33')
        for i,(p,im) in enumerate(zip(files,ims)):
            x=i%columns*cellw;top=y+42+i//columns*cellh
            d.rectangle((x+2,top+2,x+cellw-3,top+cellh-3),outline='#c7c1b2')
            im=im.crop(union);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
            at=(x+(cellw-im.width)//2,top+4+(140-im.height)//2)
            if authored:
                baseline=at[1]+120*scale;cx=at[0]+64*scale
                d.line((x+5,baseline,x+cellw-5,baseline),fill='#be7863');d.line((cx,top+4,cx,top+144),fill='#c6bb9c')
            canvas.paste(im,at,im)
            suffix=p.stem.split('_')[-1] if '_' in p.stem else p.stem
            d.text((x+7,top+149),suffix,font=font,fill='#20343b')
    canvas.save(OUT/filename)
    print(filename,canvas.size)

sheet('01-dragon-current.png','Current dragon drawings and authored anchors',[
 ('Run: 8 x 4 ticks; 32-tick loop',own('run',8),True),
 ('Shoot: 6 x 2 ticks; first pose is the input-step shot',own('shoot',6),True),
 ('Idle: 120,7,53 tick entries / jump: velocity-selected / hurt and down: held',own('idle',2)+own('jump',2)+own('hurt',1)+own('down',1),True)])
sheet('02-run-comparison.png','Locomotion: pose construction before frame count',[
 ('Our dragon: complete 8-pose walk at 4 ticks each',own('run',8),True),
 ('Cuphead: complete run, 0001-0016; exposure unknown',seq['run'],False),
 ('Deadly Daisy: complete run, 0001-0016; exposure unknown',seq['daisy run'],False)])
sheet('03-idle-reaction.png','Idle and reactions: weight without changing identity',[
 ('Our idle, hurt, down drawings',own('idle',2)+own('hurt',1)+own('down',1),True),
 ('Cuphead idle 0001-0005; exposure unknown',seq['idle'],False),
 ('Cuphead ground hit 0001-0006; exposure unknown',seq['hit'],False),
 ('Cuphead air hit 0001-0006; exposure unknown',seq['air hit'],False)])
sheet('04-air-and-fall.png','Air states: pose must agree with the action',[
 ('Our two air drawings (rise / VY >= 0); no landing drawing',own('jump',2),True),
 ('Cuphead jump 0001-0008: inspect rolling silhouette; routing unknown',seq['jump'],False),
 ('Acorn DROP 0001-0003',seq['acorn drop'],False),
 ('Acorn FALL 0004-0017: numbering continues across folders',seq['acorn fall'],False)])
sheet('05-landing-study.png','Jump and landing: distinct compression and recovery',[
 ('Deadly Daisy Jump A: all 8 drawings; phase names inferred from drawings',seq['daisy takeoff'],False),
 ('Deadly Daisy Jump B: all 21 drawings; phase names inferred from drawings',seq['daisy jump'],False),
 ('Deadly Daisy Land: all 11 drawings; duration and trigger unknown',seq['daisy land'],False)])
sheet('06-shoot-and-transitions.png','Attacks: readable aim while locomotion continues',[
 ('Our 6 shot drawings; overrides the entire walk or air pose',own('shoot',6),True),
 ('Cuphead straight shot 0001-0003; exposure unknown',seq['shoot'],False),
 ('Cuphead straight shot BOIL 0001-0003: distinct files, routing unknown',seq['shoot boil'],False),
 ('Cuphead RUN SHOOT 0001-0016; exposure unknown',seq['run shoot'],False),
 ('Cuphead run turnaround 0001-0002; 560px source canvas, pivot unknown',seq['turn'],False)])
sheet('07-enemies-current.png','Current enemy locomotion drawings',[
 (f'{kind}: {ticks} ticks per pose',own('walk',8,kind='enemy/'+kind),True) for kind,ticks in [('zenchan',4),('mighta',4),('monsta',3),('pulpul',2),('invader',5)]
]+[('Hopper original keys; continuous coil stretch is a runtime rig',own('walk',2,'enemy/banebou'),True)])
sheet('08-flight-study.png','Flight: separate wing speed from body weight',[
 ('Our bat: all 8 poses',own('walk',8,'enemy/monsta'),True),
 ('Our bee: all 8 poses',own('walk',8,'enemy/pulpul'),True),
 ('Cuphead dragonfly idle: all 11 files, not listed as a sequence in the index',seq['dragonfly idle'],False),
 ('Cuphead acorn fly: all 11 files; exposure unknown',seq['acorn fly'],False)])
sheet('09-enemy-attack-study.png','Enemy attack: intent, strike, and recovery',[
 ('Dragonfly warning / Idle to Attack: 0001-0007',seq['dragonfly warning'],False),
 ('Dragonfly attack: 0001-0005',seq['dragonfly attack'],False),
 ('Dragonfly Attack To Idle: 0001-0003',seq['dragonfly recover'],False),
 ('Our boxer: walk, shot, captured, warning, escape, dead',own('walk',1,'enemy/mighta')+sum([own(s,1,'enemy/mighta') for s in ['shoot','captured','warning','escape','dead']],[]),True)])
sheet('10-held-poses-and-boss.png','Held poses: enemies and boss',[(f'{kind}: captured, warning, escape, dead, shot, legacy angry',sum([own(state,1,'enemy/'+kind) for state in ['captured','warning','escape','dead','shoot','angry']],[]),True) for kind in ['zenchan','monsta','mighta','pulpul','banebou','invader']]+[('Boss: 2 moving keys, held attack, held capture',own('move',2,'boss')+own('attack',1,'boss')+own('captured',1,'boss'),True)])
(OUT/'reference-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')

# Compact true side-by-side overview; complete numeric order is in sheet 02.
canvas=Image.new('RGB',(1248,534),'#e9e3d4');d=ImageDraw.Draw(canvas)
d.text((18,10),'Motion study: contact and spacing before more frames',font=title,fill='#1b2c33')
d.text((18,44),'Our current dragon: all 8 walk drawings',font=font,fill='#1b2c33')
d.text((642,44),'Cuphead run: 8 selected drawings from 16',font=font,fill='#1b2c33')
for side,files,full,authored in [(0,own('run',8),own('run',8),True),(1,seq['run'][::2],seq['run'],False)]:
 ims=[Image.open(p).convert('RGBA') for p in full];bs=[im.getchannel('A').getbbox() for im in ims]
 union=(0,0,128,128) if authored else (min(b[0] for b in bs),min(b[1] for b in bs),max(b[2] for b in bs),max(b[3] for b in bs))
 scale=min(140/(union[2]-union[0]),140/(union[3]-union[1]))
 for i,p in enumerate(files):
  x=side*624+i%4*156;y=78+i//4*188
  im=Image.open(p).convert('RGBA').crop(union);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
  at=(x+(156-im.width)//2,y+4+(140-im.height)//2);canvas.paste(im,at,im)
  d.text((x+8,y+153),p.stem,font=small,fill='#20343b')
d.text((18,465),'Left: known 4-tick exposures. Right: original exposures and runtime phase routing are unknown.',font=font,fill='#34484f')
d.text((18,490),'Rows are not phase matched. Display zoom differs per character; preserve our model and proportions.',font=small,fill='#34484f')
canvas.save(OUT/'comparison-overview.png')


sheet("11-dragon-identities.png","Identity checks: shared motion and accessory registration",[(f"{skin}: idle, two walk keys, release, next shot, recovery, rise, hurt",[ROOT/f"assets/cartoon/frames/dragon/{skin}/{pose}.png" for pose in ["idle-0","run-0","run-3","shoot-0","shoot-1","shoot-5","jump-0","hurt-0"]],True) for skin in ["green","blue","red","yellow","purple","orange","cyan","pink","ivory","slate"]])

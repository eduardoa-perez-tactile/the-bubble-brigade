"""Export art previews from the same clip exposures as the game (no gameplay)."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'art/dragon-animation'
CLIPS=json.loads((ROOT/'assets/cartoon/animation.json').read_text())['clips']

def pose(clip,tick):
    data=CLIPS[clip];tick%=sum(data['durations'])
    for name,duration in zip(data['frames'],data['durations']):
        if tick<duration:return name
        tick-=duration
    raise ValueError('No animation exposure')

def draw(name,size=256):
    return Image.open(ROOT/f'assets/cartoon/frames/dragon/green/{name}.png').convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)

def save(path,frames):
    frames[0].save(path,save_all=True,append_images=frames[1:],duration=([20,10,20]*math.ceil(len(frames)/3))[:len(frames)],loop=0,disposal=2)

motion=[];comparison=[]
length=math.lcm(sum(CLIPS['run']['durations']),24)
for tick in range(length):
    canvas=Image.new('RGB',(512,300),'#f1dfb7');ink=ImageDraw.Draw(canvas)
    ink.text((80,12),'WALK - 8 FRAMES',fill='#26363c');ink.text((330,12),'SHOOT - 6 FRAMES',fill='#26363c')
    for index,name in enumerate([pose('run',tick),pose('shoot',tick%24) if tick%24<12 else 'idle-0']):
        sprite=draw(name);canvas.paste(sprite,(index*256,35),sprite)
    motion.append(canvas)
    canvas=Image.new('RGB',(512,300),'#f1dfb7');ink=ImageDraw.Draw(canvas)
    ink.text((80,12),'PREVIOUS PACE',fill='#26363c');ink.text((330,12),'SLOWER WALK',fill='#26363c')
    sprite=draw(f'run-{tick//3%8}')
    squash=math.sin(tick*math.pi/6)*.025
    w=round(256*(1+squash));h=round(256*(1-squash));sprite=sprite.resize((w,h),Image.Resampling.LANCZOS)
    canvas.paste(sprite,(128-w//2,round(275-h*120/128)),sprite)
    sprite=draw(pose('run',tick));canvas.paste(sprite,(256,35),sprite)
    comparison.append(canvas)
save(ART/'motion-preview.gif',motion)
save(ART/'walk-pacing-preview.gif',comparison)
print(f'Wrote {length}-tick motion and walk comparison previews.')

"""Mechanical preview of runtime clips and the three-part native spring rig."""
from pathlib import Path
from PIL import Image, ImageDraw
import json,math
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'art/enemy-animation'
CLIPS=json.loads((ROOT/'assets/cartoon/animation.json').read_text())['enemies']
frames=[]
# 480 is a common multiple of the 16, 24, 32 and 40 tick clips.
for tick in range(480):
    canvas=Image.new('RGB',(768,304),'#e8ddc8');ink=ImageDraw.Draw(canvas)
    for index,(kind,clip) in enumerate(CLIPS.items()):
        x=index%3*256;y=index//3*152
        ink.text((x+12,y+8),kind.upper(),fill='#26363c')
        def load(name):return Image.open(ROOT/f'assets/cartoon/frames/enemy/{kind}/{name}.png').convert('RGBA')
        if kind=='banebou':
            phase=tick%32;pose=phase//16;spring=round(16+4*math.sin(phase*math.pi/16));foot_top=y+128
            for name,top,height in [('body',foot_top-spring-88,88),('spring',foot_top-spring,spring),('feet',foot_top,24)]:
                im=load(f'{name}-{pose}').resize((128,height),Image.Resampling.LANCZOS);canvas.paste(im,(x+64,top),im)
        else:
            im=load(f'walk-{tick//clip["ticksPerFrame"]%clip["frames"]}');canvas.paste(im,(x+64,y+24),im)
    frames.append(canvas.resize((576,228),Image.Resampling.LANCZOS))
frames[0].save(ROOT/'.cache/enemy-animation-motion.gif',save_all=True,append_images=frames[1:],duration=([20,10,20]*160),loop=0,disposal=2,optimize=True)
print('Wrote all six enemy cycles at runtime exposure timing.')

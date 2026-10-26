"""Small vector-drawn overlays; regenerate with python3 (Pillow), no source plate edits."""
from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[2]/'assets/overworld-shared/ambient'
root.mkdir(parents=True,exist_ok=True)
def make(name, draw):
    im=Image.new('RGBA',(256,256)); draw(ImageDraw.Draw(im))
    im.resize((64,64),Image.Resampling.LANCZOS).save(root/f'{name}.png')
make('steam',lambda d:[d.ellipse(box,fill=(248,244,226,alpha)) for box,alpha in [((20,110,140,230),25),((76,70,218,214),32),((54,16,196,160),28)]])
# Drawn, broken wave strokes and a low rope barrier belong to the harbor's ink vocabulary.
def wave(d):
    for x,y in [(20,118),(96,100),(168,120)]:
        d.arc((x,y,x+68,y+38),190,342,fill=(223,240,224,220),width=7)
        d.arc((x+9,y+13,x+63,y+44),195,320,fill=(197,222,218,100),width=3)
make('wave',wave)
def barrier(d):
    d.line([(25,70),(25,225)],fill=(66,49,37,255),width=15)
    d.line([(231,70),(231,225)],fill=(66,49,37,255),width=15)
    d.ellipse((12,51,39,80),fill=(188,142,83,255));d.ellipse((217,51,244,80),fill=(188,142,83,255))
    d.arc((25,55,231,145),0,180,fill=(228,190,126,255),width=14)
make('rope-barrier',barrier)
# Local light from the restored lighthouse, not a screen-wide post effect.
def lantern():
    im=Image.new('RGBA',(64,64));p=im.load()
    for y in range(64):
        for x in range(64):
            r=((x-31.5)**2+(y-31.5)**2)**.5/32
            p[x,y]=(255,214,122,round(max(0,1-r)**2*175))
    im.save(root/'lantern-light.png')
lantern()
make('lantern-beam',lambda d:d.polygon([(0,124),(244,36),(256,42),(256,214),(244,220),(0,132)],fill=(255,228,162,40)))

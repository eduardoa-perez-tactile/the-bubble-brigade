from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
P=Path(__file__).parent;R=Path('/Users/eduardoleale/workspace/art/cuphead/extracted')
F='/System/Library/Fonts/Helvetica.ttc'; B='/System/Library/Fonts/Supplemental/Georgia Bold.ttf'
def font(n,b=False):return ImageFont.truetype(B if b else F,n)
def text(d,xy,s,n=20,fill='#30271e',b=False):d.text(xy,s,font=font(n,b),fill=fill)
def fit(a,w,h):
 a=a.copy().convert('RGBA');a.thumbnail((w,h));return a
ink='#30271e';paper='#f1e3bf';red='#a6472d'
def panel(kind,w=560,h=315,aperture=None):
 a=Image.new('RGB',(w,h),paper);d=ImageDraw.Draw(a)
 if kind in ['arena','ready','go','death','iris']:
  src=Image.open(P/'evidence/gameplay.png');src=src.resize((w,h));a.paste(src);d=ImageDraw.Draw(a)
  # Illustrative HUD replacement, arena and character art preserved as evidence backdrop.
  d.rectangle((0,0,w,39),fill=paper);text(d,(12,8),'SCORE 0000000',16,b=True);text(d,(w-140,8),'WAVE 01 / 10',16,b=True)
  d.rectangle((0,h-34,w,h),fill=paper)
  for n in range(10):
   x=16+n*(w-32)/10;d.ellipse((x,h-27,x+18,h-9),outline=ink,width=2);text(d,(x+4,h-25),str(n+1),10)
  if kind in ['ready','go','death']:
   label={'ready':'Ready?','go':'BUBBLE UP!','death':'BRIGADE DOWN!'}[kind]
   d.rectangle((65,112,w-65,191),fill=paper);text(d,(88,130),label,34,b=True)
 if kind=='team':
  src=Image.open(P/'evidence/party.png').resize((w,h));a.paste(src);d=ImageDraw.Draw(a)
 if kind in ['card','defeat']:
  d.rectangle((28,18,w-28,h-18),outline=ink,width=3)
  text(d,(w//2-90,30),'THE BUBBLE BRIGADE',15,b=True)
  if kind=='card':
   text(d,(100,88),'COURTYARD CAPER',29,b=True);text(d,(222,136),'WAVE 01',19);text(d,(115,190),'CLEAR THE WAVE. RESCUE YOUR TEAM.',14);text(d,(190,254),'GET READY TO BLOW!',15,b=True)
  else:
   d.ellipse((w//2-34,60,w//2+34,128),outline=ink,width=3)
   dragon=fit(Image.open(P.parent.parent/'assets/cartoon/frames/dragon/green/idle-0.png'),65,65);a.paste(dragon,(w//2-dragon.width//2,60),dragon)
   text(d,(173,137),'BRIGADE DOWN!',23,b=True);text(d,(156,172),'WAVE 07 OF 10 REACHED',15)
   d.line((125,207,w-125,207),fill=ink,width=2);d.ellipse((328,201,340,213),fill=red)
   text(d,(173,226),'> RETRY RUN',20,b=True);text(d,(180,266),'MAIN MENU   /   DETAILS',14)
 if kind=='loading':
  d.rectangle((0,0,w,h),fill='#11100e');d.polygon([(w-70,h-90),(w-35,h-90),(w-62,h-40),(w-35,h-40),(w-70,h-90)],outline=paper,width=3);text(d,(25,h-40),'PREPARING THE COURTYARD',14,paper)
 if aperture is not None:
  mask=Image.new('L',(w,h),255);md=ImageDraw.Draw(mask);rx=w*aperture;ry=rx;md.ellipse((w/2-rx,h/2-ry,w/2+rx,h/2+ry),fill=0);a.paste('#11100e',(0,0,w,h),mask)
 return a
frames=[('01  Launch accepted','L = 0.00 s / all actions locked','team',None),('02  Iris closes','L = 0.15 s / aperture intermediate','team',.26),('03  Covered loading','L >= 0.30 s / readiness determines hold','loading',None),('04  Arrival title card','Assets ready / 0.90 s hold (first entry)','card',None),('05  Arena iris opens','P = 0.20 s / step 12 / practice Fire live','iris',.25),('06  Anticipation','P = 0.40 s / Ready? / movement+jump held','ready',None),('07  Action cue','P = 2.70 s / BUBBLE UP! / practice Fire live','go',None),('08  Gameplay settled','P = 3.00 s / step 180 / move+jump return','arena',None),('09  Terminal defeat','D = 0.00-0.60 s / gameplay ended','death',None),('10  Defeat card settled','D = 0.80 s / neutral then new press','defeat',None),('11  Retry committed','R = 0.15 s / iris intermediate / locked','defeat',.25),('12  Retry re-entry','Reset run / same prepare clock P / GO','go',None)]
out=Image.new('RGB',(1800,4*440+80),'#e6ddcb');d=ImageDraw.Draw(out);text(d,(24,16),'PROPOSED STORYBOARD / all timings are starting estimates / schematic, not production art',25,b=True)
for i,(title,caption,kind,ap) in enumerate(frames):
 x=20+i%3*600;y=70+i//3*440;a=panel(kind,aperture=ap);out.paste(a,(x,y+35));text(d,(x,y),title,21,b=True);text(d,(x,y+363),caption,16);text(d,(x,y+391),'L launch / P preparation / D defeat / R retry',14)
out.save(P/'transition-storyboard.jpg')
# three-column annotated comparisons; local art is evidence, schematic is proposal.
refs=[next(R.rglob('title_card_background.png')),next(R.rglob('death_card_bg.png')),next(R.rglob('irisA_0008.png'))]
rows=[('Level arrival','hud-ready','card',refs[0],'Current: small countdown alongside other HUD text.','Reference: centered title-card frame; layered type.','Proposal: dedicated title hold, then arena reveal.'),('Defeat / next action','defeat','defeat',refs[1],'Current: podium and rankings dominate defeat.','Reference: tall framed card; distinct portrait field.','Proposal: portrait + progress + RETRY RUN first.'),('Scene continuity','menu','iris',refs[2],'Current: Instant screen switch (doc evidence).','Reference: opaque field + circular aperture.','Proposal: covered swap; input gate spans reveal.')]
im=Image.new('RGB',(1800,3*450+80),'#e6ddcb');dd=ImageDraw.Draw(im);text(dd,(20,15),'CURRENT ENGINE VIEW  |  CUPHEAD LOCAL ART EVIDENCE  |  PROPOSED STRUCTURE',24,b=True)
for i,(title,cur,kind,ref,c1,c2,c3) in enumerate(rows):
 y=80+i*450; text(dd,(20,y),title,23,b=True)
 for j in range(3):
  x=20+600*j; base=Image.new('RGB',(560,315),'#99968e')
  if j==0:src=fit(Image.open(P/'evidence'/f'{cur}.png'),560,315);base.paste(src,((560-src.width)//2,(315-src.height)//2),src)
  elif j==1:src=fit(Image.open(ref),530,290);base.paste(src,((560-src.width)//2,(315-src.height)//2),src)
  else:base=panel(kind,aperture=.30 if kind=='iris' else None)
  im.paste(base,(x,y+40));text(dd,(x,y+368),[c1,c2,c3][j],16)
im.save(P/'annotated-comparisons.jpg');(P/'visual-source-paths.json').write_text(json.dumps({'comparison_reference_files':[str(x) for x in refs],'gameplay_backdrop':'evidence/gameplay.png','notice':'Proposal panels are schematic. No Cuphead art is proposed for shipping.'},indent=2))

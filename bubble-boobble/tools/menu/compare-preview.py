"""Same-resolution comparison evidence, not a perceptual percentage certificate."""
from PIL import Image,ImageChops,ImageStat,ImageDraw,ImageEnhance
from pathlib import Path
import json,math,argparse
p=argparse.ArgumentParser();p.add_argument('--candidate',required=True);p.add_argument('--label',required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[2];out=root/'docs/menu-revamp-2026-10-26/comparison';out.mkdir(exist_ok=True)
ref=Image.open(root/'docs/menu-revamp-2026-10-26/approved-preview.png').convert('RGB');candidate=Image.open(a.candidate).convert('RGB').resize(ref.size,Image.Resampling.LANCZOS)
difference=ImageChops.difference(ref,candidate);st=ImageStat.Stat(difference)
# Explicit non-overlapping 8x8 grayscale SSIM blocks, at half resolution.
# This is a structural diagnostic with a stated method, not 99% visual identity.
w,h=ref.size;size=(w//2,h//2);r=ref.resize(size,Image.Resampling.LANCZOS).convert('L');c=candidate.resize(size,Image.Resampling.LANCZOS).convert('L');scores=[]
for y in range(0,size[1]-7,8):
 for x in range(0,size[0]-7,8):
  u=list(r.crop((x,y,x+8,y+8)).getdata());v=list(c.crop((x,y,x+8,y+8)).getdata());mu=sum(u)/64;mv=sum(v)/64;vu=sum((k-mu)**2 for k in u)/64;vv=sum((k-mv)**2 for k in v)/64;cov=sum((k-mu)*(l-mv) for k,l in zip(u,v))/64
  scores.append(((2*mu*mv+6.5025)*(2*cov+58.5225))/((mu*mu+mv*mv+6.5025)*(vu+vv+58.5225)))
regions={'logo':[275,115,725,395],'actions_and_pointer':[215,390,865,665],'hero':[875,400,1245,785],'footer':[30,855,1635,918]}
metrics={'label':a.label,'referenceSize':list(ref.size),'candidateOriginalSize':list(Image.open(a.candidate).size),'comparison':'Candidate resized to reference with Lanczos; fixed initial animation phase; no image alignment or color correction.','meanAbsoluteRGBError_0_to_255':round(sum(st.mean)/3,4),'rootMeanSquareRGBError_0_to_255':round(math.sqrt(sum(v*v for v in st.rms)/3),4),'grayscaleBlockSSIM_0_to_1':round(sum(scores)/len(scores),6),'regions':{name:{'referenceBox':box,'meanAbsoluteRGBError_0_to_255':round(sum(ImageStat.Stat(difference.crop(box)).mean)/3,4)} for name,box in regions.items()},'interpretation':'These metrics measure pixel/structural differences. They do not certify a percentage of artistic similarity. Different generated brushwork, glyph contours and animation layers prevent a claim of pixel identity.'}
(out/(a.label+'-metrics.json')).write_text(json.dumps(metrics,indent=2)+'\n')
canvas=Image.new('RGB',(1672,505),'#101b22');draw=ImageDraw.Draw(canvas)
for x,title,im in [(0,'APPROVED MOCKUP',ref),(836,a.label.upper()+' · ENGINE CAPTURE',candidate)]:
 draw.text((x+12,8),title,fill='white');im=im.resize((836,470),Image.Resampling.LANCZOS);canvas.paste(im,(x,30))
canvas.save(out/(a.label+'-comparison.jpg'),quality=92)
ImageEnhance.Contrast(difference).enhance(2).save(out/(a.label+'-difference.png'))
print(json.dumps({k:v for k,v in metrics.items() if k in ['label','meanAbsoluteRGBError_0_to_255','grayscaleBlockSSIM_0_to_1']}))

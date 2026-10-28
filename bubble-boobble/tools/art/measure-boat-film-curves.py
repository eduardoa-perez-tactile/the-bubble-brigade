"""Measure reference/generated double-white-outline geometry; never edits images."""
from pathlib import Path
import json,cv2,numpy as np
root=Path(__file__).resolve().parents[2]/'docs/story-room-boundaries/art-boat-reference'
def path(image,side,generated=False):
 image=cv2.resize(image,(320,900),interpolation=cv2.INTER_AREA)
 rgb=image[:,:,:3][:,:,::-1].astype(np.float32)
 white=(rgb[:,:,0]>185)&(rgb[:,:,1]>235)&(rgb[:,:,2]>232)
 if generated:white&=image[:,:,3]>96
 rows=[]
 for y in range(900):
  mask=white[y];runs=[];start=None
  for x in range(320):
   if mask[x] and start is None:start=x
   if (not mask[x] or x==319) and start is not None:
    end=x if not mask[x] else x+1
    if end-start>=1:runs.append((start+end-1)/2)
    start=None
  pairs=[(a,b)for i,a in enumerate(runs)for b in runs[i+1:]if 5<=b-a<=30]
  if not generated:
   lo,hi=(35,180)if side=='left'else(130,300)
   pairs=[(a,b)for a,b in pairs if lo<a<b<hi]
  if pairs:
   a,b=min(pairs,key=lambda p:p[0]) if side=='left' else max(pairs,key=lambda p:p[1])
   rows.append((y,(a+b)/2,b-a))
  else:rows.append((y,None,None))
 # Beam is continuously visible from top through the first brass-cap interruption.
 end=0;missing=0
 for y,center,sep in rows:
  if center is None:missing+=1
  else:missing=0;end=y
  if y>650 and missing>=12:break
 end=min(end,810 if generated else 740)
 valid=[r for r in rows[:end+1] if r[1] is not None]
 ys=np.arange(end+1,dtype=float)
 centers=np.interp(ys,[r[0] for r in valid],[r[1] for r in valid]);seps=np.interp(ys,[r[0] for r in valid],[r[2] for r in valid])
 centers=cv2.GaussianBlur(centers.reshape(-1,1),(1,9),1.4).reshape(-1);seps=cv2.GaussianBlur(seps.reshape(-1,1),(1,9),1.4).reshape(-1)
 # Robust smooth measured curves: suppress occasional rainbow-glint false peaks.
 rawCenters=centers.copy();rawSeps=seps.copy()
 def robustPolynomial(values,degree):
  axis=np.linspace(-1,1,len(values));active=np.ones(len(values),dtype=bool)
  for iteration in range(7):
   coefficients=np.polyfit(axis[active],values[active],degree)
   fitted=np.polyval(coefficients,axis);residual=np.abs(values-fitted)
   mad=np.median(residual[active]);active=residual<max(2.0,3.5*mad)
  return fitted,active
 centers,active=robustPolynomial(centers,4)
 seps,sepActive=robustPolynomial(seps,2)
 seps=np.clip(seps,14,23)
 return {'lastContinuousRow':int(end),'centers':centers.tolist(),'separations':seps.tolist(),'validRows':len(valid),'fitCenterP95SourcePixels':float(np.percentile(np.abs(rawCenters-centers)[active],95)),'rawCenters':rawCenters.tolist(),'rawSeparations':rawSeps.tolist(),'curveSmoothing':'robust quartic center / quadratic spacing; glint false-peak rejection'}
report=[]
for side in ['left','right']:
 original=cv2.imread(str(root/(side+'-input.png')),cv2.IMREAD_UNCHANGED)
 generated=cv2.imread(str(root/(side+'-generated.png')),cv2.IMREAD_UNCHANGED)
 s=path(original,side);g=path(generated,side,True)
 r={'side':side,'inputX':160 if side=='left' else 1192,'source':s,'generatedNormalized':g,'normalizedCanvas':[320,900],'method':'row-wise exact original double-outline center/spacing; generated effect remapped without source RGB scenery'}
 report.append(r);print(side,'sourceEnd',s['lastContinuousRow'],'genEnd',g['lastContinuousRow'],'samples',[(y,round(s['centers'][y],2),round(s['separations'][y],2))for y in [0,200,400,600,min(s['lastContinuousRow'],720)]])
(root/'film-curves.json').write_text(json.dumps(report,indent=2)+'\n')

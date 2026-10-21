#!/usr/bin/env python3
"""Deterministic rectangular extraction of the generated platform kit; no resampling/redraw."""
from pathlib import Path
from collections import deque
import hashlib,json,uuid
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'docs/concept-reconstruction/sources/platform-kit-sheet.png'
DEST=ROOT/'assets/cartoon/reconstruction/environment'
# Half-open source rectangles. Cap crops deliberately stop at the cream face's ink edge.
CROPS={
 'cap-middle':(49,88,1725,181),
 'cap-left':(49,288,445,381),
 'cap-right':(1328,288,1723,381),
 'underside':(55,489,1719,588),
 'corbel-left':(191,610,465,830),
 'corbel-right':(1308,609,1582,830),
 'edge-join':(822,626,951,818),
 'cap-repeat':(893,88,1149,181),
 'cap-end-left':(49,288,145,381),
 'cap-end-right':(1627,288,1723,381),
}
def components(alpha,threshold=8):
 w,h=alpha.size;raw=bytearray(v>threshold for v in alpha.getdata());out=[]
 for first in range(w*h):
  if not raw[first]:continue
  raw[first]=0;q=deque([first]);left=right=first%w;top=bottom=first//w;count=0
  while q:
   at=q.popleft();x,y=at%w,at//w;count+=1
   left=min(left,x);right=max(right,x);top=min(top,y);bottom=max(bottom,y)
   for n in ([at-1] if x else [])+([at+1] if x+1<w else [])+([at-w] if y else [])+([at+w] if y+1<h else []):
    if raw[n]:raw[n]=0;q.append(n)
  if count>=16:out.append({'box':[left,top,right+1,bottom+1],'pixels':count})
 return sorted(out,key=lambda x:x['pixels'],reverse=True)
DEST.mkdir(parents=True,exist_ok=True)
records=[]
with Image.open(SOURCE) as master:
 if master.mode!='RGBA' or master.size!=(1774,887):raise ValueError('Unexpected master mode/size')
 for key,box in CROPS.items():
  target=DEST/('platform-'+key+'.png');crop=master.crop(box)
  if not target.exists():crop.save(target)
  with Image.open(target) as check:
   assert check.mode=='RGBA' and check.tobytes()==crop.tobytes(),target
  alpha=crop.getchannel('A');visible=alpha.point(lambda a:255 if a>8 else 0).getbbox()
  item={'key':key,'file':str(target.relative_to(ROOT)),'sourceBox':box,'size':crop.size,'alphaBounds':alpha.getbbox(),'alphaAbove8Bounds':visible,'alphaExtrema':alpha.getextrema(),'componentsAbove8':components(alpha),'rgbaPixelSHA256':hashlib.sha256(crop.tobytes()).hexdigest(),'operation':'exact RGBA crop; no redraw, resize, alpha-keying or pixel alteration'}
  records.append(item)
  # New imports only; original assets and existing sidecars remain untouched.
  meta=target.with_suffix('.png.gmeta')
  if not meta.exists():
   guid=uuid.uuid5(uuid.NAMESPACE_URL,'bubble-brigade:reconstruction-platform:'+key)
   meta.write_text(f'guid = "{guid}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon-reconstruction-environment"\nfilter = "linear"\ncompression = "none"\ntrim = false\n')
report={'source':str(SOURCE.relative_to(ROOT)),'sourceFileSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceSize':[1774,887],'sourceMode':'RGBA','generator':'built-in image_gen; generated master supplied by root','prompt':'docs/concept-reconstruction/sources/platform-kit-prompt.md','segmentation':'Alpha>8, four-neighbor components with at least16pixels, reported only; alpha is never modified. Separate authored sheet regions prevent stray low-alpha pixels from joining assets.','coordinateConvention':'Half-open left,top,right,bottom source boxes; bounds are local to the cropped asset.','assets':records}
(ROOT/'docs/concept-reconstruction/platform-kit-extraction.json').write_text(json.dumps(report,indent=2)+'\n')
for row in records:print(row['key'],row['size'],'alpha',row['alphaBounds'],'solid',row['alphaAbove8Bounds'])

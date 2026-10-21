#!/usr/bin/env python3
"""Extract geometry from a native canonical query without modifying any pixels."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
query=json.loads((root/'docs/concept-reconstruction/canonical-native-query.json').read_text())
assert query['size']==[1536,864], 'Canonical anchors require actual 1536×864 pixels'
parts=[]
for entity in query['sprites']:
 c=entity['components'];sprite=c['Sprite']
 if not sprite.get('visible') or not sprite['image'].startswith('cartoon/reconstruction/environment/platform-cap-'):continue
 x,y,_=c['VisualOffset']['position'];w,h=sprite['size']
 parts.append({'x':(x-w/2+256)*1.2,'y':(720-y-h/2)*1.2,'width':w*1.2,'height':h*1.2})
tops=sorted(set(round(p['y'],2) for p in parts));assert len(tops)==5
tiers=[]
for name,top in zip(['crown','upper','middle','lower','floor'],tops):
 spans=[]
 for part in sorted((p for p in parts if abs(p['y']-top)<.02),key=lambda p:p['x']):
  left,right=part['x'],part['x']+part['width']
  if spans and left<=spans[-1][1]+.02:spans[-1][1]=max(spans[-1][1],right)
  else:spans.append([left,right])
 tiers.append({'id':name,'topY':top,'spansX':spans})
report={'method':'Native Sprite/VisualOffset query at actual 1536×864; fixed WorldView center (384, 360) and ortho size 360 with Contain gives 1.2 physical pixels per logical unit and viewport left -256. Full cap quad bounds, not inferred collision edges.','capture':'docs/concept-reconstruction/canonical-reference.png','tiers':tiers}
for key,id in [('footer','footer-paper'),('score','score-card'),('wave','wave-plaque')]:
 d=next(n['drawn'] for n in query['ui']['nodes'] if n.get('id')=='cartoon-hud.'+id)
 report[key]={'x':d['x'],'y':d['y'],'width':d['w'],'height':d['h']}
(root/'docs/concept-reconstruction/canonical-anchors.json').write_text(json.dumps(report,indent=2)+'\n')

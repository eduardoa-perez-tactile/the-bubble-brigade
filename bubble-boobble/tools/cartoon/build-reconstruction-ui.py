#!/usr/bin/env python3
"""Extract original generated UI sprites and exact head crops. No character redraw."""
from pathlib import Path
import json,uuid
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'assets/cartoon/reconstruction/ui'
SOURCE=ROOT/'docs/concept-reconstruction/sources/ui-assets-sheet.png'
BOXES={'score-parchment':(164,178,1378,326),'wave-scroll':(363,423,1172,588),'footer-left':(0,750,335,934),'footer-right':(1202,750,1536,934),'footer-center':(334,750,1203,934),'footer-parchment':(350,768,1185,899)}
records=[]
def save(image,key,source,box):
 target=DEST/(key+'.png');target.parent.mkdir(parents=True,exist_ok=True);image.crop(box).save(target)
 meta=target.with_suffix('.png.gmeta')
 if not meta.exists():
  guid=uuid.uuid5(uuid.NAMESPACE_URL,'bubble-brigade:reconstruction-ui:'+key)
  meta.write_text(f'guid = "{guid}"\nimporter = "texture"\n\n[settings]\nkind = "sprite"\natlas = "cartoon-reconstruction-ui"\nfilter = "linear"\ncompression = "none"\ntrim = false\n')
 records.append({'target':str(target.relative_to(ROOT)),'source':str(source.relative_to(ROOT)),'crop':list(box),'operation':'exact pixel crop, no redraw or resampling'})
with Image.open(SOURCE) as sheet:
 for key,box in BOXES.items():save(sheet,key,SOURCE,box)
for skin in ['green','blue','red','yellow','purple','orange','cyan','pink','ivory','slate']:
 source=ROOT/'assets/cartoon/ui/portraits'/(skin+'.png')
 with Image.open(source) as portrait:save(portrait,'portraits/'+skin,source,(0,0,80,64))
(ROOT/'docs/concept-reconstruction/ui-asset-provenance.json').write_text(json.dumps({'generator':'built-in image_gen for original UI sheet; exact existing portrait crops','reference':'docs/art-reskin-investigation/concept-ten-player-arena.png','assets':records},indent=2)+'\n')

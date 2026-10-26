"""Slice and register the generated four-frame cloth sheet at its rope attachment.
This only packs the original pixels; pivots are measured from alpha at the top edge.
"""
from pathlib import Path
from PIL import Image
import uuid
root=Path(__file__).resolve().parents[2]
im=Image.open(root/'tools/overworld/original-sources/revamp/pennants.png').convert('RGBA')
out=root/'assets/overworld-shared/cloth';out.mkdir(exist_ok=True)
for i in range(4):
 cell=im.crop((i*im.width//4,0,(i+1)*im.width//4,im.height))
 alpha=cell.getchannel('A');pixels=alpha.load()
 xs=[x for y in range(20) for x in range(cell.width) if pixels[x,y]>80]
 pivot=sorted(xs)[len(xs)//2] if xs else cell.width//2
 scaled=cell.resize((round(cell.width*.15),round(cell.height*.15)),Image.Resampling.LANCZOS)
 frame=Image.new('RGBA',(128,128));frame.alpha_composite(scaled,(32-round(pivot*.15),0))
 path=out/f'pennant-{i}.png';frame.save(path)
 meta=Path(str(path)+'.gmeta')
 if not meta.exists():meta.write_text(f'guid = "{uuid.uuid4()}"\nimporter = "texture"\n[settings]\nkind = "sprite"\natlas = "overworld-shared"\ncompression = "astc6x6"\ntrim = false\nmax_size = 128\n[settings.overrides.phone-low]\nmax_size = 64\n')

#!/usr/bin/env python3
"""Assemble captured engine frames for human review; never edits source game art."""
import argparse
import base64
import html
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path, default=Path('.gameengine/captures/story-foreground-all-levels/report.json'))
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    report_path = args.report if args.report.is_absolute() else root / args.report
    report = json.loads(report_path.read_text())
    captures = sorted((c for c in report['captures'] if c['name'] == 'native'), key=lambda c: c['number'])
    if [c['number'] for c in captures] != list(range(1, 26)):
        raise ValueError('Gallery requires exactly one native engine capture for every level 1–25')
    out = report_path.parent / 'gallery'
    out.mkdir(parents=True, exist_ok=True)
    font_paths = ['/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
    font = next((ImageFont.truetype(p, 17) for p in font_paths if Path(p).exists()), ImageFont.load_default())
    small = next((ImageFont.truetype(p, 13) for p in font_paths if Path(p).exists()), ImageFont.load_default())
    sheet = Image.new('RGB', (2000, 1320), '#171d23')
    draw = ImageDraw.Draw(sheet)
    gallery = []
    for index, capture in enumerate(captures):
        path = Path(capture['path'])
        path = path if path.is_absolute() else root / path
        with Image.open(path) as image:
            if image.size != (capture['width'], capture['height']):
                raise ValueError(f'Capture size differs from report: {path}')
            frame = image.convert('RGB')
            # Display-only thumbnail/JPEG copies; the original engine PNG remains intact.
            thumb = frame.resize((384, 216), Image.Resampling.LANCZOS)
            x, y = (index % 5) * 400 + 8, (index // 5) * 264 + 8
            sheet.paste(thumb, (x, y))
            draw.text((x, y + 222), f"{capture['number']:02d}  {capture.get('title', capture['theme'])}", font=font, fill='#f5e9d0')
            draw.text((x, y + 244), capture['theme'], font=small, fill='#abb8bd')
            encoded = io.BytesIO()
            frame.save(encoded, 'JPEG', quality=92, optimize=True)
            gallery.append({
                'number': capture['number'],
                'title': capture.get('title', capture['theme']),
                'theme': capture['theme'],
                'src': 'data:image/jpeg;base64,' + base64.b64encode(encoded.getvalue()).decode('ascii'),
            })
    sheet.save(out / 'contact-sheet.jpg', quality=94, optimize=True)
    cards = '\n'.join(f'<button class="card" data-index="{i}" aria-label="Open level {c["number"]}: {html.escape(c["title"], quote=True)}"><img src="{c["src"]}" alt="Actual engine capture of level {c["number"]}" loading="lazy"><strong>{c["number"]:02d} · {html.escape(c["title"])}</strong><span>{html.escape(c["theme"])}</span></button>' for i, c in enumerate(gallery))
    document = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Story foreground · all 25 levels</title>
<style>*{box-sizing:border-box}body{margin:0;background:#10171c;color:#f5e9d0;font:16px system-ui,sans-serif}header{padding:24px 28px 14px}h1{font-size:26px;margin:0 0 8px}p{color:#bac8cc;line-height:1.5;margin:0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px;padding:20px 28px 40px}.card{padding:0 0 12px;text-align:left;background:#1b272f;color:inherit;border:1px solid #39444b;border-radius:10px;overflow:hidden;cursor:pointer}.card:hover,.card:focus-visible{outline:2px solid #e7bb72}.card img{width:100%;display:block;aspect-ratio:16/9}.card strong,.card span{display:block;padding:8px 12px 0}.card span{padding-top:3px;font-size:13px;color:#acbec4}dialog{padding:14px;background:#10171c;color:#f5e9d0;border:1px solid #596770;border-radius:12px;width:min(1440px,97vw);max-width:97vw}dialog::backdrop{background:#000d}dialog img{width:100%;display:block}.controls{display:flex;align-items:center;gap:12px;padding-bottom:12px}.controls strong{flex:1}button.nav{border:1px solid #62717a;background:#26343d;color:inherit;border-radius:6px;padding:8px 14px;cursor:pointer}@media(max-width:600px){header{padding:20px}.grid{padding:15px}.controls{gap:6px}.nav{font-size:12px}}</style>
<header><h1>Story foregrounds · 25/25 levels</h1><p>Actual Game Engine captures at 1280 × 720, phone-low assets. Click any level for a larger view. Use ← / → to compare levels and Esc to close.<br>Prepared for your visual approval; this gallery is not a completed per-level visual QA pass.</p></header><main class="grid">CARDS</main>
<dialog><div class="controls"><button class="nav" id="previous" aria-label="Previous level">←</button><strong id="caption"></strong><button class="nav" id="next" aria-label="Next level">→</button><button class="nav" id="close">Close</button></div><img id="full" alt=""></dialog>
<script>const cards=[...document.querySelectorAll('.card')],dialog=document.querySelector('dialog'),full=document.querySelector('#full'),caption=document.querySelector('#caption');let current=0;function show(index){current=(index+cards.length)%cards.length;const card=cards[current];full.src=card.querySelector('img').src;full.alt=card.querySelector('img').alt;caption.textContent=card.querySelector('strong').textContent;if(!dialog.open)dialog.showModal()}cards.forEach((card,i)=>card.addEventListener('click',()=>show(i)));document.querySelector('#previous').onclick=()=>show(current-1);document.querySelector('#next').onclick=()=>show(current+1);document.querySelector('#close').onclick=()=>dialog.close();document.addEventListener('keydown',event=>{if(!dialog.open)return;if(event.key==='ArrowLeft')show(current-1);if(event.key==='ArrowRight')show(current+1)});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});</script></html>'''.replace('CARDS', cards)
    (out / 'index.html').write_text(document)
    print(json.dumps({'levels': len(captures), 'contactSheet': str(out / 'contact-sheet.jpg'), 'gallery': str(out / 'index.html')}))


if __name__ == '__main__':
    main()

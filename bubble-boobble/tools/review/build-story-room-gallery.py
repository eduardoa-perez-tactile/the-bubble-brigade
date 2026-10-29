#!/usr/bin/env python3
"""Build a read-only review gallery from verified Game Engine PNGs. Never edits pixels."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/story-room-rollout'
SLUG = 'story_room_rollout_shows_all_twenty_five_native_rooms_and_affected_family_screen_extremes'
GOLDENS = ROOT / 'tests/goldens' / SLUG
SOURCE = (ROOT / 'src/adventure/episodes.ts').read_text()
HEADS = list(re.finditer(r"\{title:'([^']+)'", SOURCE))
assert len(HEADS) == 25, 'Every story level must appear in the gallery'
DISTRICTS = ['Harbor', 'Garden', 'Fair', 'Springs', 'Foundry']
FAMILIES = ['Lighthouse stone', 'Oak piers', 'Oak piers', 'Copper pipes', 'Bubble film']
EXTREMES = {3, 7, 11, 16, 21}
FINALES = {10, 15, 20, 25}
rooms = []
for i, hit in enumerate(HEADS):
    number = i + 1
    def capture(width=1280, second=False):
        name = f'stage_{number}_{width}' + ('_second_act' if second else '')
        path = GOLDENS / name / 'mobile/metal.png'
        assert path.is_file(), f'Missing reviewed capture: {path.relative_to(ROOT)}'
        return '../../' + path.relative_to(ROOT).as_posix()
    end = HEADS[i+1].start() if i+1 < len(HEADS) else SOURCE.index('\n];', hit.start())
    block = SOURCE[hit.start():end]
    columns = int(re.search(r'columns:(\d+)', block).group(1))
    room = dict(number=number, title=hit.group(1), district=DISTRICTS[i//5], columns=columns,
                family=FAMILIES[i] if i < 5 else ['Garden stone', 'Fair timber/copper', 'Bubble film', 'Copper pipes'][(i-5)//5],
                native=capture(), narrow=capture(344) if number in EXTREMES else None,
                wide=capture(2520) if number in EXTREMES else None,
                second=capture(second=True) if number in FINALES else None)
    rooms.append(room)
OUT.mkdir(parents=True, exist_ok=True)
(OUT/'gallery-index.json').write_text(json.dumps({'source':'Verified Game Engine mobile/Metal captures', 'nativeCount':25, 'captureCount':39, 'rooms':rooms}, indent=2)+'\n')
md = ['# All 25 story rooms — actual Game Engine captures', '',
      'Native opening captures for every level. [Interactive local gallery](gallery.html). '
      'These are game renders, not generated art mockups. All rooms are compact; approved levels 1, 2, 4, 5 and 6 retain their layouts.', '']
for room in rooms:
    md += [f"## {room['number']:02d} — {room['title']}", '',
           f"{room['district']} · {room['family']} · {room['columns']} columns", '',
           f"![Level {room['number']}: {room['title']} — native opening]({room['native']})", '']
    extras = [f"[Narrow]({room['narrow']})", f"[Ultrawide]({room['wide']})"] if room['narrow'] else []
    if room['second']: extras += [f"[Second act]({room['second']})"]
    if extras: md += [' · '.join(extras), '']
(OUT/'gallery.md').write_text('\n'.join(md))
TEMPLATE = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Bubble Brigade — all 25 rooms</title>
<style>
:root{color-scheme:dark;--bg:#101615;--panel:#1a2421;--fg:#eff6f1;--muted:#b4c5bc;--line:#43564d;--accent:#c9e7d4;--selected:#304d3e}
@media(prefers-color-scheme:light){:root{color-scheme:light;--bg:#f8faf7;--panel:#edf2ec;--fg:#15271d;--muted:#425c4c;--line:#b6c7bb;--accent:#164e32;--selected:#d7e8da}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.45 system-ui,sans-serif}main{max-width:1440px;margin:auto;padding:24px}h1{font-size:24px;margin:0 0 4px}h2{font-size:20px;margin:0}p{margin:4px 0;color:var(--muted)}button,select,a{font:inherit}button,select{min-height:44px;padding:8px 12px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--fg)}button{cursor:pointer}button[aria-pressed=true]{background:var(--selected);border-color:var(--accent)}button:disabled{cursor:default;opacity:.45}a{color:var(--accent)}.controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:16px 0}.controls label{display:flex;gap:8px;align-items:center}#level{max-width:100%}#viewer{scroll-margin-top:12px}.image-area{display:flex;justify-content:center;align-items:center;background:var(--panel);margin:12px 0}#capture{display:block;max-width:100%;width:auto;height:auto;max-height:80vh;object-fit:contain}.view-buttons{display:flex;flex-wrap:wrap;gap:8px}#grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-top:24px}.thumb{padding:0;overflow:hidden;text-align:left;min-height:0}.thumb img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:contain}.thumb span{display:block;padding:9px 10px}.hint{margin-top:8px}footer{margin:28px 0;color:var(--muted)}@media(max-width:600px){main{padding:12px}h1{font-size:21px}.controls label{width:100%;flex-wrap:wrap}#level{width:100%}#grid{grid-template-columns:1fr}}
</style></head><body><main>
<h1>The Bubble Brigade — all 25 story rooms</h1>
<p>Actual Game Engine captures · 25 native openings · 10 screen extremes · 4 second acts</p>
<div class="controls"><button id="previous" type="button">← Previous</button><label>Level <select id="level" aria-label="Select a story level"></select></label><button id="next" type="button">Next →</button></div>
<section id="viewer" aria-label="Selected full room capture"><h2 id="title"></h2><p id="meta"></p>
<div class="view-buttons"><button id="native" type="button">Native opening</button><button id="narrow" type="button">Narrow</button><button id="wide" type="button">Ultrawide</button><button id="second" type="button">Second act</button></div>
<div class="image-area"><img id="capture" alt="" width="1280" height="720"></div>
<p id="selection" aria-live="polite"></p><a id="original" target="_blank" rel="noopener">Open full-resolution PNG</a>
<p class="hint">Use Previous/Next or the arrow keys. Narrow, ultrawide and second-act views are available where captured.</p></section>
<section id="grid" aria-label="All 25 native opening captures"></section>
<footer>Every image is an unchanged engine PNG. Source art previews are excluded. The gallery changes image selection only.</footer>
</main><script>
'use strict';
const rooms=__ROOMS__;
const byId=id=>document.getElementById(id);
const dropdown=byId('level'), grid=byId('grid'), image=byId('capture');
let selected=0, view='native';
const labels={native:'Native opening · 1280 × 720',narrow:'Narrow · 344 × 882',wide:'Ultrawide · 2520 × 1080',second:'Second act · 1280 × 720'};
for(const room of rooms){
 const option=document.createElement('option');option.value=String(room.number-1);option.textContent=String(room.number).padStart(2,'0')+' — '+room.title;dropdown.append(option);
 const button=document.createElement('button');button.type='button';button.className='thumb';button.setAttribute('aria-label','View level '+room.number+': '+room.title);button.dataset.level=String(room.number-1);
 const thumb=document.createElement('img');thumb.src=room.native;thumb.loading='lazy';thumb.width=1280;thumb.height=720;thumb.alt=room.title+' native opening';
 const caption=document.createElement('span');caption.textContent=String(room.number).padStart(2,'0')+' — '+room.title;button.append(thumb,caption);button.addEventListener('click',()=>{choose(room.number-1);byId('viewer').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});grid.append(button);
}
function render(){
 const room=rooms[selected];dropdown.value=String(selected);
 byId('title').textContent=String(room.number).padStart(2,'0')+' — '+room.title;
 byId('meta').textContent=room.district+' · '+room.family+' · '+room.columns+' columns';
 image.src=room[view];image.alt='Level '+room.number+': '+room.title+' — '+labels[view];
 image.width=view==='narrow'?344:view==='wide'?2520:1280;image.height=view==='narrow'?882:view==='wide'?1080:720;
 byId('selection').textContent=labels[view];byId('original').href=room[view];
 for(const name of Object.keys(labels)){const button=byId(name);button.disabled=!room[name];button.setAttribute('aria-pressed',String(name===view));}
 for(const button of grid.querySelectorAll('button'))button.setAttribute('aria-pressed',String(Number(button.dataset.level)===selected));
}
function choose(index){selected=(index+rooms.length)%rooms.length;view='native';render();}
dropdown.addEventListener('change',()=>choose(Number(dropdown.value)));
byId('previous').addEventListener('click',()=>choose(selected-1));byId('next').addEventListener('click',()=>choose(selected+1));
for(const name of Object.keys(labels))byId(name).addEventListener('click',()=>{if(rooms[selected][name]){view=name;render();}});
document.addEventListener('keydown',event=>{if(event.target instanceof HTMLSelectElement)return;if(event.key==='ArrowLeft'){event.preventDefault();choose(selected-1);}if(event.key==='ArrowRight'){event.preventDefault();choose(selected+1);}});
const query=Number(new URLSearchParams(location.search).get('level'));choose(Number.isInteger(query)&&query>=1&&query<=25?query-1:0);
</script></body></html>
'''
# JSON is generated from repository titles, but escape script terminators defensively.
encoded=json.dumps(rooms,ensure_ascii=False).replace('<','\\u003c').replace('>','\\u003e')
(OUT/'gallery.html').write_text(TEMPLATE.replace('__ROOMS__',encoded))
print(f'Built {len(rooms)} native room entries and 39 verified capture links')

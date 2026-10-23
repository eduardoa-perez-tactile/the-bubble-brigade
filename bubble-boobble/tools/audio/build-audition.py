"""Build a portable, offline listening page for the original audio sketches."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/audio-direction-demos'
PALETTES = [
    ('a', 'A · Haunted Cartoon Orchestra', 'Recommended starting direction. Mischievous reeds, plucked strings and a mysterious castle mood.'),
    ('b', 'B · Bubble Swing Brigade', 'A brighter, rhythmic ensemble: bouncing bass, swung phrases and comic energy.'),
    ('c', 'C · Enchanted Toybox', 'A gentler magical direction with bell-like attacks and playful wooden tones.'),
]


def player(path, label):
    return f'<div class="clip"><label>{escape(label)}</label><audio controls preload="none" src="{escape(path.relative_to(OUT).as_posix(), quote=True)}"></audio><a href="{escape(path.relative_to(OUT).as_posix(), quote=True)}" download>Download WAV</a></div>'


def main():
    music = sorted((OUT / 'music').glob('*.wav'))
    reels = sorted((OUT / 'sfx').rglob('*reel*.wav'))
    if len(music) != 3 or len(reels) != 3:
        raise SystemExit(f'Generate music and SFX first; found {len(music)} music demos and {len(reels)} reels')
    cards = []
    for key, title, description in PALETTES:
        tracks = [p for p in music if p.name.lower().startswith(key)]
        sounds = [p for p in reels if p.relative_to(OUT / 'sfx').as_posix().lower().startswith(key)]
        if len(tracks) != 1 or len(sounds) != 1:
            raise SystemExit(f'Expected one music demo and reel for {key}: {tracks}, {sounds}')
        cards.append(f'<section><h2>{title}</h2><p>{description}</p>{player(tracks[0], "Menu composition sketch")}{player(sounds[0], "Six-cue sound palette")}</section>')
    page = '''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Bubble Brigade · Audio directions</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#14262b;color:#f6ebce}body{max-width:1100px;margin:0 auto;padding:32px 20px}h1{font-size:clamp(28px,5vw,46px);margin-bottom:12px}h2{font-size:22px;line-height:1.3}p{line-height:1.6;color:#d4d6cc}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:28px}section{background:#20383d;border:1px solid #647778;border-radius:16px;padding:22px}.clip{margin-top:24px}label{display:block;margin-bottom:10px;font-weight:600}audio{display:block;width:100%;margin-bottom:8px}a{color:#aee1e0;font-size:14px}aside{padding:12px 18px;background:#26363a;border-left:3px solid #e2c48e;margin:24px 0}footer{margin-top:28px}
</style>
<h1>The Bubble Brigade</h1><p>Three original audio directions · first composition and sound-design sketches</p>
<aside><strong>First synthesized sketches.</strong> The <a href="../audio-period-band/index.html">revised cartoon-jazz batch with sampled instruments</a> follows these initial ideas. These original sketches are not final orchestral recordings or production game assets. Game playback is unchanged. The three music arrangements share an original motif; their pace and instrumentation differ.</aside>
<p>Compare the music first, then the effects at a comfortable volume. Each SFX reel plays: <strong>shot → pop → capture → food pickup → player downed → rescue</strong>, with silence between cues. All playback starts on your click. Starting another clip stops the previous one.</p>
<main>CARDS</main>
<footer><p>Listen for: the world you want to inhabit, how tiring the music feels on repetition, and whether capture and rescue read clearly. Timbral realism, phone-speaker translation and gameplay masking still need listening review.</p><a href="../../docs/audio-production/brief.md">Production brief</a> · <a href="README.md">Reproduction and validation</a></footer>
<script>document.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(b=>{if(a!==b)b.pause()})));</script>
</html>
'''.replace('CARDS', '\n'.join(cards))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'index.html').write_text(page)
    print('Built art/audio-direction-demos/index.html')


if __name__ == '__main__':
    main()

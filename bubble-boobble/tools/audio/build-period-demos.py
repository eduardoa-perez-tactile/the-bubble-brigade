"""Render and master the sampled hot-jazz review batch, entirely offline.

Python standard library + installed FluidSynth >=2.3. Run fetch-period-bank.py
once before this script. Raw float renders stay in ignored authoring cache.
"""
from array import array
import hashlib
from html import escape
import json
import math
from pathlib import Path
import struct
import subprocess
import sys
import wave

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/audio-period-band'
CACHE = ROOT / '.cache/audio-production'
BANK_HASH = '9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe'
LICENSE_HASH = '88726e4b018fb66050054b6633a2996335b0f8fd4186251c20d0546fa0ab44fc'
PIN = '684543d5e5efaef08d02be50dcda8d552478fa60'
RATE = 48000


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def master(raw, target):
    data = raw.read_bytes()
    # The repository's renderer emits this fixed IEEE float32 stereo WAV layout.
    assert data[:4] == b'RIFF' and data[8:12] == b'WAVE' and data[36:40] == b'data'
    assert struct.unpack_from('<HHI', data, 20) == (3, 2, RATE)
    assert struct.unpack_from('<I', data, 40)[0] == len(data) - 44
    samples = array('f')
    samples.frombytes(data[44:])
    if sys.byteorder != 'little':
        samples.byteswap()
    count = len(samples) // 2
    assert count > RATE and all(math.isfinite(x) for x in samples)
    hp = math.exp(-2 * math.pi * 55 / RATE)
    lp = 1 - math.exp(-2 * math.pi * 8500 / RATE)
    prev_in, prev_hp, prev_lp = [0., 0.], [0., 0.], [0., 0.]
    # Gentle rumble/treble shaping and a compact stereo image; no fake crackle.
    for i in range(count):
        frame = []
        for c in (0, 1):
            x = samples[2*i+c]
            high = hp * (prev_hp[c] + x - prev_in[c])
            prev_in[c], prev_hp[c] = x, high
            prev_lp[c] += lp * (high - prev_lp[c])
            frame.append(prev_lp[c])
        mid, side = (frame[0]+frame[1])/2, (frame[0]-frame[1])*.325
        fade = min(1, i/(RATE*.012), (count-1-i)/(RATE*.5))
        samples[2*i], samples[2*i+1] = (mid+side)*fade, (mid-side)*fade
    dc = [sum(samples[c::2])/count for c in (0, 1)]
    for i in range(count):
        edge = min(1, i/(RATE*.012), (count-1-i)/(RATE*.5))
        for c in (0, 1):
            samples[2*i+c] -= dc[c] * edge
    rms = math.sqrt(sum(x*x for x in samples)/len(samples))
    peak = max(abs(x) for x in samples)
    assert rms > .0001, 'Silent render'
    gain = min(.1/rms, 10**(-1.5/20)/peak)
    pcm = array('h', (round(x*gain*32767) for x in samples))
    actual_peak = max(abs(x) for x in pcm)/32768
    actual_rms = math.sqrt(sum(x*x for x in pcm)/len(pcm))/32768
    channel_dc = [sum(pcm[c::2])/count/32768 for c in (0, 1)]
    assert actual_peak < .95 and max(map(abs, channel_dc)) < .001
    assert pcm[0] == pcm[1] == pcm[-1] == pcm[-2] == 0
    if sys.byteorder != 'little':
        pcm.byteswap()
    with wave.open(str(target), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm.tobytes())
    return dict(file=target.name, sha256=digest(target), frames=count,
                duration_seconds=round(count/RATE, 6), sample_rate=RATE,
                channels=2, bits_per_sample=16, peak_dbfs=round(20*math.log10(actual_peak), 3),
                rms_dbfs=round(20*math.log10(actual_rms), 3),
                dc_offset_per_channel=channel_dc)


def page(records):
    cards = []
    for record in sorted(records, key=lambda r: 0 if r['file'].startswith('menu') else 1):
        title, filename = escape(record['title']), escape(record['file'])
        cards.append(f'<section><h2>{title}</h2><p>{escape(record["description"])}</p><audio controls preload="none" src="{filename}"></audio><p>{record["bpm"]} BPM · {record["duration_seconds"]:.1f} seconds · <a href="{filename}" download>Download WAV</a></p></section>')
    html = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Bubble Brigade · Cartoon jazz revision</title>
<style>:root{color-scheme:dark;background:#17282b;color:#f5e7c6;font-family:system-ui,sans-serif}body{max-width:900px;margin:auto;padding:32px 20px}h1{font-size:clamp(28px,5vw,44px)}p{line-height:1.6;color:#d6d5c9}section{margin:24px 0;padding:22px;background:#243b3f;border:1px solid #6a7874;border-radius:14px}audio{width:100%}a{color:#b5e2dc}.note{border-left:3px solid #e3c890;padding:10px 18px}</style>
<h1>The Bubble Brigade · Cartoon jazz</h1><p>Revision 2 · original menu and gameplay excerpts with sampled instruments</p>
<p class="note">The target is a playful 1930s–1940s cartoon small band. These are sequenced composition demos using third-party instrument samples, not live performances or final production loops. The melodies and arrangements are original.</p>
CARDS
<p>Listen for reed/brass conversations, breathing space, stride-piano and bass movement, and a lighter swing rhythm. Warm tonal shaping and a compact stereo image replace the first batch's electronic tones; no artificial record crackle is added.</p>
<p><a href="README.md">Notes, credits and reproduction</a> · <a href="../audio-direction-demos/index.html">First synthesized sketches</a> · <a href="../../docs/audio-production/brief.md">Full audio brief</a></p>
<script>document.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(b=>{if(a!==b)b.pause()})));</script></html>'''.replace('CARDS', '\n'.join(cards))
    (OUT / 'index.html').write_text(html)


def main():
    bank = CACHE / 'GeneralUser-GS.sf2'
    assert bank.is_file() and digest(bank) == BANK_HASH, 'Run python3 tools/audio/fetch-period-bank.py first'
    assert digest(OUT / 'LICENSE-GeneralUser-GS.txt') == LICENSE_HASH, 'Upstream license hash mismatch; run fetch-period-bank.py'
    subprocess.run([sys.executable, str(ROOT / 'tools/audio/compose-period-band.py')], check=True, stdout=sys.stderr)
    scores = sorted((OUT / 'scores').glob('*.json'))
    assert len(scores) == 2
    records = []
    for score_path in scores:
        score = json.loads(score_path.read_text())
        raw = CACHE / (score_path.stem + '-raw.wav')
        process = subprocess.run([sys.executable, str(ROOT / 'tools/audio/render-period-band.py'), str(score_path), str(bank), str(raw)], capture_output=True, text=True)
        if process.returncode:
            raise SystemExit(process.stderr or f'Render failed: {score_path.name}')
        render = json.loads(process.stdout)
        render.pop('output', None)
        record = master(raw, OUT / (score_path.stem + '.wav'))
        record.update(title=score['title'], description=score['description'], bpm=score['bpm'],
                      score_file=score_path.relative_to(OUT).as_posix(), score_sha256=digest(score_path), renderer=render)
        records.append(record)
    sources = ['compose-period-band.py', 'render-period-band.py', 'build-period-demos.py', 'fetch-period-bank.py']
    manifest = dict(status='Sampled-instrument composition review; not live recordings or production loops; not integrated',
                    sample_bank=dict(name='GeneralUser GS 2.0.3', author='S. Christian Collins',
                                     source=f'https://github.com/mrbumpy409/GeneralUser-GS/tree/{PIN}',
                                     sha256=BANK_HASH, license='LICENSE-GeneralUser-GS.txt',
                                     license_sha256=digest(OUT / 'LICENSE-GeneralUser-GS.txt'),
                                     license_upstream_sha256='7b32efefdf95ce38a043799f0659853ddc00fbaa14d8c50f0aca16b9b8b405be',
                                     license_normalization='CRLF to LF only; full license text retained.',
                                     provenance='Third-party instrument samples; full upstream license and provenance disclosure retained.'),
                    sources={f'tools/audio/{name}':digest(ROOT/'tools/audio'/name) for name in sources},
                    master='55 Hz high-pass, 8.5 kHz low-pass, stereo side gain .65, quiet edges, -20 dBFS unweighted RMS target with -1.5 dBFS peak ceiling. No perceptual LUFS claim.',
                    demos=records)
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    page(records)
    print(json.dumps(records, indent=2))


if __name__ == '__main__':
    main()

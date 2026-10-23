#!/usr/bin/env python3
"""Build original, deterministic SFX sketches, outside the shipped assets tree.

Python standard library only. No samples, recordings, or original-game material.
Run from the project root: python3 tools/audio/build-sfx-demos.py
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import random
import struct
import wave

RATE = 48_000
SEED = 23102026
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/audio-direction-demos/sfx'
ORDER = ['bubble-shot', 'bubble-pop', 'capture', 'food-pickup', 'player-downed', 'rescue']
PALETTES = {
    'a-haunted-cartoon': {'label': 'A — Haunted Cartoon Orchestra', 'pitch': 0.89, 'material': 'Hollow wooden resonators, breathy air and rubbery bubbles', 'ring': [1, 2.74, 4.12], 'damp': 13},
    'b-bubble-swing': {'label': 'B — Bubble Swing Brigade', 'pitch': 1.0, 'material': 'Muted brass buzz, brushed noise and bouncy plucked bubbles', 'ring': [1, 2, 3.04], 'damp': 18},
    'c-enchanted-toybox': {'label': 'C — Enchanted Toybox', 'pitch': 1.22, 'material': 'Soft glass, felted bells, airy fizz and delicate bubbles', 'ring': [1, 2.76, 5.42], 'damp': 9},
}
DESCRIPTIONS = {
    'bubble-shot': 'Compact upward elastic bubble with a short breath transient; subdued rapid-fire cue.',
    'bubble-pop': 'Fast downward pressure release, wet snap and fizz; distinct from the shot.',
    'capture': 'Double squeeze resolving into a suspended rounded chord; more weight than a pop.',
    'food-pickup': 'Tiny two-note ascending reward with a tactile pluck.',
    'player-downed': 'Descending rubbery tumble with a cushioned noisy thud; no human voice.',
    'rescue': 'Clear three-note ascending flourish with a bright resolving chord.',
}


def blank(seconds):
    return [0.0] * round(seconds * RATE)


def add(dst, src, start=0.0, gain=1.0):
    offset = round(start * RATE)
    for j in range(min(len(src), len(dst) - offset)):
        dst[offset + j] += src[j] * gain


def swept(seconds, first, last, gain, rng, texture=0.0):
    """Exponential pressure glide with harmonics and low-passed turbulent air."""
    out = blank(seconds)
    phase = air = 0.0
    for i in range(len(out)):
        t = i / RATE
        u = t / seconds
        frequency = first * (last / first) ** u
        phase += 2 * math.pi * frequency / RATE
        air += 0.19 * (rng.uniform(-1, 1) - air)
        env = min(1, t / 0.003) * (1 - u) ** 2
        out[i] = gain * env * (math.sin(phase) + 0.17 * math.sin(2 * phase + 0.3) + texture * air)
    return out


def noise(seconds, gain, rng, cutoff=0.25):
    out = blank(seconds)
    low = 0.0
    for i in range(len(out)):
        t = i / RATE
        low += cutoff * (rng.uniform(-1, 1) - low)
        out[i] = gain * low * min(1, t / 0.0015) * math.exp(-t * 9 / seconds) * (1 - t / seconds)
    return out


def ring(seconds, frequency, palette, gain, rng):
    out = blank(seconds)
    phases = [rng.uniform(-0.2, 0.2) for _ in range(3)]
    swing = palette['label'].startswith('B')
    for i in range(len(out)):
        t = i / RATE
        value = 0.0
        for k, ratio in enumerate(palette['ring']):
            value += math.sin(2 * math.pi * frequency * ratio * t + phases[k]) * math.exp(-t * palette['damp'] * (1 + k * .4)) / (1 + k * 2)
        if swing:
            value += .12 * math.sin(2 * math.pi * frequency * 5 * t) * math.exp(-t * 32)
        out[i] = gain * value * min(1, t / 0.003) * min(1, (seconds - t) / .025)
    return out


def synth(cue, palette, rng):
    p = palette['pitch']
    if cue == 'bubble-shot':
        dst = blank(.16)
        add(dst, swept(.13, 240*p, 720*p, .65, rng, .25))
        add(dst, noise(.055, .35, rng, .13))
        add(dst, ring(.11, 520*p, palette, .12, rng), .04)
    elif cue == 'bubble-pop':
        dst = blank(.19)
        add(dst, swept(.075, 850*p, 125*p, .85, rng, .35))
        add(dst, noise(.055, .9, rng, .65), .004)
        add(dst, swept(.075, 330*p, 180*p, .22, rng, .5), .045)
    elif cue == 'capture':
        dst = blank(.48)
        add(dst, swept(.17, 460*p, 190*p, .55, rng, .35))
        add(dst, swept(.15, 260*p, 600*p, .4, rng, .2), .09)
        for f, start, g in [(523.25, .16, .4), (783.99, .19, .25)]:
            add(dst, ring(.28, f*p, palette, g, rng), start)
        add(dst, noise(.10, .3, rng, .12))
    elif cue == 'food-pickup':
        dst = blank(.29)
        add(dst, noise(.025, .25, rng, .3))
        add(dst, ring(.20, 659.25*p, palette, .55, rng))
        add(dst, ring(.20, 987.77*p, palette, .45, rng), .075)
    elif cue == 'player-downed':
        dst = blank(.72)
        add(dst, swept(.36, 440*p, 95*p, .7, rng, .22))
        add(dst, swept(.17, 180*p, 65*p, .4, rng, .4), .28)
        add(dst, noise(.18, .65, rng, .08), .36)
        add(dst, ring(.28, 110*p, palette, .22, rng), .40)
    elif cue == 'rescue':
        dst = blank(.94)
        add(dst, swept(.18, 240*p, 700*p, .23, rng, .5))
        for f, start in [(523.25, .04), (659.25, .19), (783.99, .34)]:
            add(dst, ring(.36, f*p, palette, .45, rng), start)
            add(dst, noise(.045, .13, rng, .2), start)
        for f, g in [(523.25, .13), (783.99, .19), (1046.5, .33)]:
            add(dst, ring(.46, f*p, palette, g, rng), .47)
    return finish(dst, {'bubble-shot': .44, 'bubble-pop': .48, 'capture': .57, 'food-pickup': .4, 'player-downed': .52, 'rescue': .63}[cue])


def finish(samples, target):
    # Symmetric edge taper, then remove DC through a tapered constant so endpoints stay zero.
    edge = min(240, len(samples) // 4)
    window = [min(1.0, i / edge, (len(samples)-1-i) / edge) for i in range(len(samples))]
    samples = [s*w for s, w in zip(samples, window)]
    dc = sum(samples) / sum(window)
    samples = [s-dc*w for s, w in zip(samples, window)]
    peak = max(abs(s) for s in samples)
    return [s*target/peak for s in samples]


def write_wav(path, samples):
    quantized = [round(max(-1, min(1, x))*32767) for x in samples]
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(struct.pack(f'<{len(quantized)}h', *quantized))
    # Verify the emitted PCM rather than only the pre-quantized synthesis.
    with wave.open(str(path), 'rb') as wav:
        assert (wav.getframerate(), wav.getnchannels(), wav.getsampwidth()) == (RATE, 1, 2)
        pcm = struct.unpack(f'<{wav.getnframes()}h', wav.readframes(wav.getnframes()))
    peak = max(abs(x) for x in pcm) / 32768
    rms = math.sqrt(sum((x/32768)**2 for x in pcm) / len(pcm))
    dc = sum(pcm)/len(pcm)/32768
    assert 0.01 < peak < .95, (path, peak)
    assert rms > .001 and abs(dc) < .0001, (path, rms, dc)
    assert pcm[0] == pcm[-1] == 0, path
    return {'file': str(path.relative_to(OUT)), 'sample_rate_hz': RATE, 'channels': 1, 'bits_per_sample': 16,
            'frames': len(pcm), 'duration_seconds': round(len(pcm)/RATE, 5),
            'peak_dbfs': round(20*math.log10(peak), 3), 'rms_dbfs': round(20*math.log10(rms), 3),
            'dc_offset_full_scale': round(dc, 9), 'decoded_pcm_bytes': len(pcm)*2,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {'status': 'original synthesized sketches; awaiting direction selection; not integrated or shipped',
                'generator': 'tools/audio/build-sfx-demos.py', 'seed': SEED,
                'generator_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                'provenance': 'New mathematical oscillators, damped modal resonators and seeded filtered noise. No input samples or recordings. No imitation of original-game material.',
                'reproduce': 'python3 tools/audio/build-sfx-demos.py',
                'cue_order': ORDER, 'loudness': 'Hand-mixed relative peaks for comparison, no LUFS normalization; rapid cues quieter than rescue.',
                'validation': 'Emitted PCM checked: 48 kHz / mono / 16-bit, nonempty, peak below -0.45 dBFS, RMS above -60 dBFS, DC below 0.0001 full-scale, zero endpoints.',
                'palettes': []}
    total = 0
    for key, palette in PALETTES.items():
        directory = OUT / key
        directory.mkdir(exist_ok=True)
        entry = {'id': key, 'label': palette['label'], 'timbre': palette['material'], 'cues': [], 'audition_cue_order': ORDER}
        reel = blank(.45)
        timeline = []
        for cue in ORDER:
            salt = int.from_bytes(hashlib.sha256(f'{key}/{cue}'.encode()).digest()[:8], 'big')
            samples = synth(cue, palette, random.Random(SEED + salt))
            meta = write_wav(directory / f'{cue}.wav', samples)
            meta.update({'cue': cue, 'description': DESCRIPTIONS[cue], 'seed': SEED + salt})
            entry['cues'].append(meta)
            total += meta['decoded_pcm_bytes']
            timeline.append({'cue': cue, 'start_seconds': round(len(reel)/RATE, 5), 'duration_seconds': meta['duration_seconds']})
            reel.extend(samples)
            reel.extend(blank(.65))
        entry['audition_reel'] = write_wav(directory / 'audition-reel.wav', reel)
        entry['audition_timeline'] = timeline
        entry['cue_decoded_pcm_bytes'] = sum(c['decoded_pcm_bytes'] for c in entry['cues'])
        manifest['palettes'].append(entry)
    manifest['all_18_cues_decoded_pcm_bytes'] = total
    manifest['decoded_memory_note'] = '48,000 samples/second × 1 channel × 2 bytes. Reels are review-only duplicates, excluded from this cue total.'
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+'\n')
    print(f'Wrote 18 cues + 3 audition reels. Cue PCM total: {total:,} bytes. All emitted PCM checks passed.')


if __name__ == '__main__':
    main()

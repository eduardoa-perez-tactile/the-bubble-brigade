#!/usr/bin/env python3
"""Render original comparison sketches; Python 3 standard library, no samples.

Run from the project root: python3 tools/audio/build-music-demos.py
These resolving excerpts are direction demos, not seamless production loops.
"""

from array import array
import hashlib
import json
import math
from pathlib import Path
import random
import struct
import wave

RATE = 48000
SEED = 23102026
OUT = Path(__file__).resolve().parents[2] / "art/audio-direction-demos/music"
TAU = math.tau

# Shared eight-bar melody: (beat offset, MIDI pitch, held beats).
# Written for this game; pitches and phrase rhythm remain the same in each demo.
MOTIF = [
    [(0, 74, .7), (1, 77, .4), (1.5, 81, .8), (3, 79, .7)],
    [(0, 77, .8), (1.5, 76, .4), (2, 74, 1.4)],
    [(0, 74, .4), (.5, 77, .4), (1.5, 81, .8), (3, 84, .7)],
    [(0, 82, .8), (1.5, 81, .4), (2, 79, .7), (3, 76, .7)],
    [(0, 77, .7), (1, 79, .4), (1.5, 81, .8), (3, 77, .7)],
    [(0, 79, .8), (1.5, 77, .4), (2, 74, 1.3)],
    [(0, 76, .4), (.5, 73, .4), (1.5, 69, .8), (3, 73, .7)],
    [(0, 74, 2.8)],
]
# D minor, G minor, D minor, A7, Bb major, G minor, A7, D minor.
CHORDS = [(38, [62, 65, 69]), (43, [62, 67, 70]),
          (38, [62, 65, 69]), (45, [61, 64, 67]),
          (46, [62, 65, 70]), (43, [62, 67, 70]),
          (45, [61, 64, 67]), (38, [62, 65, 69])]


def voice(kind, midi, duration, rng):
    """Small additive/FM instrument palette, with click-free note envelopes."""
    n = max(1, int(duration * RATE))
    frequency = 440 * 2 ** ((midi - 69) / 12)
    samples = array("f")
    noise_prev = 0.0
    for i in range(n):
        t = i / RATE
        p = TAU * frequency * t
        release = min(1.0, (n - 1 - i) / (RATE * .045))
        attack = min(1.0, t / (.035 if kind in ("reed", "brass", "bassoon") else .005))
        if kind == "reed":
            p += .013 * math.sin(TAU * 5.0 * t) * min(1, t / .15)
            x = (math.sin(p) + .28 * math.sin(3*p) + .10 * math.sin(5*p)) / 1.38
            env = attack * release * (.82 + .18 * math.exp(-t * 10))
        elif kind == "brass":
            p += .012 * math.sin(TAU * 5.6 * t)
            brightness = .65 + .35 * math.exp(-t * 14)
            x = (math.sin(p) + brightness * (.42*math.sin(2*p) + .22*math.sin(3*p)
                 + .09*math.sin(4*p))) / 1.73
            env = attack * release * (.75 + .25 * math.exp(-t * 8))
        elif kind == "bassoon":
            x = (math.sin(p) + .34*math.sin(2*p) + .19*math.sin(3*p) + .10*math.sin(5*p)) / 1.63
            env = attack * release * math.exp(-t * 1.4)
        elif kind == "bass":
            x = .78*math.sin(p) + .16*math.sin(2*p) + .06*math.sin(3*p)
            env = attack * release * math.exp(-t * 4)
        elif kind == "pluck":
            x = .72*math.sin(p) + .18*math.sin(2*p) + .10*math.sin(3*p)
            env = attack * release * math.exp(-t * 8)
        elif kind in ("bell", "wood"):
            ratio = 2.01 if kind == "bell" else 3.98
            x = .82*math.sin(p + .55*math.exp(-t*9)*math.sin(p*ratio))
            x += .18*math.sin(p*ratio)*math.exp(-t*14)
            env = attack * release * math.exp(-t * (3.2 if kind == "bell" else 7))
        elif kind == "kick":
            x = math.sin(TAU * (48*t + 3*(1-math.exp(-t*35))))
            env = attack * release * math.exp(-t*19)
        else:
            noise = rng.uniform(-1, 1)
            high = (noise - noise_prev) * .5
            noise_prev = noise
            x = high if kind == "brush" else .8*high + .2*math.sin(TAU*175*t)
            env = attack * release * math.exp(-t*(42 if kind == "brush" else 25))
        samples.append(x * env)
    return samples


def render(key, title, bpm, lead, brief):
    rng = random.Random(SEED)
    beat = 60 / bpm
    duration = 64 * beat + 1.8
    count = round(duration * RATE)
    left, right = array("f", [0]) * count, array("f", [0]) * count
    notes = []
    cache = {}

    def add(at, midi, held, kind, gain, pan=0.0):
        # Small reproducible dynamics prevent mechanically identical attacks.
        gain *= rng.uniform(.94, 1.04)
        start = round(at * beat * RATE)
        length = held * beat
        ck = (kind, midi, round(length, 5))
        if ck not in cache:
            cache[ck] = voice(kind, midi, length, rng)
        dry = cache[ck]
        gl, gr = math.sqrt((1-pan)/2)*gain, math.sqrt((1+pan)/2)*gain
        # Two quiet cross-channel early reflections create space without long wash.
        echoes = [(0, gl, gr), (int(.071*RATE), gr*.10, gl*.08),
                  (int(.113*RATE), gr*.06, gl*.09)]
        for delay, vl, vr in echoes:
            offset = start + delay
            for i in range(min(len(dry), count-offset)):
                left[offset+i] += dry[i]*vl
                right[offset+i] += dry[i]*vr
        notes.append([round(at, 4), midi, held, kind])

    def swung(at):
        if key == "b" and abs(at % 1 - .5) < .01:
            return at + 1/6
        return at

    for bar in range(16):
        base = bar * 4
        root, chord = CHORDS[bar % 8]
        last = bar == 15
        # First two bars introduce the motif and texture before full arrangement.
        intensity = .72 if bar < 2 else (1.0 if bar < 8 else .90)
        for offset, pitch, held in MOTIF[bar % 8]:
            if last:
                held = 3.5
            add(swung(base+offset), pitch, held, lead, .25*intensity, -.12)
            if key == "a" and bar >= 8 and offset == 0:
                add(base+offset, pitch+12, .65, "wood", .09, .42)
            if key == "c" and bar >= 8 and offset in (0, 2):
                add(base+offset, pitch-12, min(held, 1.0), "bassoon", .12, -.30)
        if key == "b":
            bassline = [root, root+4 if bar % 8 == 4 else root+3, root+7,
                        CHORDS[(bar+1)%8][0] - 1]
            for q, pitch in enumerate(bassline if not last else [root]):
                add(base+q, pitch, .8 if not last else 2.9, "bass", .27, 0)
            for off in ([.5, 2.5] if not last else [0]):
                for pitch in chord:
                    add(swung(base+off), pitch, .35 if not last else 2.2, "brass", .075*intensity, .35)
            if not last:
                for q in range(4):
                    add(base+q, 36, .20, "brush", .045, .55)
                    add(swung(base+q+.5), 36, .13, "brush", .027, .55)
                for off in [1, 3]:
                    add(base+off, 36, .24, "snare", .07, -.22)
                for off in [0, 2]:
                    add(base+off, 36, .22, "kick", .10)
        elif key == "a":
            for off, pitch in [(0, root), (2, root+7)][:1 if last else 2]:
                add(base+off, pitch, .8 if not last else 2.5, "bass", .31)
            for off in ([1, 3] if not last else [0]):
                for pitch in chord:
                    add(base+off, pitch, .5 if not last else 1.1, "pluck", .14*intensity, -.35)
            if bar % 2 == 1 and not last:
                for off, pitch in [(2.5, chord[1]+12), (3, chord[2]+12), (3.5, chord[0]+24)]:
                    add(base+off, pitch, .45, "wood", .085, .5)
            if bar >= 2 and not last:
                add(base, 36, .22, "kick", .08)
                add(base+2, 36, .2, "brush", .06, .35)
        else:
            add(base, root, 2.0 if not last else 3.5, "bassoon", .24, -.13)
            for j, off in enumerate([0, .75, 1.5, 2.5, 3.25] if not last else [0]):
                pitch = chord[j % 3] + (12 if j == 4 else 0)
                add(base+off, pitch, 1.0, "wood", .18*intensity, .30)
            if bar % 2 == 1 and not last:
                add(base+3.5, chord[2]+12, .9, "bell", .07, .50)

    # Smooth master fade, remove tiny DC component, and match integrated RMS.
    for channel in (left, right):
        dc = sum(channel) / count
        for i in range(count):
            fade = min(1, i/(RATE*.015), (count-1-i)/(RATE*.65))
            channel[i] = (channel[i]-dc)*fade
    power = (sum(x*x for x in left) + sum(x*x for x in right))/(count*2)
    rms_before = math.sqrt(power)
    peak_before = max(max(abs(x) for x in left), max(abs(x) for x in right))
    # -20 dBFS unweighted RMS, limited to -1.5 dBFS peak for generous headroom.
    gain = min(.1/rms_before, 10**(-1.5/20)/peak_before)
    pcm = bytearray(count*4)
    peak = 0
    for i in range(count):
        l = round(left[i]*gain*32767)
        r = round(right[i]*gain*32767)
        peak = max(peak, abs(l), abs(r))
        struct.pack_into("<hh", pcm, i*4, l, r)
    path = OUT / f"{key}-{title}.wav"
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm)
    result = dict(id=key.upper(), file=path.name, title=title.replace("-", " ").title(),
                  brief=brief, bpm=bpm, bars=16, duration_seconds=round(count/RATE, 6),
                  peak_dbfs=round(20*math.log10(peak/32768), 3),
                  rms_dbfs=round(20*math.log10(rms_before*gain), 3),
                  clipped_samples=0, frames=count, channels=2, sample_rate=RATE,
                  bits_per_sample=16, bytes=path.stat().st_size,
                  sha256=hashlib.sha256(path.read_bytes()).hexdigest(), note_events=len(notes))
    print(json.dumps(result))
    return result


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    demos = [
        render("a", "haunted-cartoon-orchestra", 110, "reed",
               "Playful D-minor clarinet-like lead, pizzicato chords, xylophone replies, soft bass and light percussion."),
        render("b", "bubble-swing-brigade", 128, "brass",
               "Swung brass/reed character, walking bass, syncopated horn chords and quiet brushes; same melodic motif."),
        render("c", "enchanted-toybox", 100, "bell",
               "Gentle celesta-like melody, marimba arpeggios and bassoon-like bass/countermelody; same melodic motif."),
    ]
    manifest = dict(schema_version=1, seed=SEED, generator="tools/audio/build-music-demos.py",
        generator_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        command="python3 tools/audio/build-music-demos.py", dependencies="Python 3 standard library only",
        provenance="Original programmatically composed melody, harmony and synthesis. No external samples, recordings, or music-generation service used.",
        purpose="Menu direction comparison; not shipped or wired into the game.",
        limitations=["Synthesized timbral sketches, not orchestral recordings or final production masters.",
                      "Resolving 16-bar excerpts with a decay tail; not seamless loops.",
                      "Compared at -20 dBFS unweighted RMS; not perceptual LUFS normalization.",
                      "Technical waveform checks do not establish subjective listening quality."],
        shared_motif={"key": "D minor", "meter": "4/4", "bars": MOTIF,
                      "event_format": ["beat_offset", "MIDI_pitch", "held_beats"],
                      "arrangement": "Eight-bar phrase repeated with arrangement variation; final bar resolves."},
        demos=demos)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2)+"\n")


if __name__ == "__main__":
    main()

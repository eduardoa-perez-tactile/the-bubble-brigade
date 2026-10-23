#!/usr/bin/env python3
"""Build streaming game loops from the approved original sampled-band scores.

Standard library + FluidSynth >=2.3. Offline only. Authoring inputs stay unchanged.
python3 tools/audio/build-runtime-music.py
"""
from array import array
import copy
import hashlib
import json
import math
from pathlib import Path
import struct
import subprocess
import sys
import uuid
import wave

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / '.cache/audio-production/runtime-music'
OUT = ROOT / 'assets/audio/brigade'
BANK = ROOT / '.cache/audio-production/GeneralUser-GS.sf2'
BANK_HASH = '9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe'
RATE = 48000
SOURCES = [('menu', 'menu-midnight-ballroom', 16, 108),
           ('gameplay', 'gameplay-brigade-stomp', 24, 156)]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sustain_final_rhythm(score, bars, bpm, name):
    # Approved review excerpts end with a stop/button. For runtime looping only,
    # carry the same approved Cm6 accompaniment through that final bar. Melody,
    # brass and every source file remain untouched. Reuse existing note timing,
    # velocity and articulation rather than inventing new musical material.
    result = copy.deepcopy(score)
    seconds_per_bar = 4*60/bpm
    source_bar = 2 if name == 'menu' else 19
    final_bar = bars-1
    assert score['harmony'][source_bar] == score['harmony'][final_bar] == 'Cm6'
    rhythm_ids = {'stride-piano', 'upright-bass', 'brush-kit', 'woodblock-kit'}
    offset = (final_bar-source_bar)*seconds_per_bar
    for track in result['tracks']:
        if track['id'] not in rhythm_ids:
            continue
        events = track['events']
        pending = {}
        pairs = []
        for event in events:
            if event['type'] == 'on':
                pending.setdefault(event['note'], []).append(event)
            elif event['type'] == 'off':
                queue = pending.get(event['note'], [])
                if queue:
                    pairs.append((queue.pop(0),event))
        assert not any(pending.values()), 'Unclosed accompaniment notes'
        # Humanized notes can start a few milliseconds before the nominal beat.
        def in_bar(event, bar):
            return bar*seconds_per_bar-.04 <= event['time'] < (bar+1)*seconds_per_bar-.04
        remove = {id(event) for pair in pairs if in_bar(pair[0],final_bar) for event in pair}
        kept = [event for event in events if id(event) not in remove]
        for pair in pairs:
            if in_bar(pair[0],source_bar):
                kept.extend(dict(event,time=event['time']+offset) for event in pair)
        track['events'] = sorted(kept,key=lambda event:(event['time'],0 if event['type']=='off' else 1))
    return result


def render_cycles(score, bars, bpm, name):
    score = sustain_final_rhythm(score,bars,bpm,name)
    assert score['bpm'] == bpm
    beats = bars*4
    frames = math.floor(beats*60/bpm*RATE+.5)
    period = frames/RATE
    assert abs(score['duration_seconds'] - (beats*60/bpm+3)) < .000002, 'Unexpected source tail/structure'
    repeated = dict(score)
    repeated.update(title=score['title']+' — three continuous runtime cycles', duration_seconds=3*period,
                    runtime_loop_bars=bars, runtime_loop_frames=frames)
    repeated['tracks'] = []
    for track in score['tracks']:
        assert all(event['time'] < period for event in track['events']), 'Unexpected source event past musical end'
        item = dict(track, events=[])
        for cycle in range(3):
            start = cycle*period
            # Release lingering keys/pedal and reset expression/mix; retain shared reverb history.
            for cc, value in [(64, 0), (123, 0), (7, round(track.get('volume', 1)*127)),
                              (10, round((track.get('pan', 0)+1)*63.5)), (11, 127)]:
                item['events'].append(dict(time=start, type='cc', controller=cc, value=value))
            for event in track['events']:
                item['events'].append(dict(event, time=event['time']+start))
        repeated['tracks'].append(item)
    score_path = CACHE / f'{name}-three-cycles.json'
    score_path.write_text(json.dumps(repeated, indent=2)+'\n')
    raw = CACHE / f'{name}-three-cycles-float.wav'
    process = subprocess.run([sys.executable, str(ROOT/'tools/audio/render-period-band.py'),
                              str(score_path), str(BANK), str(raw)], capture_output=True, text=True)
    if process.stderr:
        print(process.stderr, end='', file=sys.stderr)
    if process.returncode:
        raise RuntimeError(f'Render failed for {name}')
    return raw, frames, json.loads(process.stdout)


def loop_master(raw, frames, target):
    data = raw.read_bytes()
    assert data[:4] == b'RIFF' and data[36:40] == b'data'
    assert struct.unpack_from('<HHI', data, 20) == (3, 2, RATE)
    samples = array('f')
    samples.frombytes(data[44:])
    if sys.byteorder != 'little':
        samples.byteswap()
    assert len(samples) == 3*frames*2 and all(math.isfinite(x) for x in samples)
    hp = math.exp(-2*math.pi*55/RATE)
    lp = 1-math.exp(-2*math.pi*8500/RATE)
    prev_in, prev_hp, prev_lp = [0.,0.], [0.,0.], [0.,0.]
    # Process uninterrupted cycles, including filter/reverb warmup; never edge fade the loop body.
    for i in range(3*frames):
        frame = []
        for c in (0,1):
            x = samples[2*i+c]
            high = hp*(prev_hp[c]+x-prev_in[c])
            prev_in[c], prev_hp[c] = x, high
            prev_lp[c] += lp*(high-prev_lp[c])
            frame.append(prev_lp[c])
        mid, side = (frame[0]+frame[1])/2, (frame[0]-frame[1])*.325
        samples[2*i], samples[2*i+1] = mid+side, mid-side
    loop = samples[frames*2:frames*4]
    dc = [sum(loop[c::2])/frames for c in (0,1)]
    for i in range(frames):
        for c in (0,1):
            loop[2*i+c] -= dc[c]
    before = [loop[c]-loop[-2+c] for c in (0,1)]
    # Tiny 3 ms raised-cosine boundary correction. Blend both endpoint offsets to
    # their common midpoint; do not shorten period, insert silence or fade gain.
    seam_frames = round(.003*RATE)
    for c in (0,1):
        difference = loop[c]-loop[-2+c]
        for i in range(seam_frames):
            weight = .5*(1+math.cos(math.pi*i/(seam_frames-1)))
            loop[2*i+c] -= difference*.5*weight
            loop[2*(frames-1-i)+c] += difference*.5*weight
    rms = math.sqrt(sum(x*x for x in loop)/len(loop))
    peak = max(abs(x) for x in loop)
    assert rms > .0001
    gain = min(.1/rms, 10**(-1.5/20)/peak)
    pcm = array('h', (round(x*gain*32767) for x in loop))
    actual_peak = max(abs(x) for x in pcm)/32768
    actual_rms = math.sqrt(sum(x*x for x in pcm)/len(pcm))/32768
    channel_dc = [sum(pcm[c::2])/frames/32768 for c in (0,1)]
    seam = [abs(pcm[c]-pcm[-2+c])/32768 for c in (0,1)]
    # 100 ms signal windows expose unintended silent padding without treating rests as errors.
    windows = [math.sqrt(sum(x*x for x in pcm[i:i+RATE//5])/len(pcm[i:i+RATE//5]))/32768
               for i in range(0,len(pcm),RATE//5)]
    assert actual_peak < 10**(-1/20) and max(map(abs,channel_dc)) < .001
    assert max(seam) <= 1/32768
    assert min(windows) > 0, 'Unexpected digitally silent window'
    pcm_bytes = array('h', pcm)
    if sys.byteorder != 'little':
        pcm_bytes.byteswap()
    with wave.open(str(target), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm_bytes.tobytes())
    return dict(file=str(target.relative_to(ROOT)), sha256=digest(target), frames=frames,
                duration_seconds=frames/RATE, channels=2, sample_rate=RATE, bits_per_sample=16,
                peak_dbfs=20*math.log10(actual_peak), rms_dbfs=20*math.log10(actual_rms),
                dc_offset_per_channel=channel_dc, seam_delta_before_master=before,
                seam_delta_pcm_per_channel=seam, minimum_100ms_rms_dbfs=20*math.log10(min(windows)),
                circular_boundary_correction_ms=3, inserted_silent_frames=0)


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    if not BANK.exists():
        subprocess.run([sys.executable, str(ROOT/'tools/audio/fetch-period-bank.py')], check=True)
    assert digest(BANK) == BANK_HASH, 'Pinned GeneralUser GS bank hash mismatch'
    records = []
    for name, source, bars, bpm in SOURCES:
        source_path = ROOT/f'art/audio-period-band/scores/{source}.json'
        score = json.loads(source_path.read_text())
        raw, frames, rendering = render_cycles(score,bars,bpm,name)
        record = loop_master(raw,frames,OUT/f'{name}.wav')
        sidecar = OUT/f'{name}.wav.gmeta'
        if not sidecar.exists():
            sidecar.write_text(f'guid = "{uuid.uuid4()}"\nimporter = "audio"\n\n[settings]\ncodec = "opus"\nstream_after = 0\nbitrate = 128000\nnormalize = false\n')
        record.update(source_score=str(source_path.relative_to(ROOT)), source_score_sha256=digest(source_path),
                      loop_bars=bars, loop_beats=bars*4,bpm=bpm, renderer=rendering,
                      runtime_derivation=dict(source_bar_1_based=3 if name=='menu' else 20,
                                              destination_bar_1_based=bars, harmony='Cm6',
                                              tracks=['stride-piano','upright-bass','brush-kit','woodblock-kit'],
                                              wind_brass_and_source_scores_unchanged=True),
                      note='Runtime-only final-bar accompaniment reuses an existing Cm6 rhythm bar; melody/brass unchanged. Source three-second review tail removed. No listening claim.')
        records.append(record)
    report = dict(sample_bank_sha256=BANK_HASH,
                  provenance='Original approved scores; GeneralUser GS 2.0.3 sampled instruments, existing license in art/audio-period-band/LICENSE-GeneralUser-GS.txt.',
                  processing='Three continuous cycles with CC resets, shared reverb/filter continuity; middle cycle, 55 Hz highpass, 8.5 kHz lowpass, side gain .65, DC removal, 3ms circular seam correction, -20 dBFS RMS target, -1.5 dBFS peak ceiling. No body/edge fade.',
                  tools={name:digest(ROOT/'tools/audio'/name) for name in ['render-period-band.py','build-runtime-music.py']},
                  loops=records)
    (CACHE/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))


if __name__ == '__main__':
    main()

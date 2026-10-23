#!/usr/bin/env python3
"""Render an original score through FluidSynth >=2.3 entirely offline.

Usage: python3 tools/audio/render-period-band.py SCORE.json BANK.sf2 OUTPUT.wav
Requires libfluidsynth (e.g. brew install fluid-synth), no Python packages.
Output: 48 kHz stereo IEEE-float WAV intermediate, intentionally unmastered.
No audio or MIDI driver is created; all synthesis is synchronous in memory.
"""
from __future__ import annotations

import ctypes as C
import ctypes.util
import json
import math
import os
from pathlib import Path
import struct
import sys

RATE = 48_000
BLOCK = 4096


def require(condition, message):
    if not condition:
        raise ValueError(message)


def integer(value, name, minimum=0, maximum=127):
    require(isinstance(value, int) and not isinstance(value, bool) and minimum <= value <= maximum,
            f'{name} must be an integer in {minimum}...{maximum}')
    return value


def finite(value, name, minimum, maximum):
    require(isinstance(value, (float, int)) and not isinstance(value, bool)
            and math.isfinite(value) and minimum <= value <= maximum,
            f'{name} must be finite and in {minimum}...{maximum}')
    return float(value)


def load_library():
    candidate = os.environ.get('FLUIDSYNTH_LIBRARY') or ctypes.util.find_library('fluidsynth')
    if not candidate:
        for path in ['/opt/homebrew/lib/libfluidsynth.dylib', '/usr/local/lib/libfluidsynth.dylib']:
            if Path(path).exists():
                candidate = path
                break
    require(candidate, 'libfluidsynth not found; install FluidSynth >=2.3 or set FLUIDSYNTH_LIBRARY')
    lib = C.CDLL(candidate)
    signatures = {
        'fluid_version': (None, [C.POINTER(C.c_int)] * 3),
        'new_fluid_settings': (C.c_void_p, []),
        'delete_fluid_settings': (None, [C.c_void_p]),
        'fluid_settings_setnum': (C.c_int, [C.c_void_p, C.c_char_p, C.c_double]),
        'fluid_settings_setint': (C.c_int, [C.c_void_p, C.c_char_p, C.c_int]),
        'new_fluid_synth': (C.c_void_p, [C.c_void_p]),
        'delete_fluid_synth': (None, [C.c_void_p]),
        'fluid_synth_sfload': (C.c_int, [C.c_void_p, C.c_char_p, C.c_int]),
        'fluid_synth_set_channel_type': (C.c_int, [C.c_void_p, C.c_int, C.c_int]),
        'fluid_synth_program_select': (C.c_int, [C.c_void_p, C.c_int, C.c_int, C.c_int, C.c_int]),
        'fluid_synth_cc': (C.c_int, [C.c_void_p, C.c_int, C.c_int, C.c_int]),
        'fluid_synth_noteon': (C.c_int, [C.c_void_p, C.c_int, C.c_int, C.c_int]),
        'fluid_synth_noteoff': (C.c_int, [C.c_void_p, C.c_int, C.c_int]),
        'fluid_synth_write_float': (C.c_int, [C.c_void_p, C.c_int, C.c_void_p, C.c_int, C.c_int,
                                                       C.c_void_p, C.c_int, C.c_int]),
    }
    for name, (restype, args) in signatures.items():
        function = getattr(lib, name)
        function.restype = restype
        function.argtypes = args
    numbers = [C.c_int() for _ in range(3)]
    lib.fluid_version(*(C.byref(number) for number in numbers))
    version = tuple(number.value for number in numbers)
    require(version >= (2, 3, 0), f'FluidSynth >=2.3 required; found {version}')
    return lib, version


def render(score_path, bank_path, output_path):
    require(output_path.resolve() not in [score_path.resolve(), bank_path.resolve()], 'Output would overwrite an input')
    require(bank_path.is_file(), f'Sound bank missing: {bank_path}')
    score = json.loads(score_path.read_text())
    finite(score['bpm'], 'bpm', .01, 1000)
    duration = finite(score['duration_seconds'], 'duration_seconds', 1/RATE, 7200)
    total_frames = math.floor(duration * RATE + .5)
    tracks = score['tracks']
    require(isinstance(tracks, list) and 1 <= len(tracks) <= 128, 'Expected 1...128 tracks')
    seen = set()
    schedule = []
    prepared = []
    for channel, track in enumerate(tracks):
        name = track['id']
        require(isinstance(name, str) and name and name not in seen, 'Track ids must be nonempty and unique')
        seen.add(name)
        program = integer(track['program'], f'{name} program')
        msb = integer(track.get('bank_msb', 121), f'{name} bank_msb')
        require(msb in (120, 121), f'{name}: bank_msb must be 121 melodic or 120 percussion')
        require(track.get('bank_lsb', 0) == 0, f'{name}: only bank_lsb 0 is supported')
        volume = finite(track.get('volume', 1), f'{name} volume', 0, 1)
        pan = finite(track.get('pan', 0), f'{name} pan', -1, 1)
        prepared.append((program, msb, volume, pan))
        for event in track['events']:
            time = finite(event['time'], f'{name} event time', 0, duration)
            frame = math.floor(time * RATE + .5)
            require(frame < total_frames, f'{name}: event time must round inside [0, duration_seconds)')
            kind = event['type']
            require(kind in ('on', 'off', 'cc'), f'{name}: unsupported event type {kind}')
            if kind in ('on', 'off'):
                integer(event['note'], f'{name} note')
            if kind == 'on':
                integer(event['velocity'], f'{name} velocity')
            if kind == 'cc':
                integer(event['controller'], f'{name} controller')
                integer(event['value'], f'{name} controller value')
            schedule.append((frame, len(schedule), channel, event))
    schedule.sort(key=lambda event: (event[0], event[1]))
    lib, version = load_library()
    settings = lib.new_fluid_settings()
    require(settings, 'Could not create FluidSynth settings')
    synth = None
    def checked(result, context):
        require(result == 0, f'FluidSynth failed: {context} (status {result})')
    try:
        for name, value in [('synth.sample-rate', RATE), ('synth.gain', .2),
                            ('synth.reverb.room-size', .25), ('synth.reverb.damp', .5),
                            ('synth.reverb.width', .35), ('synth.reverb.level', .12)]:
            require(lib.fluid_settings_setnum(settings, name.encode(), value) == 0,
                    f'Could not set {name}')
        for name, value in [('synth.midi-channels', max(16, math.ceil(len(tracks)/16)*16)),
                            ('synth.polyphony', 512), ('synth.cpu-cores', 1),
                            ('synth.reverb.active', 1), ('synth.chorus.active', 0),
                            ('synth.threadsafe-api', 0), ('synth.lock-memory', 0)]:
            require(lib.fluid_settings_setint(settings, name.encode(), value) == 0,
                    f'Could not set {name}')
        synth = lib.new_fluid_synth(settings)
        require(synth, 'Could not create FluidSynth synthesizer')
        bank_id = lib.fluid_synth_sfload(synth, os.fsencode(bank_path), 0)
        require(bank_id >= 0, f'Could not load sound bank {bank_path}')
        for channel, (program, msb, volume, pan) in enumerate(prepared):
            checked(lib.fluid_synth_set_channel_type(synth, channel, int(msb == 120)), 'channel type')
            checked(lib.fluid_synth_program_select(synth, channel, bank_id, 128 if msb == 120 else 0, program),
                    f'track {tracks[channel]["id"]} preset')
            for controller, value in [(7, round(volume*127)), (11, 127), (10, round((pan+1)*63.5))]:
                checked(lib.fluid_synth_cc(synth, channel, controller, value), 'track mix')
        # IEEE float32 WAV, stereo interleaved. No clipping before downstream mastering.
        data_size = total_frames * 8
        require(data_size + 36 <= 0xFFFFFFFF, 'WAV exceeds RIFF size limit')
        header = struct.pack('<4sI4s4sIHHIIHH4sI', b'RIFF', data_size+36, b'WAVE', b'fmt ', 16,
                             3, 2, RATE, RATE*8, 8, 32, b'data', data_size)
        buffer = (C.c_float * (BLOCK*2))()
        written = 0
        stale_noteoffs = 0
        peak = energy = 0.0
        with output_path.open('wb') as output:
            output.write(header)
            def until(boundary):
                nonlocal written, peak, energy
                while written < boundary:
                    count = min(BLOCK, boundary-written)
                    checked(lib.fluid_synth_write_float(synth, count, buffer, 0, 2, buffer, 1, 2),
                            f'render at frame {written}')
                    samples = buffer[:count*2]
                    require(all(math.isfinite(x) for x in samples), f'Nonfinite output at {written}')
                    peak = max(peak, max(abs(x) for x in samples))
                    energy += sum(x*x for x in samples)
                    output.write(struct.pack(f'<{count*2}f', *samples))
                    written += count
            for frame, _, channel, event in schedule:
                until(frame)
                if event['type'] == 'on':
                    result = lib.fluid_synth_noteon(synth, channel, event['note'], event['velocity'])
                elif event['type'] == 'off':
                    result = lib.fluid_synth_noteoff(synth, channel, event['note'])
                    # Decay-only samples (especially drums) can finish before their score
                    # note-off. FLUID_FAILED here means there was no active voice.
                    if result == -1:
                        stale_noteoffs += 1
                        continue
                else:
                    result = lib.fluid_synth_cc(synth, channel, event['controller'], event['value'])
                checked(result, f'event {event} on channel {channel}')
            until(total_frames)
        if stale_noteoffs:
            print(f'render-period-band: ignored {stale_noteoffs} stale note-offs (decayed or already released voices)', file=sys.stderr)
        print(json.dumps({'title': score['title'], 'renderer': 'FluidSynth', 'version': '.'.join(map(str, version)),
                          'frames': written, 'sample_rate': RATE, 'channels': 2, 'format': 'float32 WAV',
                          'tracks': len(tracks), 'events': len(schedule), 'stale_noteoffs': stale_noteoffs, 'peak': peak,
                          'rms': math.sqrt(energy/(written*2)), 'output': str(output_path)}, indent=2))
    finally:
        if synth:
            lib.delete_fluid_synth(synth)
        lib.delete_fluid_settings(settings)


def main():
    require(len(sys.argv) == 4, 'Usage: render-period-band.py SCORE.json BANK.sf2 OUTPUT.wav')
    render(*(Path(path) for path in sys.argv[1:]))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f'render-period-band: {error}', file=sys.stderr)
        sys.exit(1)

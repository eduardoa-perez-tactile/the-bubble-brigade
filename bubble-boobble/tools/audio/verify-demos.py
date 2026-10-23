"""Validate delivered audition PCM, provenance hashes and local player links.

Technical checks do not establish musical quality or gameplay mix quality.
"""
from array import array
import hashlib
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import sys
import wave

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/audio-direction-demos'


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src', 'href') and value and not value.startswith(('http:', 'https:', '#')):
                self.paths.append(value)


def main():
    paths = sorted(OUT.rglob('*.wav'))
    assert len(paths) == 24, f'Expected 3 music + 18 effects + 3 reels, got {len(paths)}'
    expected = {}
    for family in ('music', 'sfx'):
        manifest = json.loads((OUT / family / 'manifest.json').read_text())
        source = ROOT / manifest['generator']
        assert hashlib.sha256(source.read_bytes()).hexdigest() == manifest['generator_sha256'], (family, 'generator changed')
        records = manifest['demos'] if family == 'music' else [record for palette in manifest['palettes'] for record in palette['cues'] + [palette['audition_reel']]]
        for record in records:
            key = f"{family}/{record['file']}"
            assert key not in expected, ('duplicate manifest path', key)
            expected[key] = record
    assert set(expected) == {p.relative_to(OUT).as_posix() for p in paths}, 'Manifest/file paths differ'
    hashes, metrics = set(), []
    for path in paths:
        with wave.open(str(path)) as wav:
            channels = wav.getnchannels()
            assert wav.getframerate() == 48000 and wav.getsampwidth() == 2, path
            assert channels == (2 if path.parent.name == 'music' else 1), path
            raw = wav.readframes(wav.getnframes())
            duration = wav.getnframes() / 48000
        samples = array('h')
        samples.frombytes(raw)
        if sys.byteorder != 'little':
            samples.byteswap()
        assert samples, path
        peak = max(abs(min(samples)), abs(max(samples))) / 32768
        rms = math.sqrt(sum(x * x for x in samples) / len(samples)) / 32768
        dc = abs(sum(samples) / len(samples) / 32768)
        assert 0.001 < peak < 0.999, (path, 'clipped or silent', peak)
        assert rms > 0.001 and dc < 0.001, (path, rms, dc)
        assert max(abs(x) for x in samples[:channels] + samples[-channels:]) < 64, (path, 'endpoint discontinuity')
        if path.parent.name == 'music':
            assert 30 <= duration <= 45, (path, duration)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        record = expected[path.relative_to(OUT).as_posix()]
        assert digest == record['sha256'], (path, 'manifest hash mismatch')
        assert abs(duration - record['duration_seconds']) < 0.00002, (path, 'manifest duration mismatch')
        assert record['channels'] == channels and record['bits_per_sample'] == 16, (path, 'manifest format mismatch')
        assert record.get('sample_rate', record.get('sample_rate_hz')) == 48000, (path, 'manifest sample rate mismatch')
        assert digest not in hashes, (path, 'duplicated audio')
        hashes.add(digest)
        metrics.append({'file': path.relative_to(OUT).as_posix(), 'seconds': round(duration, 3), 'peak_dbfs': round(20 * math.log10(peak), 2), 'rms_dbfs': round(20 * math.log10(rms), 2), 'sha256': digest})
    parser = Links()
    parser.feed((OUT / 'index.html').read_text())
    for path in parser.paths:
        assert (OUT / path).is_file(), ('broken listening-page link', path)
    music_levels = [m['rms_dbfs'] for m in metrics if m['file'].startswith('music/')]
    assert max(music_levels) - min(music_levels) <= 3, ('music comparison level mismatch', music_levels)
    print(json.dumps({'ok': True, 'files': len(paths), 'music_rms_spread_db': round(max(music_levels) - min(music_levels), 2), 'checks': ['PCM format', 'nonempty signal', 'peak headroom', 'DC offset', 'quiet endpoints', 'distinct files', 'manifest coverage', 'local player links', 'music duration and comparable RMS'], 'scope': 'Technical offline audition validation only; no auditory or in-game mix judgement.', 'audio': metrics}, indent=2))


if __name__ == '__main__':
    main()

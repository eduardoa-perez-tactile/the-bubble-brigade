"""Check sampled-band delivery, editable scores, source identity and player links."""
from array import array
import hashlib
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import sys
import wave

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/audio-period-band'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src', 'href') and value and not value.startswith(('https:', 'http:', '#')):
                assert (OUT / value).is_file(), ('Broken review link', value)


def main():
    manifest = json.loads((OUT / 'manifest.json').read_text())
    for source, expected in manifest['sources'].items():
        assert digest(ROOT / source) == expected, ('Source hash mismatch', source)
    bank = manifest['sample_bank']
    assert digest(OUT / bank['license']) == bank['license_sha256']
    assert len(manifest['demos']) == 2
    assert {r['file'] for r in manifest['demos']} == {p.name for p in OUT.glob('*.wav')}
    results = []
    for record in manifest['demos']:
        path = OUT / record['file']
        assert digest(path) == record['sha256'], path
        with wave.open(str(path)) as wav:
            assert (wav.getframerate(), wav.getnchannels(), wav.getsampwidth()) == (48000, 2, 2)
            count = wav.getnframes()
            assert count == record['frames'] and 35 <= count/48000 <= 45
            pcm = array('h', wav.readframes(count))
        if sys.byteorder != 'little':
            pcm.byteswap()
        peak = max(abs(x) for x in pcm)/32768
        rms = math.sqrt(sum(x*x for x in pcm)/len(pcm))/32768
        rms_db = 20*math.log10(rms)
        assert peak <= 10**(-1.49/20) and -22 <= rms_db <= -19.9
        assert max(abs(x) for x in pcm[:2]+pcm[-2:]) == 0
        assert max(abs(sum(pcm[c::2])/count/32768) for c in (0, 1)) < .001
        assert abs(rms_db-record['rms_dbfs']) < .002
        score_path = OUT / record['score_file']
        assert digest(score_path) == record['score_sha256']
        score = json.loads(score_path.read_text())
        assert abs(count/48000-score['duration_seconds']) < 1/48000
        notes = 0
        for track in score['tracks']:
            active, last = set(), -1
            for event in track['events']:
                time = event['time']
                assert 0 <= time < score['duration_seconds'] and time >= last
                last = time
                if event['type'] == 'on':
                    assert event['note'] not in active and 0 < event['velocity'] <= 127
                    active.add(event['note'])
                    notes += 1
                elif event['type'] == 'off':
                    assert event['note'] in active
                    active.remove(event['note'])
                else:
                    assert event['type'] == 'cc' and 0 <= event['value'] <= 127
            assert not active, ('Unreleased notes', track['id'])
        results.append(dict(file=record['file'], duration=round(count/48000, 3), peak_dbfs=round(20*math.log10(peak), 3), rms_dbfs=round(rms_db, 3), note_pairs=notes))
    Links().feed((OUT / 'index.html').read_text())
    assert abs(results[0]['rms_dbfs']-results[1]['rms_dbfs']) < 1
    print(json.dumps(dict(ok=True, demos=results, scope='Offline technical checks only; musical appeal and game mix need auditory review.'), indent=2))


if __name__ == '__main__':
    main()

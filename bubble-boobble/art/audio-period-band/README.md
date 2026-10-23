# Cartoon-jazz revision — sampled instrument demos

23 October 2026. The revised direction follows the illustrated game's playful
1930s–1940s cartoon character. These are new original compositions rendered with
sampled instruments, with more room for musical breathing and ensemble interplay.
They are sequenced demos, not live performances or final production loops.

The cartoon-jazz direction and these menu/gameplay excerpts were approved on
23 October 2026. Derived loops are now wired into the illustrated game; see the
[playback integration](../../docs/audio-production/playback-integration.md).
Remaining production cues and effects are separate work.

Open [the listening page](index.html), or play the WAVs directly:

| Role | Excerpt | Approach |
| --- | --- | --- |
| Menu | [Midnight at the Bubble Ballroom](menu-midnight-ballroom.wav) | 108 BPM; minor-key clarinet, muted-trumpet answers, stride-style piano, upright bass and brushed rhythm |
| Gameplay | [Brigade Stomp](gameplay-brigade-stomp.wav) | 156 BPM; reed/brass exchanges, moving bass, ensemble accents and stop-time gaps for game effects |

Both last about 39 seconds and resolve into a short tail. Instrument attacks come
from a sample bank rather than the first batch's mathematical oscillator voices.
The arrangements add phrase-level expression, held versus clipped notes, small
timing offsets by player role, chord-aware approaches and space between wind phrases.
Warm tonal shaping, short room reverb and a compact stereo image support the art;
no vinyl crackle or noise is added. The faster cue still needs in-game masking review.

## Sources and credits

Original melodies, harmony and arrangements: this game's authoring scripts and
editable event scores under `scores/`. Instrument samples: **GeneralUser GS 2.0.3
by S. Christian Collins**, rendered with FluidSynth 2.6.1 on the authoring machine.
The exact author-published bank is pinned to commit
`684543d5e5efaef08d02be50dcda8d552478fa60` in the
[canonical source](https://github.com/mrbumpy409/GeneralUser-GS/tree/684543d5e5efaef08d02be50dcda8d552478fa60).
The [complete upstream license](LICENSE-GeneralUser-GS.txt), including its disclosure
about the origin of some inherited samples, is retained. This credits third-party
instrument recordings; it does not claim we created the source recordings.
Only license line endings are normalized from CRLF to LF; both hashes are recorded.

The bank remains in ignored `.cache/` and is not shipped or committed. Use FluidSynth
for reproduction: the author's compatibility notes warn that Apple's sampler does
not faithfully render many of this bank's presets. FluidSynth code and sample-bank
license are separate; this repository stores rendered audio, scores and Python glue,
not a copy of the renderer binary.

## Reproduce

Requires Python 3 standard library and FluidSynth >=2.3 shared library. On macOS,
`brew install fluid-synth` supplies the library. Other systems may set
`FLUIDSYNTH_LIBRARY` to the installed library's absolute path.

From `bubble-boobble/`:

```sh
python3 tools/audio/fetch-period-bank.py
python3 tools/audio/build-period-demos.py
python3 tools/audio/verify-period-demos.py
```

The downloader checks pinned SHA-256 values. Building first regenerates the two
scores, renders them entirely offline, then creates 48 kHz stereo 16-bit WAVs and
the review page. No audio device, MIDI device, game session or desktop UI is used.
Raw float intermediates remain under `.cache/audio-production/`. Generated metadata
records source, score, bank, license and output hashes plus renderer version.

Mastering targets -20 dBFS unweighted RMS with a -1.5 dBFS peak ceiling. This gives
the two excerpts comparable measured energy; it is not perceptual LUFS matching.
Exact hashes were checked on the authoring machine; different FluidSynth builds,
platforms or floating-point implementations may change bytes. Decayed percussion
can finish before its scheduled note-off; the renderer reports those harmless
stale note-offs and keeps all other instrument-event errors fatal.

## Review limits

Technical checks do not establish that these sound like a performed period band.
General-purpose samples have limited legato, scoops, falls and growls. Judge the
revised timbre and phrasing by ear before expanding the arrangement. Final loop
seams, full-length development, gameplay mix and phone-speaker translation remain
production work. Original SFX sketches are unchanged; the selected music palette
will inform their next pass. Files remain outside game assets, so live music,
native bridge behavior, original reference assets and migration evidence are unchanged.

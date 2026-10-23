# The Bubble Brigade — audio direction demos

First review batch, 23 October 2026. These original synthesized sketches compare
three directions before selecting the game's production sound. They are not final
orchestrations, seamless gameplay loops or live replacements.

The [revised sampled-instrument cartoon-jazz batch](../audio-period-band/index.html)
develops the preferred 1930s–1940s character after this first synthesized comparison.

Open [the listening page](index.html) locally in a browser, or play the WAV files
directly. It uses native audio controls, makes no network requests and never
autoplays. Starting a clip pauses the others. Previewing audio here is human
audition, separate from the project's Game Engine-only automated gameplay tests.

| Direction | Music sketch | SFX reel |
| --- | --- | --- |
| A — Haunted Cartoon Orchestra | [36.71 seconds](music/a-haunted-cartoon-orchestra.wav) | [7.13 seconds](sfx/a-haunted-cartoon/audition-reel.wav) |
| B — Bubble Swing Brigade | [31.80 seconds](music/b-bubble-swing-brigade.wav) | [7.13 seconds](sfx/b-bubble-swing/audition-reel.wav) |
| C — Enchanted Toybox | [40.20 seconds](music/c-enchanted-toybox.wav) | [7.13 seconds](sfx/c-enchanted-toybox/audition-reel.wav) |

All three arrangements share an original D-minor melodic motif. A is the proposed
starting direction, with B's rhythmic bounce available for combat; no style is
selected yet. The synth voices suggest instrumental roles rather than reproduce
recorded clarinets, brass or strings. There are no external samples or inherited
melodies in these new files.

Each effects reel plays **bubble shot, bubble pop, capture, food pickup, player
downed, rescue** in that order. Individual mono WAVs sit next to each reel. Each
palette changes resonances, textures and pitch while preserving the cue roles.

## Reproduce

From `bubble-boobble/`, with Python 3 (standard library only):

```sh
python3 tools/audio/build-music-demos.py
python3 tools/audio/build-sfx-demos.py
python3 tools/audio/build-audition.py
python3 tools/audio/verify-demos.py
```

Generators resolve paths from their own files and use fixed random seeds. Exact
SHA-256 reproduction was checked on the authoring machine; Python/platform floating
point differences may affect exact bytes elsewhere. Source and output hashes,
instrument briefs, note material, durations and levels live in the
[music manifest](music/manifest.json) and [effects manifest](sfx/manifest.json).

## Validation and limits

The batch contains 24 WAVs: three stereo music demos, eighteen mono effects and
three mono reels. All are 48 kHz, 16-bit PCM. The verifier checks format, headroom,
DC, endpoints, nonempty audio, unique files, manifest hashes and listening-page
links. Music is matched to -20 dBFS unweighted RMS for comparison; that is not
perceptual LUFS matching. Effect levels retain a quieter-shot/louder-rescue hierarchy.

Existing engine audio tests and `gameengine check` are run for the branch. Their
logs stay under ignored `.cache/audio-production/`; the PR records final results.
The engine check retains the existing camera warnings and stale material-program
pipeline warning. These new files live outside `assets/`, have no importer
sidecars and do not enter shipped content or change runtime memory/voices.

Technical validation cannot establish musical appeal, faithful instrument timbre,
loop fatigue, phone-speaker translation or in-game masking. No automated audible
assessment, production loop test or device audio profiling is claimed. The demos
resolve with tails; production loops and the remaining cues follow direction
selection. See the [production brief](../../docs/audio-production/brief.md) for
the complete music/SFX backlog, native music ownership and integration gates.

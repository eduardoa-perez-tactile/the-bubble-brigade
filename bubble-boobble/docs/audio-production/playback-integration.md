# Illustrated game music playback

The approved sampled cartoon-jazz music is now runtime content, rather than only
audition files. `scenes/cartoon.scene.json` selects illustrated flow through the
existing recorded `cartoon-mode` intent. `music-policy.ts` routes that flow to:

| State | Runtime music |
| --- | --- |
| Title, menu, modes, team setup and inactive-game settings | `audio/brigade/menu` — Midnight at the Bubble Ballroom |
| Active campaign, survival, hurry and boss play | `audio/brigade/gameplay` — Brigade Stomp |
| Pause and settings reached from pause | Current track retained with Music gain zero |
| Win or defeat | Stop music; use short illustrated victory/defeat sound feedback |
| Return to inactive-game menus | Menu loop resumes |

Dedicated hurry/boss arrangements and new musical outcome stings remain production
work. The initial playback slice connected the two approved compositions. The subsequent
[26-cue SFX integration](sfx-integration.md) now replaces illustrated effects and adds UI/round feedback.
The preserved pixel/reference scenes retain original music, gain, native YM and
SFX ordering. Classic campaign reached inside the illustrated shell uses new music.

The optional native desktop bridge still handles window/focus/readiness. For
illustrated flow it posts an empty muted music selection to the legacy YM player.
Engine music remains audible even while that backend reports ready. Selection
identity includes the palette, so changing ownership or returning to classic mode
restores the right stream and Music gain. Readiness updates, mute, pause and volume
changes do not restart an unchanged illustrated track. Terminal silence cancels
pending streams and cannot restart an original outcome track.

## Loop assets and provenance

`assets/audio/brigade/menu.wav` is 16 bars at 108 BPM (35.5556 seconds).
`assets/audio/brigade/gameplay.wav` is 24 bars at 156 BPM (36.9231 seconds).
Both are stereo 48 kHz PCM16 authoring masters, matched near -20 dBFS unweighted RMS.
Their sidecars explicitly stream Opus at 128 kbit/s without normalization. Neither
track is in a sound bank or asset group. The music itself adds no decoded SFX residency;
the subsequent SFX bank adds the footprint documented separately.

The original approved scores and sampled-instrument license remain in
`art/audio-period-band/`. GeneralUser GS 2.0.3 by S. Christian Collins supplies the
instrument samples; these are sequenced original compositions, not live recordings.

Rebuild from `bubble-boobble/`:

```sh
python3 tools/audio/fetch-period-bank.py
python3 tools/audio/build-runtime-music.py
gameengine cook --platform desktop
```

The runtime builder removes each excerpt's review tail and renders three continuous
cycles. It preserves the middle cycle's reverb and warmed filters. For the final
runtime bar, menu accompaniment reuses its third Cm6 bar and gameplay accompaniment
its twentieth Cm6 bar, keeping the groove through the repeat. Only piano, bass and
percussion change; original scores and wind/brass cadences remain unchanged.
A three-millisecond circular seam correction preserves duration without an edge fade.
Authoring manifests and raw renders stay under ignored `.cache/audio-production/`.
Repeated builds reproduce WAV hashes on the authoring machine; existing asset GUIDs
are retained on rebuild.

Menu source-score SHA-256: `ec8b60495c50938a22c41b335c474efc130c19958c01537a05fcf3f820de6c17`.
Gameplay source-score SHA-256: `6b788dc33f44f28eed7b03a4b6218962fdaec3a0c5ca0ef6b539cc5f14d8953b`.
Runtime menu SHA-256: `1387027b97e8e11d58b1dc9af8f4d828efe5b083f86cb8ab7e815f794fcecb44`.
Runtime gameplay SHA-256: `b3ee48e023280082ba9de977149b102fad5d676847ba882353ab3bd13995fbbb`.

Source PCM peaks are -3.19/-3.60 dBFS; seam sample deltas are zero in both channels.
These are technical checks, not a claim of subjective loop quality or phone-speaker
translation. Verification results and actual cooked/memory checks are recorded in
the integration PR; logs remain in ignored cache. All automated gameplay checks use
the Game Engine. No standalone player, browser automation or desktop input is used.

## Music playback verification

The results below describe the music playback slice. SFX validation is tracked in
[SFX integration](sfx-integration.md) and its integration PR.

- Seven new playback tests pass on loose content and on cooked content with phone-low
  residency enforcement. They inspect the offline mixer's actual music selection and gain.
- Seven classic audio tests retain identical per-step baseline hashes.
- Full V8 run: all 410 logic cases pass; mobile renders pass 82 of 99. All 17 failing
  visual assertions reproduce on untouched parent commit `b084c4e`, including matching
  draw counts and screenshot failures. No baselines were rewritten. The full mobile run
  also reports the existing Cuphead UI structural peak of 15 draws against its 14 budget.
- Engine check passes typecheck, validation, desktop cook and 600 cooked smoke frames;
  existing tile/camera warnings remain.
- Cooked desktop payloads: menu 574,727 bytes; gameplay 596,703 bytes. Phone-low grouped
  residency reports 36,915,900 bytes against the 201,326,592-byte total budget; music
  stays outside groups and banks. This does not claim total mixer memory is zero.
- Cross-runtime verification is unavailable because the Hermes host is not installed.
  A native headless session disables audio output, so no live speaker/DAC verification
  is claimed; the cooked tests use the supported offline audio mixer.

# The Bubble Brigade audio production brief

Status: production planning and direction demos; no final style or soundtrack approved.
This audit reads assets and code; it does not claim listening assessment of existing recordings.
Preserve original assets, classic behavior, source provenance and archived migration evidence.

## Revised musical target — 1930s–1940s cartoon jazz

The first synthesized directions were liked compositionally but sounded too electronic.
The revised target is a small acoustic cartoon-jazz ensemble: clarinet and muted-brass
call-and-response, stride-style piano, upright bass and restrained brushed percussion.
Menu music should feel mischievous and mysterious; gameplay should have a faster swing
pulse with gaps for effects. Use breath-sized phrases, chord-aware bass movement,
contrasting short/held articulations, expression curves and restrained timing variation.
Avoid continuous bell leads, rigid repeated attacks and a modern heavy drum backbeat.

The [second review batch](../../art/audio-period-band/index.html) contains new menu and
gameplay excerpts rendered with sampled instruments. These remain sequenced composition
demos, not live-band recordings, final masters or seamless production loops. The original
mathematical synthesis sketches stay available for comparison. The current limited sample
bank will not provide every expressive scoop, fall, growl or connected reed articulation;
audition decides whether it is sufficient or a more expressive production source is needed.

Historical reference: the Smithsonian's [Benny Carter lesson](https://www.americanhistory.si.edu/explore/projects/smithsonian-jazz/education/bennys-music-class)
discusses alternating reeds/brass and soloist/section exchanges; its [1932 Minnie the Moocher record](https://www.si.edu/object/minnie-moocher%3Anmaahc_A2015.273.2.9.1abc)
provides period cartoon/jazz context. These are style references, not compositions to copy.

## Creative options and first review

Create three comparable 30–45-second instrumental menu demos plus a six-cue sound palette
(shoot, pop, capture, pickup, damage, rescue). Use one comparable original melodic brief;
avoid imitating or quoting the inherited composition. Demos are review assets, not live replacements.

| Direction | Palette | Character |
| --- | --- | --- |
| A: Haunted Cartoon Orchestra | Clarinet, muted trumpet, pizzicato strings, xylophone, upright bass, light drums | Mischievous dragons in a mysterious cartoon castle |
| B: Bubble Swing Brigade | Small swing band, brushed drums, bouncing bass, playful brass | Energetic team comedy; buoyant combat rhythm |
| C: Enchanted Toybox | Celesta, marimba, bassoon, plucked strings, soft percussion | Warm, magical and approachable |

Recommendation: A with some of B's bounce during combat. This is a recommendation, not a selected style.
Judge the demos on character, melodic recall, fatigue, intelligibility under effects and loop potential.
An arrangement sketch or procedural mockup must be labeled honestly; it does not establish the quality
of a performed or generated final orchestration. Keep editable sources, generation settings and provenance.

## Music production scope

Four loops plus two outcome stings form the first complete set. Gameplay B is a later expansion.
Use a short original signature motif across menu, combat and victory; keep combat phrasing spacious.
Lengths and tempos are targets to audition, not runtime constraints or measured existing durations.

| Cue | Target | Brief and wiring requirement |
| --- | --- | --- |
| Menu / team selection | 60–90 s loop, 100–115 BPM | Welcoming, curious motif; shared settings/team setup; replace illustrated menu selection |
| Gameplay A | 90–120 s loop, 125–140 BPM | Bouncing bass, sparse rhythm and short phrases; leave space for ten dragons' effects |
| Hurry / danger | 20–40 s loop | Urgent variation of the same motif; campaign Hurry already exists; party danger needs a new presentation policy |
| Boss | 60–90 s loop | Comic menace, heavier low voices; add selection for party boss phase |
| Victory | 6–10 s one-shot | Resolve signature motif, then silence; avoid doubling the existing victory SFX |
| Defeat | 3–5 s one-shot | Sympathetic stumble, soft ending; pleasant under repeated retries |
| Gameplay B (later) | 90–120 s loop | Related arrangement for long sessions/later waves; additional selection policy needed |

Wave breaks can reduce music gain briefly and use a clear cue. Pause should silence/soften the current
music without restarting it; a distinct pause composition is unnecessary. A quiet results bed is optional.

## Current music inventory and selection

All five playable converted WAV keys live under `reference/audio/`; original YM keys are `bubble-N`.
`src/arcade/audio.ts` maps the logical selections below; `opening` aliases menu but is not independently
selected by its current track expression. `g.Sounds` token `opening` is explicitly excluded from SFX.

| WAV key | Logical selection | Trigger |
| --- | --- | --- |
| `music-bubble-1` | `theme` | Active game without Won, GameOver or Hurry; includes ready, clearing and boss |
| `music-bubble-2` | `menu`, `opening` alias | No active game; menu/settings/team-selection and other inactive screens |
| `music-bubble-3` | `hurry` | Active game with Hurry, after outcome precedence |
| `music-bubble-4` | `gameover` | Active game State 3 (GameOver) |
| `music-bubble-5` | `win` | Active game State 4 (Won) |

Standard path emits `PlayMusic` only on changed selection/native state, with crossfade 0.
Music bus gain is saved music percentage; mute, game pause or active native transport makes it 0.
Classic campaign sets Hurry after 30 seconds of unfrozen playing time (`game.ts`); party progression
resets Hurry and has no equivalent timer assignment. Party last-enemy enrage is not a music state.
No dedicated boss music selection exists. Outcome tracks currently use the music playback path;
do not assume replacing their files produces correctly bounded one-shot stings.

## Current inherited SFX inventory

`assets/reference/audio/sfx.bank.json` contains these ten cues. All are original reference material.
Classic playback preserves each queued token and its order, full saved per-cue gain and `maxVoices: 0`;
only the global 24-voice cap applies. It excludes `opening` and suppresses playback while introducing/muted.
Illustrated routing applies to any Party game or `cartoon-courtyard` arena; it checks `includes`, so
same-token bursts coalesce to one cue per step. It also suppresses paused and introductory playback.

| Reference key | Token producer / meaning | Illustrated path today |
| --- | --- | --- |
| `shoot` | `bubbles.ts`: bubble fired | Replaced by `audio/bubble-shot` |
| `jump` | `player.ts`: player jump; `bubbles.ts`: bubble-assisted jump | Reference cue, gain .30, priority 20, max 3 |
| `pop` | `bubbles.ts`: bubble/chain pop | Replaced by `audio/bubble-pop` |
| `death` | `player.ts`: death or party downed | Reference cue, gain .65, priority 100, max 3 |
| `food` | `items.ts`: score/food collected | **No playback route despite emitted token** |
| `item` | `items.ts`: power-up; `party.ts`: revival; `boss.ts`: capture | Reference cue, gain .65, priority 60, max 3 |
| `fire` | `bubbles.ts`: released fire element | Reference cue, gain .65, priority 20, max 3 |
| `water` | `bubbles.ts`: released water element | Reference cue, gain .65, priority 20, max 3 |
| `explosion` | `items.ts`: dynamite pickup effect | **No playback route despite emitted token** |
| `laser` | Thunder release, enemy projectile, boss bottle fan | Reference cue, gain .45, priority 20, max 2 |

Illustrated effects multiply these gains by saved sound percentage. SFX bus remains at unity;
settings affect new voices; mute unloads both banks to stop current voices and reloads on unmute.

## Current newer synthesized cues

These seven WAVs and `audio/juice.bank` are generated by `tools/art/build-feel-audio.py`.
They are original mono tone sketches, not the completed proposed palette. Durations are generator values.

| Key | Length | Trigger / current mix |
| --- | --- | --- |
| `bubble-shot` | .10 s | Illustrated `shoot`; gain .48, priority 10, max 3; small tick-derived pitch variation |
| `bubble-pop` | .14 s | Illustrated `pop`; gain .50, priority 30, max 2; pitch rises with fresh pop particles |
| `capture` | .22 s | Illustrated normal bubble has EnemyID and CapturedAge 1; gain .55, priority 50, max 2 |
| `rescue` | .40 s | Feel transition from downed to live player; gain .70, priority 90, max 2 |
| `boss-hit` | .16 s | Feel detects boss HP reduction while not captured; gain .70, priority 75, max 2 |
| `wave-clear` | .42 s | Feel detects party phase entering rest; gain .70, priority 75, max 2 |
| `victory` | .70 s | Feel detects entering State Won; gain .70, priority 75, max 2 |

First three use sim `PlaySound`; last four use presentation `audio.play` in `ArcadeFeelSystem`
(`presentation.ts`), suppressed by mute/pause. Feel cues are derived in `juice.ts`; capture of the
boss produces visual `capture`, but that feel cue does not currently play `audio/capture`.
Rescue can overlap inherited `item`; boss capture emits `item`; final victory can overlap win music.
Land, turn and bubble-bounce have visual feel cues but no dedicated sound assignments.
No explicit UI navigate/confirm/back/unavailable audio assignment was found in desktop/UI sources.

## Production SFX backlog

Durations exclude unnecessary trailing silence. Variants are discrete source assets; all routine cues mono.
Priority describes the intended mix hierarchy, not an additional gameplay rule. Replacement = existing audible
role; route fix = emitted token currently inaudible illustrated; new = additional presentation wiring.

| Family / cue | Target seconds | Variants | Priority | Scope / desired sound |
| --- | --- | --- | --- | --- |
| Bubble shoot | .08–.16 | 5 | Low | Replacement; soft air puff, clear attack |
| Ordinary / chain pop | .10–.22 | 5 | Medium | Replacement; wet crisp pop; restrained chain accent |
| Enemy capture | .18–.35 | 3 | Medium-high | Replacement; elastic squeeze and tiny sparkle |
| Jump | .10–.20 | 3 | Low | Replacement; short springy chirp |
| Bubble bounce | .12–.24 | 3 | Low | Optional new distinction from existing jump; avoid doubling |
| Landing | .06–.14 | 2 | Low | Optional new; only meaningful impacts, not every step |
| Player downed/death | .25–.55 | 2 | High | Replacement; rounded comic tumble, legible in combat |
| Rescue | .35–.65 | 1 | High | Replacement; recognizable ascending phrase; review item overlap |
| Food pickup | .08–.18 | 3 | Low-medium | Route fix + replacement; small rounded plink |
| Power-up pickup | .22–.45 | 3 | Medium-high | Replacement; richer two-note flourish |
| Fire release | .20–.45 | 3 | Medium | Replacement; brief flame fwoof |
| Water release | .20–.45 | 3 | Medium | Replacement; rounded splash |
| Thunder / laser | .12–.30 | 3 | Medium | Replacement; crackling snap; current shared token also covers attacks |
| Explosion | .30–.65 | 2 | Medium-high | Route fix + replacement; cushioned comic boom |
| Boss hit | .12–.25 | 3 | High | Replacement; solid impact below rescue/damage |
| Boss windup warning | .35–.60 | 1 | High | New; trigger windup entry, distinguish from current laser at release |
| Boss capture / defeat | .45–.90 | 1 | High | New distinct routing; elastic release; avoid item/capture doubling |
| Countdown tick / GO | .08–.15 / .25–.45 | 1 each | High | New; exact boundary cues, never every countdown frame |
| Wave clear | .35–.70 | 1 | High | Replacement; compact reward tied to musical identity |
| Final victory accent | .40–.80 | 1 | High | Existing replacement role; omit/merge if musical fanfare supplies it |
| UI navigate | .03–.08 | 2 | Low | New; tiny wooden/bubble click; rate limit held input |
| UI confirm / back | .08–.18 each | 1 each | Medium | New; distinct rising/falling contours |
| UI unavailable | .10–.22 | 1 | Medium | New; soft dry bump, only after rejected action |

Core replacement pass covers every inherited role and the seven newer roles, deduplicating shoot/pop.
New warning/countdown/UI/boss feedback is a separately reviewable integration expansion. Footsteps,
continuous ambience, individual enemy voices and voice acting are deferred; they are not necessary now.

## Integration and verification plan

1. Keep demos under a separate review directory with reproducible sources and metadata. Do not switch live
   music or overwrite originals during direction selection. Retain `reference/audio`, import tools and archives.
2. After direction approval, add a separate illustrated audio namespace/manifest. Keep classic token ordering,
   gain, reference keys, native YM and fixture contracts intact. Presentation selection must cover illustrated
   menus as well as active games; a menu has no `g` from which to infer the illustrated route.
3. Use streamed Opus for loops (`PlayMusic`); keep music out of sound banks and asset groups. Explicitly
   stream short danger loops if below the importer threshold. Give new assets committed `.gmeta` sidecars.
4. Preload short effects/stings in a bounded bank before use. Mono effects, trimmed tails and appropriate
   ADPCM/PCM keep decoded memory low; source WAV masters can retain production resolution.
5. Decide outcome lifecycle explicitly: one-shot fanfare/sting emitted once on outcome entry, prior music
   stopped/ducked, then silence or a deliberate results bed. Exact-start short stings may use banked
   `PlaySound`; separate their gain control from SFX if they should follow the saved Music slider.
   Do not accidentally let `win`/`gameover` state request a looping sting or restart it after mute/fallback.
6. Keep coalescing and per-family caps: rapid shots max 2–3, pops 2, meaningful pickups 2–3; initial cooldown
   targets .06–.10 s for shots/pops and .08–.12 s for pickups. Variants need a shared family cap/cooldown,
   otherwise five variants multiply the voice allowance. Select variants deterministically or in presentation.
7. Preserve initial gain hierarchy and tune by audition: shots/jumps lowest; capture/reward above them;
   warning/rescue/downed highest. Music must leave this headroom. Existing project normalization is false;
   use deliberate per-asset loudness settings or matched masters without changing classic global gain.
8. Native bridge needs explicit treatment: `src/desktop-platform/index.ts` maps five logical tracks to
   `bubble-1`…`bubble-5`; the launcher accepts only those YM files, and its helper loops all tracks. While
   native is true, `ArcadeAudioSystem` stops/silences engine Music. File replacement alone cannot replace
   native music. Prefer engine streamed playback for the new illustrated set while retaining native YM for
   classic; coordinate bridge eligibility/state and engine bus suppression so one owner plays at a time.
   Preserve authenticated launch identity, fallback on backend failure, volume/mute, pause cursor behavior
   and background menu/results behavior. Do not extend the endpoint to arbitrary file paths.
9. Verify routing with Game Engine tests/replays: all tokens, food/explosion recovery, same-step coalescing,
   simultaneous ten-dragon effects, boss selection, classic Hurry versus party policy, outcome once-only,
   UI cues, mute/unmute, sliders, pause/resume and native availability transitions. Presentation audio uses
   `audio.sounds()`; sim-triggered cues use event evidence. Preserve deterministic classic fixtures.
10. Run engine checks, phone-low memory report and bounded voice/memory inspection for production assets;
    target the existing 24-voice ceiling before adding any new limit policy. No standalone desktop probes,
    OS input or browser playtests: PROJECT.md requires Game Engine-only automated gameplay testing.
    State that engine evidence does not certify native DAC/listening quality; do not replace it with an
    unauthorized standalone session. Human audition is still required to choose timbre and balance.

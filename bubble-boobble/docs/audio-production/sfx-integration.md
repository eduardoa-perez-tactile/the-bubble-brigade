# Illustrated game sound effects

The illustrated flow now uses 26 original effects under `audio/brigade/sfx/`.
The ten inherited effect roles and seven earlier tone-cue roles are replaced in this
flow; food and dynamite explosions now have playback routes. Additional feedback
covers boss warnings/capture, countdowns, landing/bounce, defeat and UI interactions.
Music selection remains the two streamed loops described in [playback integration](playback-integration.md).

The preserved pixel/reference flow keeps its original keys, gains, ordering and
presentation feedback. Reference assets, earlier audition files and archived migration
evidence remain intact. Party rescue and boss capture emit distinct semantic sound
tokens only in the cartoon courtyard; original arenas retain their `item` tokens.
This distinguishes genuine power-up pickups that happen in the same step.

## Authorship and assets

`tools/audio/build-runtime-sfx.py` authors the effects using seeded filtered noise,
pressure-membrane glides and damped wooden, felted, hollow and bell-like resonators.
These are newly synthesized, material-inspired effects, not recorded Foley or live
instrument performances. They use no input recordings, inherited game samples,
third-party samples, downloaded effects or external generation service. GeneralUser
GS supplies samples for the separate music compositions; it is not used for these SFX.

The palette favors soft breath, elastic bubbles, wooden contacts and restrained
percussion that complement the illustrated cartoon-jazz direction. One waveform is
provided per role; the larger discrete-variation set in the production brief remains
future authoring work. Existing deterministic shot/pop pitch variation is retained.

Rebuild from `bubble-boobble/`:

```sh
python3 tools/audio/build-runtime-sfx.py
gameengine cook --platform desktop
```

Source WAVs, bank and `.gmeta` sidecars live in `assets/audio/brigade/sfx/`. The builder
preserves existing GUIDs. Its review reel, cue timeline, seeds, source/output hashes,
levels and decoded-size manifest go to ignored `.cache/audio-production/runtime-sfx/`.
The generator is the editable authoring source; the review reel is not a bank member.

## Cue behavior and mix

Every key below is prefixed `audio/brigade/sfx/`. Durations are authoring lengths.
Gain is multiplied by the saved Sound percentage; priorities and per-key voice caps
are mixer settings, not gameplay rules. Same-step illustrated core tokens coalesce
by family. Presentation also coalesces each family per step.

| Key | Seconds | Trigger | Gain / priority / max voices |
| --- | ---: | --- | --- |
| `bubble-shot` | .14 | Fired bubble; small tick-derived pitch variation | .48 / 10 / 3 |
| `bubble-pop` | .13 | Pop/chain; pitch follows fresh pop count | .50 / 30 / 2 |
| `capture` | .42 | Normal enemy bubble at captured age one | .55 / 50 / 2 |
| `jump` | .16 | Ordinary jump; omit the generic layer when all jump tokens are proven bubble bounces | .30 / 20 / 3 |
| `bubble-bounce` | .17 | Existing feel cue proves airborne reversal at a surviving bubble plane | .28 / 15 / 2 |
| `land` | .11 | Existing landing feel cue with impact strength at least .6 | .28 / 15 / 2 |
| `player-downed` | .55 | Player death/downed token | .70 / 100 / 2 |
| `rescue` | .58 | Cartoon courtyard's authoritative revival token | .70 / 90 / 2 |
| `food-pickup` | .14 | Food/score pickup token; previously missing illustrated route | .35 / 40 / 3 |
| `power-up` | .43 | Genuine item/power-up token | .65 / 60 / 2 |
| `fire` | .28 | Released fire element | .50 / 30 / 2 |
| `water` | .31 | Released water element | .45 / 25 / 2 |
| `thunder` | .34 | Existing laser token: thunder release, enemy attack or boss bottle fan | .45 / 35 / 2 |
| `explosion` | .46 | Dynamite token; previously missing illustrated route | .70 / 75 / 2 |
| `boss-hit` | .20 | Boss HP drops while not captured | .70 / 75 / 1 |
| `boss-windup` | .49 | Enter boss windup; one warning per entry | .70 / 75 / 1 |
| `boss-capture` | .65 | Cartoon courtyard's authoritative capture token | .80 / 95 / 2 |
| `countdown-tick` | .10 | Visible preparation boundaries, described below | Party .70 / 75 / 1; campaign .55 / 80 / 1 |
| `go` | .35 | Party combat/boss begins, or campaign action overlay begins | Party .70 / 75 / 1; campaign .55 / 80 / 1 |
| `wave-clear` | .52 | Party enters rest | .70 / 75 / 1 |
| `victory` | .87 | Enter Won; short SFX accent, with music stopped | .70 / 100 / 1 |
| `defeat` | .74 | Enter GameOver; short SFX accent, with music stopped | .70 / 100 / 1 |
| `ui-navigate` | .065 | Deliberate selection change, including result buttons | .45 / 40 / 2 |
| `ui-confirm` | .14 | Accepted navigation, choice/setting change or covered start | .45 / 40 / 2 |
| `ui-back` | .13 | Back/leave/cancel/resume transition | .45 / 40 / 2 |
| `ui-unavailable` | .16 | New rejection/status feedback | .45 / 40 / 2 |

Core tokens use sim `PlaySound`; boss hit, windup, wave/outcome, bounce and landing
feedback use presentation `audio.play`. Rescue and boss capture retain their feel
visuals but are not played again by presentation. A simultaneous genuine item pickup
can still produce `power-up`. The shared `laser` role is intentionally retained;
separating friendly thunder, enemy attacks and bottle release into new tokens is deferred.

Party ticks occur at remaining 3/2/1-second preparation boundaries; GO occurs on the
transition into combat/boss. Existing illustrated art says Ready?/BUBBLE UP! rather
than drawing numeric countdown text. Covered introduction frames are silent. The
campaign's frozen Ready overlay instead uses its presentation timeline: three ticks
across the 90-step visible ready lead, then GO at the action overlay. Pause preserves
the current stage; a reset drops stale countdown history and cannot emit an old GO.

UI feedback compares presentation snapshots after recorded actions. Keyboard and
pointer paths share the resulting selection/screen/settings state. One feedback wins
per snapshot transition; setup, idle frames, held confirmations, covered commits,
status expiry and automatic result entry do not add sounds. Explicit result selection
can navigate audibly. UI cues use the UI bus; gameplay feedback uses SFX. All use the
saved Sound percentage and suppress new playback while muted or Sound is zero.

## Bank, memory and limits

`audio/brigade/sfx/core.bank` is boot-preloaded alongside the preserved reference and
juice banks. It contains all 26 effects and no music. Every source is mono 48 kHz
PCM16; sidecars select ADPCM and `normalize=false` to retain the authored mix.
Cooldowns are .06 seconds for shot/pop, food, landing/bounce and UI; .08 for jump;
all other cues use .10. Global voice capacity remains 24.

The authored durations total 8.635 seconds: **828,960 bytes (about .791 MiB) of mono
48 kHz PCM** when all new cues are decoded, before mixer/container overhead. This is
an incremental source-duration estimate, not a claim about total engine audio memory
or cooked download size. Original banks remain resident according to existing policy.
Music remains streamed outside banks/groups.

Illustrated mute unloads the new bank to stop its active voices, then reloads on
unmute. Leaving the illustrated palette unloads it; returning loads it before use.
Pause and introductory holds suppress new gameplay feedback. Reduced Effects changes
visual effects, while essential sounds remain enabled. The audio-only warning/outcome/
countdown edges are ephemeral and cannot evict any of the 32 persisted visual feel
cues, change camera shake, or add rendering primitives. Countdown history uses the
previously unused numeric header slot; no schema or gameplay timing change is added.

## Verification and remaining production work

All 427 V8 logic cases pass with phone-low residency enforcement. The 24 focused
cases also pass against cooked content with phone-low limits. Seven classic audio
cases retain identical per-step baseline hashes. Tests cover core routes,
restored food/explosion cues, bounded bursts, semantic rescue/capture, UI transitions,
countdown/reset/pause behavior and visual-history capacity. Presentation assertions
use append-only `audio.sounds()` intervals; sim cues use actual `PlaySound` events.
Engine check passes typecheck, validation, desktop cook and 600 cooked smoke frames.
The phone-low grouped memory report passes at 36,915,900 bytes against 201,326,592;
that report excludes boot-bank residency, so the incremental SFX estimate above is
reported separately. The mobile feedback render retains the baseline draw-budget
failure (15 against 14) and the same 18 screenshot pass/fail outcomes as untouched
parent `b084c4e`. A desktop render attempt lacks desktop goldens and reports 17
draws against the same mobile-authored 14-draw assertion; it is not a passing lane.
No goldens or visual budgets were changed. Cross-runtime comparison is unavailable
because the Hermes host is not installed. Raw diagnostics remain in ignored cache.

Technical checks establish routing and bounded playback, not auditory approval.
Actual instrument realism, ADPCM coloration, repeat fatigue, balance against music,
phone-speaker translation and low-end device audio-thread cost still need listening
or device review. These effects are procedural synthesis despite their material-like
character. Dedicated hurry/boss music, longer musical outcome stings and larger SFX
variation sets remain future production work. No standalone player, browser/OS input,
or automated speaker/DAC assessment is claimed; automated gameplay checks use Game Engine.

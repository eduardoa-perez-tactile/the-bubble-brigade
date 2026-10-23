# Enemy simplification — 23 October 2026

The cartoon cast now communicates each existing gameplay role without humanoid
leg cycles. Ground movement remains distinct from flight. Four regular families
and the boss have forty new registered drawings from built-in ImageGen masters;
the approved bat and bee wing cycles are preserved.

| Gameplay key | Design | Existing role retained |
|---|---|---|
| zenchan | Crimson Roller | Platform patrol and jump toward higher players |
| mighta | Bowler Blaster | Wheeled patrol/jumper with horizontal shot and recoil |
| banebou | Jack-in-a-Coil | One central spring; repeated hopping, higher when angry |
| invader | Clockwork Skimmer | Grounded fast travel and downward shot |
| monsta | Purple bat | Diagonal flight and rebounds |
| pulpul | Teal bee | Weaving flight and rebounds |
| boss | Crowned Bellows Dragon | Free movement, windup, projectile fan, low-health aggression, capture/finisher |

## State coverage

Single-body toy poses cover travel, support compression, airborne motion,
capture, defeat/water carry, shooting and anger. The spring uses actual Ground
and vertical velocity instead of a free-running sine rig. Shooting poses start
on the same step as existing projectiles; no new prefire wait is introduced.
A supplied stopped clock preserves freeze. Reduced effects stop cosmetic scaling
and alternating wheel drawings while retaining essential state cues.

Capture warning and imminent escape use the same folded captive drawing, with
the existing amber/red bubble-rim rules. Escape resumes the existing angry
movement. Water carries the dazed drawing; defeat follows the existing trajectory
and reward rules. The legacy internal kind IDs and reference/pixel path remain
compatible with levels, fixtures and historical evidence.

The boss has distinct move, inflated windup, open-mouth release, hit, captured
and low-health expressions. A fresh real Bottle projectile selects its release
pose; damage and aggression use the existing fields. Its 320-unit envelope is
about 2.26 times the player's 141.312-unit envelope. Bottles draw at 60 units
(previously 24), centered on their existing bodies, above actors/bubbles with
short cream/coral wakes. An amber marker announces the windup; reduced effects
retain the steady warning and large projectile. Boss art is fitted clear of the
HUD at arena edges; captured art has a visible bubble shell. These are visual
changes: movement, hitboxes, attacks, cooldowns, capture timers and RNG are intact.

## Art and reproducibility

[Registered state sheet](../../art/enemy-simplification/registered-states.png)
and [master/prompt/provenance index](../../art/enemy-simplification/README.md).
Run `python3 tools/cartoon/build-simplified-enemies.py` from the engine project.
The exporter uses one scale per family, rounded 4×2 cell cuts, shared 128px
canvases and contact y=120. Each exported sprite has a stable .gmeta GUID,
linear filtering, trimming, and the existing cartoon atlas group. Original
masters and rejected variants are source lineage, never runtime assets.

## Review and measurements

Three subagents split character art, motion/state tests, and QA fixtures; two
then independently reviewed architecture and mobile cost. The only architecture
finding was a boss freeze clock; it was corrected and covered by a test.

A separate managed checkout of d465c89, with only the deterministic showcase
cheat copied in, measured the original art against the simplified cast. Both
runs used release V8, headless mobile-tier rendering, warmed assets and identical
showcase inputs; fixture simulation hashes matched. The baseline session was
stopped and its worktree archived.

| Measurement | Original | Simplified |
|---|---:|---:|
| Draw calls, each of five showcase scenarios | 13 | 13 |
| Runtime atlas pages | 4 | 4 |
| GPU texture allocation | 101.50 MiB | 101.50 MiB |
| Sim step p95, separately stepped sample | 0.845 ms | 0.893 ms |
| Presentation p95, sampled | 1.371 ms | 1.406 ms |
| Sample-end JS heap | 44.77 MiB | 64.86 MiB |
| Final host RSS | 299.67 MiB | 336.27 MiB |

Forty added PNGs total about 615.5 KiB and add exactly 2.5 MiB of uncompressed
CPU texture data. No new pipelines, hitch steps or GC pauses above 4ms occurred
in either measured run. The existing cartoon draw-call budget is 14; wide boss
HUD samples use 15 with their additional UI batch. A separate six-hundred-step
ten-player boss capture on mobile/desktop/compat also retained identical
pixel/cartoon authoritative state and peaked at 12 cartoon draws at 768×720.
Current material pipelines were observed on all three tiers; obsolete records
for a material hash that no compiled material contains were removed.

These are local structural/CPU measurements, not phone GPU or thermal results.
Both baseline and new JS heaps exceed the default 32MiB guide; GC timing makes
single end snapshots unsuitable for attributing retained growth. A GC-aware
physical-device soak is still needed. No memory groups are declared, so the
asset-memory report's zero resident total is not usable residency evidence.

## Verification

- Full V8 T0 and before/after hash traces, including all enemy role tests.
- Real shooter, mixed-wave, capture/warning, both-facing, airborne/water/defeat
  phone-low renders; boss scale/windup/fan/capture renders across four aspects.
- Full mobile-tier phone-low T1 with explicit wildcard to bypass the installed
  CLI's unrendered structural-replay stall, as documented in the existing harness.
- Harness quick lane; typecheck, validate, desktop cook and cooked smoke.
- Existing tile/camera warnings remain. Hermes and web hosts are unavailable;
  cross-runtime checks cannot run on this installation. Original migration
  evidence and replay fixtures are immutable; only active visual goldens change.

The refreshed mobile baselines also include already committed UI styling whose
older mobile images were stale. No new menu behavior or UI source is part of
this change. Goldens are a separate reviewable commit from implementation.

### Final results and merge gate

- **402 V8 logic tests pass**; **394 of 394** pre-existing hash traces match.
  Eight new/renamed tests have no prior trace; they pass without an equivalence claim.
- The new 96-step real-shooter/mixed-wave recording verifies with no divergence.
- **87 of 97** full phone-low mobile T1 cases pass. All ten assertion failures
  were independently reproduced on unchanged d465c89 with the same installed
  engine/tier/memory flags. Two needed an isolated diagnostic golden refresh
  before their later draw assertions were reached; those diagnostic images were
  never copied into this branch. Existing assertions were not relaxed.
- Harness quick passes; final engine check passes typecheck, validation, pipeline
  coverage, desktop cook and 600-frame cooked smoke. Existing tile/camera warnings
  remain; obsolete pipeline-program warnings are resolved.
- All 268 changed/new golden images were inspected on 23 contact sheets, with
  full-resolution spot checks split across coordinator and two reviewers. Stale
  existing mobile UI baselines are refreshed alongside the intentional art changes.

| Existing failing T1 case | Same assertion on baseline d465c89 |
|---|---|
| arcade reference encoded overlays | [13,13,28] vs [8,12,27] |
| cartoon native GPU alpha | [34,64,96] vs [32,64,96] |
| cartoon feedback native effects | 15 draws exceeds 14 |
| concept checkpoint responsive rescue/boss flow | 15 draws exceeds 14 |
| cuphead intro brush lettering | 15 draws exceeds 14 |
| desktop title reference phase | [13,13,28,255] vs [8,12,27,255] |
| dragon palette GPU masks | [0,183,0,255] vs [6,183,0,255] |
| party polish countdown/rest | [13,22,42] vs [12,21,43] |
| party actual six-dragon arena | [34,66,86] vs [36,67,87] |
| pixel renderer exact texel prototype | 13 vs 11 |

Per [the Git workflow](../git-workflow.md), “Actual test failures block merging.”
The feature PR stays open for review; the known baseline failures are not called
passing coverage and no merge is performed. Their diagnosis/fix is separate from
this presentation-only enemy slice.

### Integration with updated main

Main advanced to 22f267a (courtyard animation and level preloading) during this
work. It was merged into the feature branch without touching the shared editor
checkout. The pipeline conflict was resolved by retaining observed current
records from both branches and deduplicating them. On this integrated head,
**403 V8 logic cases pass**, the **nine focused simplified T0/T1 cases pass**
without further golden changes, the 96-step recording still verifies, and engine
check passes including current pipeline coverage and cooked smoke. The full
87/97 T1 and independent d465c89 failure classification above precede this main
integration; they are not represented as a fresh full-suite pass on 22f267a.

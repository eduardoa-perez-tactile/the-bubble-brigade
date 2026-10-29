# Complete story-room rollout

The user requests all remaining room-border issues fixed and every level shown
before merge. This branch must remain unmerged until that review is complete.
Baseline is main a704f8c8, including the approved compact prototypes in PR39.

## Scope

Preserve approved levels1,2,4,5,6, including full level data and art. Recompose
remaining20 levels3,7–25 into44-column rooms with deliberately authored routes,
comfortable landing overlap and explicit enemy/pickup/wave cells. Level1 stays
40 columns. Preserve every encounter's title, theme, initial enemy kind/count
sequence and finale-wave kind/count sequence; no new gameplay mechanic is added.

Sailcloth uses the approved coherent oak frame. All garden rooms use the approved
stone/bronze botanical frame. Fair levels11–15 receive a coherent matching
carnival/workshop timber-copper frame. Springs and foundry keep their approved
bubble/pipe reference artwork while adopting compact routes. Every story theme
must select complete registered profiles; remove the obsolete modular fallback
and its unused runtime sprites so missed themes cannot silently retain old art.

Only plain shaft extensions may repeat. Preserve natural per-side pixel scale,
separate lighting, complete shoulders/feet and source-coherent floor junctions.
Keep family atlases and existing episode preload lifecycle. All game testing
uses the Game Engine; no standalone game, browser/OS input or desktop automation.

## Coordination

The implementation subagent owns level design and presentation/group routing.
The art subagent owns the fair master, deterministic import, PNG metadata and
provenance. The independent review subagent owns new rollout tests and review.
The coordinator owns legacy-test scope updates, serialized engine runs, source
preservation, the complete native review gallery and Git/PR work.

## Evidence and review

Require actual unupgraded input tours that ground on every physical shelf of all
25 levels, a full jump above the highest shelf, live recorded examples across
all five affected families, and finale arrival safety from both flanks/center.
Pin approved-five level hashes and approved art manifests to the baseline.

Capture every opening at1280x720, narrow/ultrawide for3,7,11,16,21, and native
second acts for10,15,20,25:39 images. Independently inspect all25 native rooms,
not just one room per material. Check visual mass, joins, lighting, enemy spacing,
collision cues, complete playable layout and readable HUD. Do not invent visual
similarity percentages for newly designed themes.

Supply a review gallery with all25 full native engine captures and access to
responsive/second-act images. It must never substitute generated source art for
actual game output. Preserve capture pixels; gallery controls change selection
only. Include a Markdown version usable directly in the PR and a local HTML
reviewer for full-size browsing.

Run focused V8 checks and affected captures under PROJECT.md's prototype policy.
Record actual mobile-tier/phone-low draw calls and resident memory. Existing40MiB
shared/48MiB peak target misses are open debt, not a passing budget. Full suites,
cooks, Hermes parity and physical-phone timings remain deferred unless requested.
Inspect intended visual changes before updating selected baselines; resolve
actual selected test failures. Preserve archived historical/migration evidence.

## Delivery

Use codex/story-room-border-rollout from current main, commit source/art/tests
and reviewed goldens together, push one coherent PR and attach it to the chat.
Synchronize incoming main changes and rerun affected checks if necessary.
DO NOT MERGE: the user needs to see all levels first. The main checkout is not
changed to this branch. The PR and galleries are the reviewable result.

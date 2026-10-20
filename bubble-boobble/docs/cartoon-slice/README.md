# The Bubble Brigade — playable cartoon slice

20 October 2026. Open the project in the Game Engine editor and play its default
`scenes/cartoon.scene.json`. The title leads through the existing START GAME flow.
Classic retains solo, AI companion and human co-op; the existing Bubble Madness
party selection retains ten Human/AI/Empty seats and its one-human/nine-bot default.
`scenes/arcade.scene.json` is the preserved pixel comparison scene.

## What is implemented

- An original green dragon master with idle, three run keys, jump, inflated-cheek
  shooting, hurt and downed drawings. The explicit run exposure is five simulation
  ticks per frame (12 exposures/second), independent of 60 Hz input and physics.
- Blue body color and swept crest, plus shared-master derivative party colors and
  ten small shape badges. Palette conversion preserves cream faces, eyes and ink.
- The Zen-Chan enemy slot uses a new angular imp: alternating walk poses, captured
  curl, warning pose, and a rocking/flipping escape derivative. Warning and escape
  deliberately share a furious drawing, rather than claiming separate drawn cycles.
- Hollow soap bubbles, compact owner badges, elemental cues, drawn pop and rescue
  feedback, warm platform caps, a quiet painted courtyard, title and HUD styling.
- All ten slots use the same original arena geometry, collisions and headroom.
  Presentation is checked at 768×720, 1680×720, 640×960 and 2520×1080.

Other enemy families, boss, pickups, elemental effect drawings, account screens,
mode cards and results retain legacy treatment. This is the first playable slice,
not the finished full-game reskin. Eight reviewed dragon drawings establish the
pipeline; they are not a claim of a complete 24 fps hand-drawn animation library.

## Rendering and animation contract

The cartoon path uses **native filtered Sprite batches with GPU alpha**, not the
original integer-load compositor. A shared rectangular SpriteMask clips the world.
Consecutive sprites share the named `cartoon` atlas; text is ordered above the world.
An early transparent-mesh experiment produced hundreds of draws and was removed.

`src/cartoon/plan.ts` reads authoritative state without modifying it. Frame timing,
128×128 source bounds, feet pivots `[64,120]`, muzzle anchors and identity names live
in `assets/cartoon/animation.json`. Every pose is placed from the same feet anchor;
shooting selects its drawing on the same step that the original code emits a shot.
Mirrored muzzle anchors are tested against the actual emitted bubble center.

The existing simulation pool allocates exactly the same entities and sim fields.
It additionally attaches hidden **sim:false** Sprite components. Cartoon rendering
reuses those entities, disables their meshes, and changes presentation fields in
LateUpdate. Pool exhaustion raises an error instead of dropping art or changing
simulation allocation. No gameplay, input, AI, score or progression rules changed.

The cartoon scene has the same sim-authored entities as the original, with a
presentation-only stencil and camera clear-color marker `#152a46ff`. That marker
selects the theme; `MaterialGlobals.v1[0]` exposes it to UI controllers. It does not
change the camera fit. Keep this authored marker when editing the cartoon scene.
The original pixel path, commands, fixtures, recordings and goldens remain available.

## Reproduce the art

```sh
# From bubble-boobble/; requires Pillow.
python3 tools/cartoon/build-assets.py
gameengine cook
```

The three generated source images and their SHA-256 provenance are stored here.
The build script uses reviewed crop boundaries, removes disconnected sheet
fragments, preserves alpha, normalizes feet, and exports independent frame images
with deterministic import GUIDs. It packs a master QA atlas **outside cooked assets**
and lets the engine pack production sprites. Linear sampling and lossless compression are
explicit: live and cooked images use the same sprite sampling without texture mip drift.
No ordinary-frame 60 px source limit
or CPU partial-alpha expansion is involved. Noto Sans is included with its OFL.

`normalized-poses.png` is asset QA, not an engine capture. `title-engine.png`,
`ten-player-engine.png`, cold viewport PNGs and the files under `tests/goldens/cartoon_*`
are actual engine rendering. Device sheets show isolated UI samples.

## Verification

The complete pre-edit T0 trace archive is `pre-slice-traces.tar.gz`. All 269 original
cases match their before-edit traces, step by step and system by system. The current
T0 suite adds 11 animation/renderer cases. The trace comparison also passes with
`--memory-class phone-low`.

```sh
mkdir -p .gameengine/cartoon-baseline
tar -xzf docs/cartoon-slice/pre-slice-traces.tar.gz -C .gameengine/cartoon-baseline
gameengine test --js v8 --hash-trace-baseline .gameengine/cartoon-baseline
gameengine test --js v8 --tier t1 --gpu-tier desktop --filter '*'
gameengine test --cooked --js v8 --tier t1 --gpu-tier desktop --filter '*cartoon*'
node tools/harness/viewport-smoke.mjs
node tools/harness/viewport-smoke.mjs --cartoon
node tools/cartoon/performance.mjs
gameengine check
```

All 54 desktop render cases pass, including the original 48 without golden changes. New cases prove
ten simultaneous recorded pad shooters, full-board fitting, actual contact rescue,
capture/warning/escape art, visible UI lettering, transparent bubble centers and
stencil-clipped rims. Only new cartoon goldens were created. Two new input replays
cover the full aspect route and capture/rescue route and verify in the cartoon scene.
Use an explicit scene when verifying: the installed replay CLI loses recorded scenes.

`performance-all-tiers.json` compares identical protected boss inputs, one human and nine bots,
600 measured steps after warmup, across desktop/mobile/compat. All six full game-state
digests agree. `performance.json` repeats the mobile-tier comparison after final import settings. Cartoon rendering peaks at 7 draws against 14. The mobile-tier Mac run
measured 1.61 ms p95 simulation and 8.09 ms p95 sampled presentation with UI layout;
estimated GPU texture allocation was about 52 MiB. These are paused release-host
observations, **not phone GPU, real-time frame-rate or thermal certification**.

`node tools/cartoon/performance.mjs --record-pipelines` measures all three tiers and
adds actually observed pipeline keys, preserving every existing entry. Two new
stencil/sprite keys per tier were added. Both new replay budgets retain the 14-draw
limit. Performance reports, trace summaries and preservation checks are new evidence;
the migration manifest, archive and history bundle remain immutable.

## Known limitations and next milestone

All 33 original replay outcomes are unchanged: **15 pass, 18 historical failures**.
See [the diagnosis](replay-diagnosis.md): identical fresh inputs record/play back
successfully, but the old file has no checkpoint identifying its historical writer.
The full historical harness continues to stop on that original failure. No original
recordings were regenerated to conceal it.

Hermes is not installed; the local web toolchain is unconfigured. The historical
unknown material-program key remains a release warning. Existing tile/camera
warnings remain. Phone performance, physical-controller reconnection and human
group readability have not been established. No standalone player, browser
automation, web publication or application release was used.

Next: review the moving dragon and imp at final game scale, refine run contacts and
hand/cheek acting, then bring one flying enemy and boss through this same pipeline.
Run a fresh ten-player crowd and cooked gate for each increment before expanding art.

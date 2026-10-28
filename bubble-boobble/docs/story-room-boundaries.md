# Story room boundaries

## Goal and approved direction

Make the smaller story encounters read as enclosed playable rooms within their
existing painted settings. The October 28, 2026 concepts establish stone sides
and a substantial foundation for Lantern Landing, copper pipe housings for
Pressure Trouble, and transparent bubble barriers for Tugboat Tussle.

This is a presentation slice. Preserve all 25 authored layouts, collision,
movement, enemy behavior, progression, HUD, camera ownership, Arcade and Party.
Do not modify the archived migration evidence or its manifest.

## Implementation plan

1. Create a small reusable sprite kit: masonry, timber, copper pipework and
   vegetation side pieces and foundations, plus a brass bubble emitter.
   Keep foreground silhouettes readable against the existing paintings.
2. Route each existing episode theme to a suitable kit. Use stone for the
   lighthouse, timber for the post office/sailcloth/fair, pipework for the pump
   station/foundry, vegetation for the garden, and bubble boundaries for the
   tugboat and springs. Keep bubble edges subtle but visible without animation.
3. Add episode-only boundary draws between the background and the platforms and
   actors. Their inner faces follow the collision limits: `x = 48` and
   `x = levelWidth - 48`. Floor registration follows the last tile row.
   Keep opaque geometry outside the playable interval. Do not clip the larger
   character art at collision-box edges.
4. Make side pieces continue through the reachable height without a visible
   jumpable top. Reserve a fixed 48-unit extension outside each room edge for
   96-unit wall pieces, and a 48-unit fascia below the existing platform cap.
   Fit this presentation envelope for every story room, including full-width
   episodes; retain the original framing for Party. Use shared projected
   coordinates so screen shape never changes collision registration.
5. Check geometry, theme coverage, unchanged game state and bounded sprite
   counts with focused Game Engine tests. Inspect actual engine captures of
   representative kits at narrow and ultrawide extremes, plus landscape views
   of the three approved examples. Review draw calls and texture cost.
6. Commit implementation, assets, focused tests and inspected new baselines as
   one coherent feature slice. Push `codex/fix-story-room-boundaries`, open one
   PR against this repository's `main`, and squash merge once review and the
   selected prototype checks pass. Preserve unrelated changes in the shared
   checkout and do not switch its branch beneath the active play session.

## Coordination

The coordinator owns integration, the plan, verification, visual inspection and
Git. Separate subagents own the raster kit, the presentation implementation,
and focused geometry tests/independent review. They share an isolated checkout;
file ownership prevents overlapping edits.

## Acceptance criteria

- The room limits are visible before the player reaches them.
- Opaque inner edges agree with the existing collision faces.
- Walls cover the usable vertical range; the floor has a visible foundation.
- The existing platforms, characters and scenery retain their identity.
- Narrow screens retain both boundary cues and a clear HUD; wide screens do not
  imply that the surrounding painting is playable.
- Reduced motion retains the bubble barrier cue.
- Native sprites use a small shared atlas; no new particles, post-processing,
  gameplay state or continuous idle animation are required.

## Verification policy

Follow `PROJECT.md` and the current prototype harness mode: a relevant focused
V8 selection and affected engine captures. Full suites, Hermes parity, replay
sweeps, cooks, cooked smoke, pipeline recording and physical-device performance
are deferred unless requested. Never replace old expectations to conceal an
unexplained failure. New visual baselines must be inspected before approval.

## Execution and verification — October 28, 2026

All six implementation steps completed in an isolated feature checkout. The
coordinator integrated separate art, implementation and testing subagents; an
independent mobile reviewer also reviewed the resulting slice. Both scoped
reviews approved it without blocking findings.

- `npm run harness:quick -- 'Story room boundaries*'`: two V8 T0 cases pass.
  They exercise all 25 levels at 344×882 (with a top safe inset), 1280×720 and
  2520×1080, including actual movement clamps, visible edge registration,
  uninterrupted wall height, floor/HUD clearance, reduced effects, unchanged
  game state and Arcade/Party exclusion.
- Final `gameengine test --tier t0,t1 --js v8 --filter 'Story room boundaries*'
  --gpu-tier mobile --jobs 1 --json`: all three selected cases pass, including
  13 render comparisons. All 13 new images were visually inspected before
  targeted approval; no historical golden or replay was rewritten.
- Captures cover lighthouse, pump station and tugboat at all three sizes, plus
  timber and vegetation at narrow and ultrawide extremes. The narrow bubble
  edge was widened to six world units after inspection; it stays outside the
  collision face. The final three bubble captures were inspected again.
- Measured peak: **15 native draw calls**, below the existing Adventure limit
  of 50, on Apple M2 Max/Metal, mobile tier, phone-low residency. This is host
  rendering evidence, not a physical-phone frame-time measurement.
- Computed added geometry: at most **19 sprite quads** across the current
  levels at the reviewed screen extremes. Nine runtime images total
  **625,014 bytes PNG / 1,007,616 bytes RGBA** (0.961 MiB before atlas padding).
  They share the existing environment atlas. Generation prompts, source art,
  hashes and reproducible import are in [art provenance](story-room-boundaries/art/README.md).
- Full `tsc --noEmit` was attempted. It reports four existing errors in
  unchanged `tests/adventure-compact.test.ts:200,208` and
  `tests/overworld-weather.test.ts:90,92` (three safe-area tuple arguments and
  one nullable string). The new source and test file report no type errors.
  Those unrelated test files were left unchanged.

The new baselines are under
`tests/goldens/story_room_boundaries_show_all_five_materials_on_phone_low_at_narrow_native_and_ultrawide_sizes/`.
Older story composition baselines were not swept or refreshed. Full-suite
status, Hermes parity, cooked behavior, pipeline records, device GPU timing,
thermals, total overdraw and packed atlas residency remain unverified under the
prototype policy. No standalone app, desktop input or browser automation was used.

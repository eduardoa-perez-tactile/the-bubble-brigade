# Reconstruction verification contract

The baseline is commit `2ba8d1e563222ea02ed0cf0bb61fbe49d6342989`: 305 V8 T0 tests pass with a hash checkpoint at every engine step. Prior evidence, all 45 existing recordings and the protected original pixel golden files are inventoried in `preservation-baseline.json`. New reconstruction evidence and recording names stay separate.

The reference is measured in `reference-layout.json`. The native engine comparison capture is 1536×864. Only the reference is normalized from 1672×941; gameplay pixels are never resized or warped to conceal drift. Each cap top/end and parchment rectangle edge has a 4px hand-painted-edge tolerance. The tiny top grey-stone separation is decorative; warm-only masks and actor occlusion are insufficient evidence of a gameplay gap.

The opted-in simulation floor moves from row 23 to 22 while original controls and 126px jump remain fixed. Approved tier rows are 3/8/13/18/22. Their canonical presentation anchors are 194/305/413/519/612 logical pixels. The piecewise projection must be continuous and strictly monotone, with a documented inverse over the tier range and extrapolated jump range. Uniform sprite images anchor to projected collision feet; their bitmaps are not vertically warped. Character/animation source bytes remain unchanged.

Focused proof will check:

- Real unupgraded ascent, diagonal/gap routes, a missed-jump recovery and navigation/spawn safety under the new floor, while the original 280 traces retain zero allowances.
- Forward/inverse projection at every tier boundary and densely sampled between boundaries; continuity and monotonicity above the crown and below the floor.
- Feet/centers and uniform actor scaling at each tier and action pose. The real first visible emitted bubble must align meaningfully with the source mouth in both directions; an enlarged sprite is not justification for silently loosening the shot gate.
- Actual crown jumping drives the adaptive uniform zoom, anchored at the floor. All actor alpha, identities, HELP and playable geometry remain visible; landing returns to the canonical composition. Repeated jumps and independently repeated playback must agree. Presentation planning may not mutate GameState.
- A deterministic recorded reference fixture with explicit poses and world positions, rather than a reskinned arbitrary combat screenshot. Actual engine-query cap/header/footer anchors accompany the native capture.
- 50% overlay, absolute difference and matching crops for header, each tier, background focal area and footer. Image difference is diagnostic; preserved actor drawings intentionally differ from the illustrated source. Geometry is unverified when no actual engine anchors are supplied.
- Four desktop aspects plus the required narrow fold, notched iPhone and tablet presets, using actual DPR, safe insets, native Sprite alpha/rotation and live UI rectangles.
- Existing fire/capture/pop/rescue/wave/boss/results/restart flows and UI actions, draw limit 14, phone-low residency, cold live viewport, then the root's cooked engine check. Physical-device timing, thermals and human readability remain separate limitations.

`tools/harness/reference-layout-compare.py --actual <native-engine.png> --actual-anchors <engine-query.json>` produces the layout checks and review crops. The before-comparison folder is diagnostic evidence against the prior committed game; it explicitly makes no geometry-pass claim.

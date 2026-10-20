# Full cartoon content audit

The initial vertical slice's atlas has 295 frame identifiers: 80 dragon poses, five imp identifiers, bubble/pop/shadow/platform/wall, ten identity badges and **195 legacy frame aliases**. Those duplicate cartoon-atlas aliases were removed by this overhaul; the actual original assets remain untouched for the pixel fallback. The completed cartoon route emits none of them.

## Required gameplay coverage

| Content | Required state or variant coverage |
| --- | --- |
| Six enemy families | `zenchan`, `monsta`, `mighta`, `pulpul`, `banebou`, `invader`; walk, angry, defeated/carried, captured, warning, escape; mighta shooting and angry shooting |
| Boss | Moving, windup/attack, captured; bottle projectile and thunder damage/capture state |
| Fruit | All 25 campaign fruit identities; party per-wave reward mapping |
| Powerups | Pink/blue/yellow candy, shoes, orange/red/purple parasol, crystal/amethyst/ruby ring, dynamite, clock, thunder potion |
| Bubbles | Hollow ordinary and elemental bubble, shooter identity, trapped enemy, warning/escape, expiry, downed teammate/rescue |
| Effects | Pop, fire/water/thunder, grounded flame, boulder and laser; bounded rescue burst |
| Players | Ten controlled identities; idle/run/jump/shoot/hurt/down; consistent feet/muzzle anchors and mirror behavior |
| Arena | New opt-in cartoon geometry, painted scenery, readable platform caps and solid walls; original pixel geometry retained |

The tests in `tests/cartoon-content.test.ts` exercise every family and captured state, every fruit/powerup and each boss/effect/projectile branch. They reject emitted `legacy/` paths, missing atlas entries, nonfinite bounds and mutation of authoritative game state. This is content completeness and semantic coverage; actual engine captures still determine composition and visual quality.

## Required menu and transition coverage

Title, main menu, mode selection, party lobby and ten slot selectors, profiles, new profile, scores, settings, help, credits, editor, countdown/play, pause, defeat/result, campaign victory, party boss capture and victory. The UI keeps its existing action keys; recorded input supplies the cartoon geometry opt-in before gameplay requests. Both pointer actions and keyboard/controller confirmation must reach the same request path.

Native, wide, tall and ultrawide views must show the entire playable board, HUD and controls. Enemy/element/item sweeps need actual rendered examples; successful code-to-atlas mapping alone cannot establish readable silhouettes, alpha or sorting.

## Baseline and immutable evidence

Immediately before new geometry/control dispatch changes, all **280 existing V8 T0 tests passed**, with checkpoints every step in ignored `.gameengine/cartoon-overhaul-baseline/`. Raw result: `.cache/cartoon-replay-audit/overhaul-baseline.json`. New overhaul tests were excluded from this capture because their required new assets did not exist yet.

The preceding committed slice evidence remains under `docs/cartoon-slice/`. Its preserved replay audit establishes 15 passing original recordings and 18 historical failures, all matching the pre-migration archive. New geometry intentionally changes simulation state only on the explicit cartoon request; identical hashes are required on equivalent original pixel routes, not claimed across different layouts. Original replay, golden and migration artifacts must remain unchanged.

## Final engine verification

Run the original logic, render, oracle and explicit-scene replay gates; classify new recorded-theme/geometry trace changes separately from original behavior. Run new all-content T0 checks and full-flow T1 tests on `phone-low`, inspect actual captures, record separately named new replays and verify them. Then run cold viewport probes, structural/performance probes, cooked tests/smoke and `gameengine check`. Measure CPU/presentation, draws and texture residency on identical stress input; host results do not establish physical-phone GPU or thermal performance. No standalone build, OS input or browser automation is part of this workflow.

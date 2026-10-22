# Gameplay and animation integration verification

22 October 2026. Integration of `codex/gameplay-feel-and-bubble-fixes` into this repository's `main`.

The complete phone-low V8 logic suite passes (381 tests). A broad logic/render run passed 453 tests and failed 10; the remaining branch-specific failure was a stale score-text positioning assertion, corrected and verified separately. All changed gameplay/render scenarios pass focused checks, including the full native animation, shell growth, bounce, capture, reward and responsive UI coverage. Structural scenarios remain within 14 draw calls. Reviewed goldens accompany the intentional visual changes. Game Engine check passes typecheck, validation, desktop cook and cooked smoke.

The broad suite is **not fully green**. Nine failures reproduce with identical messages on the untouched original `main` (`a15432b`) and pre-latest-fix branch (`977b010`), using isolated Git snapshots with the same installed engine:

| Inherited test | Failure |
|---|---|
| arcade reference encoded overlays | pixel RGB 13,13,28 vs 8,12,27 |
| cartoon native GPU alpha | pixel RGB 34,64,96 vs 32,64,96 |
| desktop title animation | pixel RGBA 13,13,28,255 vs 8,12,27,255 |
| dragon palette GPU masks | pixel RGBA 0,183,0,255 vs 6,183,0,255 |
| party polish countdown | pixel RGB 13,22,42 vs 12,21,43 |
| party actual six dragon arena | pixel RGB 34,66,86 vs 36,67,87 |
| pixel renderer exact texel prototype | 13 draws vs 11 |
| party boss soak | FLIP mean 0.0022, max 0.979 |
| desktop complete presentation / party victory | FLIP mean 0.0012, max 0.970 |

These expectations were preserved rather than relaxed or blindly regenerated. Original main's full native suite had 43 passes/19 failures; `977b010` had 54 passes/23 failures. The final integration fixes the additional stale branch snapshot/geometry expectations while retaining meaningful contact, HUD, identity, knock-star and scoring assertions. Diagnostic logs and machine-local comparison artifacts remain in ignored `.cache/`.

Hermes remains unavailable because the installed engine has no Hermes host. Existing tile/camera warnings and obsolete material-program pipeline recording remain; release pipeline recording is still required before shipping. Real-device GPU/thermal measurements were not performed. A minor transient GO banner/header overlap observed in a capture scenario is recorded as a presentation follow-up; no unrelated redesign was included.

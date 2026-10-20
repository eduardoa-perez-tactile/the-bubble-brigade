Six-player Wave Survival now uses elastic bubbles, capture and burst feedback, dragon recoil and landing poses, clearer player/rescue markers, themed arenas, and stronger boss and team celebrations. Simultaneous shots and pops are coalesced into bounded, prioritized audio cues; a saved Full / Reduced effects setting controls decorative motion and camera shake.

The pass preserves movement, collisions, boss damage, rescue rules and score multipliers. It includes original reproducible mono sound assets, bounded presentation-only history, updated UI documents, inspected render baselines, and refreshed replays. Classic retains its reference arena art and sound ordering.

Validation on macOS / Apple M2 Max, native Metal / V8:
- 271 regression cases pass; final 39 render cases and focused phone-low/mobile captures pass.
- All 24 saved replays verify, including the new capture/rescue/boss/results route.
- Pipeline capture covers 262 rendered frames per tier: peak 11 / 9 / 9 draws on desktop / mobile / compat, within the 14-draw budget.
- Typechecking, asset validation, desktop cook, cooked smoke, audio provenance, and patch whitespace checks pass.
- macOS arm64 probe build packaged; archive integrity, ad hoc signature and exact packaged startup/menu checks pass.

Hermes verification remains unavailable because its host binary is not installed. The pre-existing packaged-engine built-in Standard program hash warning remains after pipeline capture; no warning was suppressed. Headless checks do not establish physical-device GPU timing or thermals.

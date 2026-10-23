# Defeat card implementation notes

The dedicated `CartoonDefeat` view follows the tall silhouette, portrait circle, restrained double rule, progress track and stacked text actions of the Cuphead Death Cards collection. Direct inspected artwork reference:

`/Users/eduardoleale/workspace/art/cuphead/extracted/hud-elements/97983-death-cards/Cuphead/Death Cards/death_card_bg.png`

The collection index is `/Users/eduardoleale/workspace/art/cuphead/collections/97983-death-cards.md`. The reference establishes artwork only. Our plain original cream field and muted green rule are geometric UI document elements. Portrait artwork is our existing `cartoon/frames/dragon/<skin>/idle-0`. Cuphead pixels have not been imported into production.

The 440 × 650 reference-pixel card fits the project's existing 768 × 720 fit canvas. It remains centered inside the safe area on portrait, square and wide screens. Its circle, context and reached-stage line yield to the full ten-entry ranking when Details is chosen. Stacked text actions retain identical positions in both states. Selection changes text to muted red and adds a chevron; pointer presses shift the lettering slightly. No continuous animation runs on this screen.

RETRY RUN keeps the existing full-run reset semantics. Progress shows completed stages: previous completed rounds divided by 25 in Classic, previous completed waves divided by 10 in Madness. The label explicitly names the stage reached; it makes no claim about partial boss damage. Details changes presentation only. MAIN MENU retains the existing leave intent. All three actions remain gated by the existing result-neutral input boundary; the view also ignores pointer intents while resultReady is false. There is no animation callback that can restore input early.

The view uses the engine stack scrim over the frozen arena, with no opaque full-screen paper backing. It is separate from victory's podium and celebration. Timing of the preceding defeat cue belongs to the controller's presentation flow. Cuphead timing/input behavior has not been measured, and this implementation does not claim it reproduces those timings.

Verification lives in `tests/cuphead-defeat.test.ts`: honest progress values, five screen shapes, touch-action bounds, Details/back retaining ten team entries, and a phone-low draw-call ceiling. The coordinator runs integrated engine checks, replays and pipeline recording after integration.

## Companion victory surface

`CartoonResults` now exclusively previews victory samples. It has a muted blue theatrical field and static crossed radial light beams drawn as original UI document elements, with a pale celebratory headline and compact score. It keeps the existing three-dragon podium, remaining ranking entries, and PLAY AGAIN / MAIN MENU intents. Source artwork comparison: `/Users/eduardoleale/workspace/art/cuphead/previews/161855-win-screen.jpg` and the original `winscreen_bg.png` under `/Users/eduardoleale/workspace/art/cuphead/extracted/menus/161855-win-screen/`. The radial background and changed hierarchy are implemented; the Rye display font remains an approximation and is not claimed to replace authored Cuphead-like celebratory brush lettering. No new ratings, score categories, timing observations or game rules were invented.

Measured engine verification: defeat T0 and T1 pass on the V8 release host, on mobile GPU tier / phone-low memory. The death card uses eight draw calls at 768×720, 1680×720, 640×960, 904×2316 and 1620×2160. Engine UI presses open and close Details without changing the ten entrants. Normal desktop and paired portrait-phone/tablet view renders report no layout warnings. Hermes verification was attempted but the local application has no Hermes host binary; this is an environment limitation, not a passed lane.

Companion victory T1 also passes on the V8 release host with phone-low memory: four draw calls at each of the same five shapes, two safe actions, ten preserved team results. Final victory view render is warning-free and was visually inspected after correcting ray pivot/bleed.

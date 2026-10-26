# Theatrical results redesign — 23 October 2026

The previous results screen kept a leaderboard-first composition and undersized cast. This pass rebuilds the composition around the supplied Cuphead screenshot: an oversized single-line outcome title, a large original Brigade dragon on the left, a charcoal illustrated tally plaque and ribbon on the right, and a painted blue theatrical background.

The main screen displays actual run data: team score, cleared waves, total knockouts and the leading dragon. Classic mode displays its own score, cleared rounds, player and personal best. No untracked time, grade, health or parry statistics are invented. The hero represents the Brigade; the board separately identifies the actual score leader.

**Team Details** opens the complete ranking, including all ten players, with names, input modes and knockout counts. Back returns to the illustrated main results without changing the run. Pointer hit testing uses the native UI; keyboard/gamepad left and right move between the three actions, Enter/A activates, and Back returns from details. The existing neutral-input gate and boss curtain-call timing remain in force.

The screen is authored in `ui/docs/cartoon-victory.ui.json` and its metric, ranking and action widget documents. `src/cartoon/results-model.ts` adapts existing completed-run values; the thin view forwards properties and intents. A short native entrance fades the scene while the hero and plaque settle from opposite sides. The screen has no continuous idle animation, and reduced-motion settings use the engine's existing reduced-motion policy.

## Original art

All four assets were created with built-in imagegen, using the Brigade dragon source sheet for character identity. The Cuphead screenshot supplies composition and hierarchy; Cuphead character or UI pixels are not shipped.

| Asset | Production path | Normalized size |
|---|---|---|
| Dragon hero | `assets/cartoon/ui/results/hero.png` | 847 × 1024 |
| Rectangular nine-slice frame | `assets/cartoon/ui/results/scoreboard.png` | 512 × 512 |
| Painted theatrical field | `assets/cartoon/ui/results/backdrop.png` | 1536 × 864 |
| Single-line illustrated title | `assets/cartoon/ui/results/title.png` | 1536 × 374 |

Transparent bounds were cropped and assets resized for engine import; no metrics are baked into artwork. Text remains editable and live. The `.gmeta` files preserve alpha, use linear filtering, and put the illustrations in a named results atlas. Exact prompts are in `art-prompts.json`.

## Verification

- `tests/victory-composition.test.ts` checks actual values, ranking preservation, pointer navigation, keyboard navigation, main-screen bounds and ranking containment within the plaque. Engine goldens cover standard, wide, ultrawide, portrait, notched phone and tablet shapes.
- The new phone-low results test peaks at **6 draw calls**. This is a headless structural measurement, not a physical phone frame-rate claim.
- Existing boss-finale, complete illustrated flow, and responsive rescue/boss/restart render tests also pass with updated results goldens.
- `tools/cartoon/probe-victory.mjs` plays both the results-navigation replay and the boss-finale replay through the public Game Engine protocol on desktop, mobile and compat tiers, probes rendered frames, and captures actual pipeline variants. Its local diagnostic report is generated as `engine-probe.json` and is not shipped.
- No standalone game, browser automation or OS input is used. All playtesting uses Game Engine tests, input recordings and headless viewports.

Final verification: all **433 V8 logic tests** pass, the new UI replay verifies **175 steps**, the seven-shape results/navigation render test passes, and `gameengine check` passes typecheck, UI validation, pipeline validation, desktop cook and cooked smoke. The engine-probe report also covers the existing boss-finale flow on all three GPU tiers.

## Frame and title style revision

Following art-direction feedback, the title and plaque were redrawn with built-in imagegen using the existing hero as the style reference. Warm ivory storybook serif lettering replaces the glossy orange block title; a flat cream inked rim and simpler parchment ribbon replace the beveled gold frame. Both results views reuse the revised plaque. Their paths and import dimensions are unchanged. Exact edit prompts and reference paths are in `art-revision-prompts.json`. Alpha bounds were normalized before import, including removal of nearly transparent generator margins.

The seven-shape phone-low engine render/navigation test passes with the same 6-draw-call UI budget, and `gameengine check` passes. These are headless engine checks, not physical phone GPU measurements.

## Rectangular adaptable frame

The curved plaque and attached ribbon have been replaced by a simple square source panel: warm ivory/ochre inked parchment rim, softly rounded corners, straight sides and charcoal center. Its 512 × 512 source uses native 48-texel nine-slice borders; both UI documents render it as an element background rather than stretching an icon. Corners preserve their size while edges and center adapt to wide and tall containers. The outcome is now ordinary live text below the score divider, with no baked ribbon to align. Score content and ranking use more of the rectangular interior. The source occupies 262,144 texels instead of the previous 732,160. The generation prompt is `rectangular-frame-prompt.json`.

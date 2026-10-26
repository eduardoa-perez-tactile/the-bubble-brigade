# Boss encounter and curtain call — 23 October 2026

The illustrated boss encounter now teaches canister collection and the shoot → jump into bubble → lightning sequence through a persistent conditional instruction, glowing pickups, large gold lightning symbols and broad cream/gold bolts. Shooter colors remain intact. The original seven-projectile collision pattern is rendered as inked horizontal fireballs with short wakes and the fire sound.

The dedicated `cartoon-boss` UI document replaces the ordinary header during this fight. Its centered health track eases between values while its numeric label shows the actual integer HP. The normal header leaves over 450 ms and the boss header enters over 650 ms. Breathing, stronger windup compression, hit response and release recoil animate the existing dragon art. Reduced effects retains static cues and the same information.

At zero health, hazards clear and the captured dragon settles toward the floor. A two-second minimum makes the finishing instruction readable before contact can pop it. The finishing touch awards the kill and bonus exactly once. A protected four-second curtain call plays the victory fanfare, stops combat music, shows original illustrated lettering, fireworks and celebrating dragons. The final 750 ms fades to black; the redesigned results screen fades in over 500 ms. Held gameplay buttons cannot skip the ovation or activate results. The old additional Bravo overlay is skipped for this party victory. Legacy pixel-mode finishing timing remains intact.

Results use the local Cuphead win-screen reference's theatrical field and illustrated outcome hierarchy, adapted to the Brigade cast. All ten dragon rankings remain accessible through Team Details alongside Play Again and Main Menu. Reference artwork was inspected, not imported:

- User-supplied Cuphead results reference (`161855-win-screen.jpg`)
- `docs/ui-ux-cuphead-proposal/VISUAL-REVISION-2.md`

## Original assets

Built-in imagegen produced both transparent assets. Engine texture import limits the fireball to 128 px and victory lettering to 1024 px; both join existing named atlases.

- `assets/cartoon/ui/cues/brigade-victory.png`
- `assets/cartoon/frames/boss/fireball.png`

Victory prompt:

> Use case: illustration-story. Asset type: production transparent game UI lettering. Create ONLY the exact words "BRIGADE VICTORY!" as a single wide hand-lettered outcome cue for a 1930s rubber-hose cartoon dragon game. Oversized irregular condensed capitals, playful shared rising baseline, cream white faces, bold dark ink outline and offset dark shadow, warm golden underside accents. Energetic sweeping silhouette and exaggerated exclamation point. Professionally hand inked, clean readable at small size. Two lines: BRIGADE above VICTORY! Centered, tight compact composition with generous transparent margins. No characters, no scenery, no panel, no extra text. Actual transparent background.

Fireball prompt:

> Use case: illustration-story. Asset type: single production game sprite on actual transparent background. Draw one compact flying FIREBALL aimed horizontally to the RIGHT, in clean 1930s rubber hose cartoon ink style. Large rounded blazing yellow-white core on the right, pointed orange and red flame tail sweeping to the left, bold dark irregular ink outline. Flat hand-painted color, readable silhouette, no glow haze outside the ink shape. Side view, centered with transparent margins on all sides. Aspect about 2:1 wide. No text, no characters, no scenery, no multiple frames, no panel. It must unmistakably look like a dragon fireball flying right, not an upright candle flame.

## Engine verification

`tests/boss-finale.test.ts` covers the protected capture/finish timeline, conditional instructions, one-time fanfare, stopped combat music, and render states across 640×960, 768×720, 1680×720 and 2520×1080. The visual flow is recorded in `tests/replays/boss_finale_canisters_lightning_capture_celebration_and_results_fit_every_screen.greplay`. Its images are under the matching `tests/goldens/boss_finale_…` directory.

Before this change the existing boss phone-low render scenario peaked at 15 draw calls; it now peaks at 16. The dedicated HUD has a 17-draw ceiling. The new finale render flow also peaks at 16. The explicit replay probe measures 16 draws on mobile/compat and 18 on desktop, and records their pipeline variants. Local diagnostic reports are generated separately and are not shipped. The structural replay ceiling is 18 across tiers. These measurements are from the headless Game Engine on Apple M2 Max with phone-low content checks, not physical phone GPU/thermal measurements.

Hermes comparison was attempted but its host binary is absent from the installed engine. All 433 V8 logic tests pass. The new replay verifies all 297 recorded steps. UI-document validation, rendered phone-low checks and the cooked desktop smoke check also pass. No standalone player, browser automation or desktop input was used for playtesting.

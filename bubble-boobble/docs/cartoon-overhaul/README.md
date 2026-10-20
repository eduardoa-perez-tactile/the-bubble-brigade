# The Bubble Brigade — complete cartoon presentation

The default `scenes/cartoon.scene.json` now presents the complete game in the new art style. Start the project through the Game Engine editor or a headless session; Classic and Brigade Survival both opt into the new arenas through recorded UI input. The original `scenes/arcade.scene.json` remains the pixel comparison, with its original campaign, fixtures and recordings.

The user explicitly authorized arena redesign on 20 October 2026, preserving controls and core rules. The new 36×18 arenas use four curated upper-platform patterns, stable lower spawn shelves and ten safe spawn positions. Classic preserves all 25 rounds' metadata, enemy identities/counts and progression. Local party mode preserves human/AI/empty slots, rescue, waves and boss rules. Custom editor playtests retain their authored geometry. No networking was added.

## What changed

- Separate native, filtered, GPU-alpha sprite rendering now covers every gameplay art branch. The completed cartoon manifest has **244 original frame identifiers and zero legacy pixel aliases**.
- Twelve dragon masters: awake/blink, four run poses, rising/falling jump, two crouched shooting poses, hurt and down. Ten controlled color identities share these masters; blue retains a second crest silhouette. Feet are normalized to `[64,120]`; shooting muzzle to `[100,80]` for the 64-world-unit draw envelope.
- Six enemy families each have two walking masters, a captured master and a furious master. Angry/warning/escape and shooting use explicitly documented derivatives of that furious master; defeat rotates the captured master. They are not independent hand-drawn cycles. Boss movement, attack, capture and bottle art are replaced too.
- All 25 food identities, 13 powerups, fire/water/thunder/flame, boulder and laser are original cartoon drawings. Transparent bubble rims, expiry warnings, shooter symbols, pop and rescue feedback complete the combat presentation.
- A quiet painted courtyard, inked masonry walls and continuous warm cream platform caps replace the old environment treatment.
- Original illustrated title lettering, theatre-paper framing, Rye display and Bree Serif body fonts cover title, main menu, mode selection, party setup, profiles, name entry, scores, settings, help, credits, editor, HUD, pause and results. The team roster shows portraits, names and live role/rescue status.
- Animation uses action clocks. Real player movement advances `WalkFrame` while leaving `VX` zero; cosmetic motion history now observes that counter, so actual running animates. Shoot input immediately selects its action clip; no anticipation delays a projectile. Gameplay animation holds while paused.

## Artwork and provenance

`./sources/` holds the original generated masters for dragons, crouched shooting, six enemy families, boss, food, powerups, effects, masonry, courtyard and title logo. They were produced with the built-in image-generation tool for this project, inspected, sliced and normalized. They are not downloaded Cuphead sprites.

`tools/cartoon/build-assets.py` deterministically segments whole alpha silhouettes in reviewed sheet order, records their exact source boxes, removes neighboring fragments, aligns/filters them, applies controlled identity recolors, and exports native frame PNGs and deterministic GUID sidecars. The script also preserves the established code-native bubble, identity badge, shadow and pop artwork. `source-slices.json` records the reviewed cutouts; equal grid cells are deliberately not assumed because generated sheets drift. `pickup-catalog.png`, `normalized-poses.png` and `normalized-atlas.png` are inspected QA sheets, outside cooked assets. The title logo and UI paper are standalone UI artwork.

The user supplied [Cuphead's Spriters Resource collection](https://www.spriters-resource.com/pc_computer/cupheaddontdealwiththedevil/) and [Game UI Database reference](https://www.gameuidatabase.com/gameData.php?id=129). The accessible Main Menu, Miscellaneous Menus and Common HUD listings were inspected for hierarchy and treatment; asset ZIP requests and Game UI Database returned HTTP403. No downloaded Cuphead pixels were incorporated.

Rye and Bree Serif were obtained from the official Google Fonts repository: [Rye](https://github.com/google/fonts/tree/main/ofl/rye), [Bree Serif](https://github.com/google/fonts/tree/main/ofl/breeserif). Their SIL Open Font License files are retained beside the fonts in `assets/cartoon/fonts/`. The original pixel assets and source attribution remain intact.

## Reproduce

Run engine/npm commands from `bubble-boobble/`, Git from the repository root.

```sh
python3 tools/cartoon/build-assets.py
gameengine test --filter 'cartoon *' --memory-class phone-low
gameengine test --tier t1 --gpu-tier desktop --filter 'cartoon overhaul *' --memory-class phone-low
node tools/cartoon/overhaul-performance.mjs --all-tiers
gameengine check
```

Only intentional new golden changes may use `--update-goldens`, restricted to new cartoon test names. Original migration evidence, source-history bundle, original replay files and original pixel goldens must remain unchanged.

## Verification and limits

All 292 current V8 logic tests pass. Every recorded step of the 280 pre-overhaul baseline tests remains hash-identical, with no component, document, transform or RNG allowances. A separate preservation audit confirms 1,625 protected original files remain unchanged. New control tests cover explicit recorded opt-in, original default requests, all 25 rounds, safe ten-player spawns and actual move/fire/jump/pause behavior. New content tests cover all frame mappings and reject missing/legacy art or mutation of authoritative game state. Full-flow render tests cover all menu routes, native/wide/tall/ultrawide framing, ten human starts, complete content sweeps, actual contact rescue and settled boss victory.

Final engine evidence: 292 logic tests; all 280 pre-overhaul traces identical; 57 render cases, including all 48 unchanged original pixel goldens; three new checkpoint replays verifying 302 steps; both cold viewports; and all33 original replay outcomes matching the archive (15 pass, 18 historical failures). Final machine-readable test, trace, preservation, performance and cooked-check reports are saved alongside this document. `performance.json` describes its exact headless-host scenarios and sampled CPU/presentation costs; it is not physical-phone timing. The existing 14-draw limit is retained. Large standalone backgrounds have a phone-low resolution override. The nine active stress runs used 10 steady draws and at most 11 content draws; host simulation p95 was 1.67–2.13ms and presentation p95 7.64–9.28ms. Normal first-combat peak fell 36.65→3.57ms after moving existing navigation warm-up into preparation. Some host heap samples exceed the generic 32 MiB low-end guidance; consult `review.md` before interpreting these numbers as device readiness.

Historical replay divergence and stale material-program pipeline warnings are documented in the preceding `docs/cartoon-slice/` evidence. Do not interpret those historical failures as new regressions or blindly regenerate them. Hermes availability, actual phone GPU frame time/thermals, physical controllers and human group readability require their corresponding environments. This work uses engine-only verification, without standalone playing, desktop input or browser automation.

# Current art audit — 20 October 2026

## Scope and evidence

This is a filesystem census, manifest and rendering-code audit, plus visual inspection of the assembled animation-state catalog and selected stored engine screenshots. It is **not** an individual frame-by-frame animation quality review or a new live playtest. No runtime, source asset or simulation changes were made. Stored engine goldens establish the existing appearance; they do not prove that a new reskin runs or that current OS input behavior works.

The census excludes `.gameengine`, `.cache`, `node_modules`, `.git`, and this investigation's generated outputs. It covers asset files, stored screenshots, build QA evidence, reference captures and the courtyard SVG. It counts actual files including untracked/ignored build artifacts, rather than assuming every image is game art.

Deliverables:

- [Complete file census, JSON](asset-inventory.json), [CSV](asset-inventory.csv): path, file bytes, raster dimensions and image mode.
- [All 95 animation/item entries](animation-inventory.json): source paths, frame counts and every source-frame dimension.
- [Current art catalog](current-art-catalog.png): representative first frame of each manifest entry plus all 25 tiles; nearest-neighbor enlargement preserves pixel structure.
- [All 284 atlas entries contact sheet](all-atlas-frames.png): an inspection aid covering every packed frame; not a claim that every frame has been individually reviewed.
- [Current gameplay evidence contact sheet](current-gameplay-evidence.png): selected stored engine captures; includes title, Classic, ten-player courtyard, wide/portrait fits and an explicit six-slot boss scenario.
- [Current ten-player courtyard](current-ten-player-courtyard.png): unchanged copy of the 768×720 desktop Metal golden in `tests/goldens/courtyard_full_arena_and_ten_identities_fit_native_wide_tall_and_ultrawide_windows/courtyard_768x720/desktop/metal.png`.

## What art actually exists

At census time: 674 image/font/audio/model files: 642 PNG, 2 JPG, 22 WAV, 5 YM, 1 TTF, 1 SVG, 1 glTF. These include 293 test golden PNGs, 54 files under `artifacts/`, and 24 build QA captures. Those screenshots are evidence, not additional sprite designs. The game-owned `assets/` tree contains 300 files of these types: 286 reference media, 7 added audio cues, 6 pixel-renderer image/model files and 1 current branding image. Sidecars, JSON configuration, shaders and UI documents are outside that media count.

There are **265 source PNGs under `assets/reference`**, and all 265 are present in the production atlas. The name “reference” is misleading: these are active rendering sources, not an unused inspiration folder. `data/sprites.json` contains **95 entries and 239 distinct source frames**. The atlas adds the 25 tiles and original logo to those 239 frames.

| Category | Source PNGs | Existing states / dimensions |
|---|---:|---|
| Green dragon | 19 | Walk 7, jump 4, shoot 4, dead 4; 16–19 px wide, 17–19 px high |
| Blue dragon | 19 | Same state/frame counts and dimension range |
| Zenchan | 21 | Walk 4, angry 4, dead 4, bubble/warning/escape 3 each; 16–19 × 16–19 px |
| Monsta | 18 | Walk 2, angry 2, dead 5, bubble/warning/escape 3 each; 16–18 × 17–19 px |
| Mighta | 33 | Walk 5, angry 5, dead 4, bubble/warning/escape 3 each, shoot 5, shoot-angry 5; 16–25 × 16–19 px |
| Pulpul | 21 | Walk 4, angry 4, dead 4, bubble/warning/escape 3 each; 16–19 × 16–19 px |
| Banebou | 19 | Walk 3, angry 3, dead 4, bubble/warning/escape 3 each; 16–18 × 16–19 px |
| Invader | 17 | Walk 2, angry 2, dead 4, bubble/warning/escape 3 each; 16–19 × 18–19 px |
| Food | 25 | One frame per pickup; 11–16 × 13–16 px |
| Power items | 12 | Candy 3, parasols 3, rings 3, shoes, dynamite, clock; 8–15 × 9–16 px |
| Bubbles / projectiles / elemental effects / pop | 35 | Normal bubble 4, warning 2, elemental bubbles 9, pop 1, water 1, thunder 3, fire 3, flame 6, boulder 4, laser 2; smallest flame 5×3, thunder 34×58 |
| Classic tiles | 25 | 22 at 16×16, two at 15×15, one at 14×14 |
| Original title logo | 1 | 450×324 RGBA |
| **Total reference PNGs** | **265** | Every file is packed, though packing alone does not prove every frame is reached by gameplay |

Additional visual material:

- `assets/branding/bubble-madness-logo.png`: 1477×1065 RGBA, used by `ui/docs/desktop-menu.ui.json`. Pink hand-drawn lettering, yellow bubble cloud and thick dark outlines; this is already a higher-resolution exception to the sprite art. `desktop-shell.ui.json` retains a binding to `reference/logo` for its logo-capable shell, so the old logo remains a configured asset even though the main title uses the new branding.
- `assets/pixel-renderer/atlas.png`: 2048×1024 RGBA, 284 rectangles: 265 reference frames, 12 derived boss frames, 4 derived menu circles, 3 solid swatches. This duplicates source content in a render-ready atlas; it is not 284 independent original designs.
- `circle-0.png` through `circle-3.png`: RGB 20×20, 30×30, 40×40, 50×50; crops of a pinned Go menu capture, used behind menu art.
- `tools/port/sources/super-drunk.png`: 384×144 source sheet. Twelve atlas rectangles: move 4, attack 2 (reused move poses), captured 4, bottle 2. Boss body frames are 64×64; bottle frames are 16×16. The displayed boss is 96×96 logical units.
- `assets/pixel-renderer/static-quad.gltf`: unit-quad carrier for the custom sprite compositor, not 3D character art.
- `assets/fx/team-victory.vfx.json`: victory UI confetti; `src/arcade/juice.ts` also authors shadows, sparkles, rings, hit/land/turn cues, pop effects, skyline backdrop and masonry through procedural quads. These effects therefore do not appear in the PNG count.
- `assets/reference/arcade.ttf`: the single bundled font. The HUD and shell/menu UI are document-based text/layout, not pre-rendered sprite panels. There are 19 `.ui.json` documents under `ui/docs/` and one `ui/desktop.style.css`.
- Audio is outside the requested visual reskin, but was included in the census: 15 reference WAVs (including 5 exported music tracks), 5 original YM music files and 7 added game-owned WAV cues. Existing music/SFX would also influence the perceived period style if retained.

## Visual diagnosis

Classic deliberately reads as 1980s arcade art: tiny low-color sprites enlarged to 48×48, almost black playfield, saturated candy colors and bright, repetitive patterned tiles. Enemy angry/captured/warning states use strong palette shifts and simplified silhouettes. Replacing only the dragons would leave most of that arcade identity intact.

The party presentation already separates the action more successfully: quiet dark blue/purple/teal masonry, muted skyline, colored player identities, shadow anchors, squash/stretch poses, hollow bubble rings, rescue/chain text and restrained sparkles. It retains the same small sprite sources and arcade font. This is the stronger base for a painted cartoon arena: foreground platform edges are already simple and the background is already quiet.

The title branding has lively outlines and rounded letter shapes, but its yellow/pink treatment is visually closer to modern cartoon candy branding than an integrated 1930s cel-animation package. A cohesive reskin needs type, logo, shell, lobby, HUD, pickups, effects and terrain treatment as well as character sprites.

## Multiplayer is ten identities, not just Bub and Bob

`src/arcade/party-config.ts` defines Bub, Bob, Ember, Sunny, Plum, Tango, Mist, Rosie, Pearl and Flint: green, blue, red, yellow, purple, orange, cyan, pink, ivory and slate. Every slot can be Human, AI or Empty; the default is one human and nine AI. This audit establishes that authored capacity and visual presentation; it does not establish ten connected remote users or online networking.

Only green and blue have stored player PNG frame sets. Eight extra bodies are virtual aliases of green, and nine non-green ordinary bubble colors are shader/CPU palette aliases. `data/dragon-palettes.json` contains 17 mappings, driven by exact source RGB replacement, not ten separate character animation productions. **Ten genuinely different cartoon silhouettes are therefore a major scope increase.** A shared base body, shared poses and small persistent silhouette/costume differences are a lower-cost first production route.

Names appear above players during preparation and HELP remains over downed players. The footer always carries the roster, using two rows of five for ten slots. Body color and bubble rim color carry most combat-time identity. Trapped and elemental bubbles prioritize their semantic state colors. A reskin should add a short persistent identity marker/shape, and a distinct light/dark value pattern per player, because smooth muted cartoon colors alone would reduce the current color separation.

The ten-player courtyard is 44×30 tiles = 1056×720 world units; Classic/explicit six-slot maps are 32×26 = 768×624. Courtyard fitting reserves 96 world units of headroom and the existing HUD/footer bands, then contains the entire board. At a 768×720 view this gives about 0.712 board scale, so a 48-unit dragon is approximately **34 screen pixels** tall; a 256-pixel source does not make its on-screen figure 256 pixels tall. At 1680×720 the board still has a height constraint. Portrait fitting preserves the board but makes individual figures smaller. A concept showing large close-up figures is a beauty shot unless its intended mode/camera changes are stated.

## Technical implications of larger smooth art

The current presentation draws players/enemies in 48×48 logical boxes, ordinary bubbles 44×44, items within 32×32, tiles 24×24 and the boss 96×96. `ActorSize` is 44; presentation size and physics already differ. Higher source resolution can preserve those gameplay bounds and improve line quality, but needs atlas and sampling work. Simply increasing displayed character size without tuning anchors, silhouettes and occlusion would make multiplayer crowded and misrepresent jump/landing/capture space.

The current pipeline is purpose-built to preserve source pixels:

1. `build-atlas.py` packs ordinary frames in 64-pixel cells and asserts source width and height ≤60; the logo and boss use separate areas.
2. `pixel-ordered.material.ts` hard-codes atlas dimensions/2048-pixel palette offsets and samples integer mip-zero texels with `textureLoad`, with masked alpha cutoff 0.999.
3. `ordered.ts` separately samples CPU pixel data; partially transparent texels are composed against earlier draws using premultiplied 8-bit source-over, then expanded into opaque pixel runs. `pixels.json` embeds source texels in the runtime data path.
4. `presentation.ts` uses pooled instances of the static quad and `MaterialParams` rectangles, with text in separate pooled entities. This bypasses the ordinary engine Sprite sampler to preserve old pixel parity.

That makes **directly dropping 256–512 px antialiased characters into the existing path a poor implementation choice**. It would violate the packer constraints, retain nearest sampling, multiply CPU texel data and potentially increase partial-alpha run cost. The right proof of concept is a separate smooth sprite/material presentation path or a generalization of the atlas renderer with normal alpha composition, tested with a small imported character set and many overlapping bubbles. Keep simulation/collision/network state independent. Exact source-RGB palette lookup should become authored masks/tints or controlled exported variants so antialiased edges change with the body color.

`docs/rendering.md` records an 8 MiB uncompressed current atlas and roughly 10.61 MiB geometry scratch; these are historical documented allocations, not newly measured runtime numbers. A 4096² RGBA page alone is 64 MiB before mipmaps/copies, so frame count and source size must be budgeted rather than equating PNG disk size with GPU memory. Larger art can remain batched; ten players do not inherently require ten draw calls, but overlap and effect fill-rate need proof on the target hardware.

## Source provenance and replacement scope

The pinned upstream is `https://github.com/olivierh59500/go-bubblebobble.git`, revision `783cf6aa26ac3c57cdab43f2d7a5b3725a3991cc` in `tools/harness/reference.lock.json`. `tools/port/import-assets.mjs` copies its sprite/tile/audio/font/logo resources and `data/reference-assets.json` records SHA-256 hashes. All **281 imported provenance records matched** their on-disk files during this audit.

`assets/reference/LICENSE` contains a 2026 MALAKH SOFTWARE MIT notice, and `GO-LICENSE` covers Go-derived material. The boss source record explicitly identifies the character as Taito's Super Drunk and links a separate replica repository. These are factual repository provenance statements, not a conclusion that an upstream software license independently clears underlying arcade character artwork. The proposed cartoon treatment should use newly authored character, boss, UI, terrain and effect designs. Cuphead assets should remain reference material for study.

For production scope, preserve the existing semantic coverage: 4 player action states; 6 enemies with walk/angry/dead/captured/warning/escape plus Mighta firing; boss movement/windup/captured/projectile; bubble growth, owner rim, expiry and elemental states; 25 food, 12 current power icons plus the gameplay thunder-power cue; platform variants; HUD/menu/lobby/result/editor art and font. The existing thunder potion is presented with the thunder-bubble graphic and THR label rather than a separate source icon.

A first believable art proof should include one shared dragon animation base with two readable variants, one enemy including its trapped bubble, one finished platform set/backdrop, a boss-scale silhouette, a small set of effects/items, the lobby/HUD treatment and **a ten-player full-board composition**. An illustration alone answers appearance; it does not prove animation continuity, renderer integration, collision readability or performance.

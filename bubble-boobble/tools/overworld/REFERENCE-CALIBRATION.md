# Superseded Inkwell Isle III calibration record

**Historical prototype only.** Current production art must be original Brigade work. The copied assets and reference-only QA path described below are being removed; this record documents the earlier calibration and does not authorize importing them again. The user reference library is unchanged.

23 October 2026. This is an explicit source-reference prototype used to correct the rejected generic fantasy map direction. It is not original Bubble Brigade production artwork and is not evidence that the full Adventure feature is complete.

Only three local source assets are copied under `assets/overworld-reference/`. Exact absolute library source paths and SHA-256 hashes are recorded in `reference-sources.json`.

- `mainland03.png`: unmodified `world3_mainland_03.png`, 2028×1476. Southwest quarter of Inkwell Isle III, containing the exact street/palm promenade in the supplied video. Base scenery, streets, sidewalk and stairs are already painted into this plate. No rectangular route grid or entrance signboards are added.
- `bee.png`: unmodified `world3_icon_bee_0001.png`, 601×651, source collection 161300 (Overworld Locations), Honeycomb Herald. Placed at base-pixel origin (825,170). Transparent image padding is retained. The scene's approximate door footplane anchor is base pixel (1100,775).
- `top03.png`: unmodified `world3_mainland_top_03.png`, 1774×1391. Source collection 182301 (Inkwell Isle III). Foreground palm planters, lamp, roof fragments, clock/hedges. Origin relative to mainland03 is **(309,39)** native pixels. This was recovered with masked native-pixel difference matching: the lamp crop, gray roof crop and palm-planter crop independently selected the same translation. Whole transparent bounds are retained, so all separated foreground fragments stay aligned.

Coordinate transform: `worldX=(pixelX-1100)*0.6`, `worldY=(775-pixelY)*0.6`. The calibration walking spawn is pixel (1030,800), world (-42,-15). The original game's existing green dragon is used as a clearly temporary character proxy. New generated fantasy art is excluded from reference mode.

The base source assets are documented by the user's library at `/Users/eduardoleale/workspace/art/cuphead/INDEX.md`, originally extracted from The Spriters Resource. Collection pages:

- https://www.spriters-resource.com/pc_computer/cupheaddontdealwiththedevil/asset/182301/
- https://www.spriters-resource.com/pc_computer/cupheaddontdealwiththedevil/asset/161300/

Reference walking uses a separate authored pavement/grass footplane polygon union, not the PNG alpha silhouette: alpha includes roofs and elevations. No artwork is repainted, retinted or rescaled relative to other scenery; the entire source scene shares one 0.6 world-unit scale. The native camera provides scrolling. UI is sparse coins/menu plus contextual interaction glyph.

Artwork credit: Cuphead and the referenced map artwork are by **StudioMDHR**. The Inkwell Isle III collection was extracted by **RavenclawNimbus**; its retained `CREDITS.txt` requests credit to StudioMDHR. These copied files are reference prototype material, not original Bubble Brigade artwork.

Production import compatibility: run `python3 tools/overworld/configure-terrain-imports.py` after reimporting map sources. All terrain keeps ASTC 6×6 on Android/iOS and uses an explicit uncompressed desktop override. The release host's cooked phone-low T1 failed at the first terrain frame with an invalid `atlas-page` bind group while compressed desktop terrain was enabled; changing only the standalone terrain's desktop compression passes the same 681-step recorded journey and both screen-fit tests against existing goldens. Shared dragon/flag atlas compression and sizes are unchanged. This isolates a cooked desktop compressed-terrain binding problem; the host's primary texture-creation validation message is not exposed by the test runner.

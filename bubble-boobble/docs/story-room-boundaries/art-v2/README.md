# Timber and vegetation base/collar modules

Generated on 28 October 2026 with built-in `image_gen`, using the original
story-border illustrations as style references. The active import uses only
the timber and vegetation modules; reference profiles supersede the initial
stone, pipe and bubble experiments.

Run from the engine project directory:

```sh
swift tools/art/import-room-boundaries-v2.swift
```

The importer mechanically crops and downsamples the genuine-alpha architecture
sheet. It writes `base-{timber,vegetation}-v2` (192×224) and
`collar-{timber,vegetation}-v2` (192×64). The existing runtime sidecars use the
`story-boundaries-timber` and `story-boundaries-vegetation` named atlases, linear sampling, no compression and no trim.
[import.json](import.json) records source/output hashes, half-open crop rectangles,
dimensions and byte counts. The four active PNGs total 269174 compressed
bytes and 442,368 RGBA bytes before atlas padding. Runtime residency is measured
separately in the focused render test.

The source master is `architecture-sheet.png`, generated as
`exec-3276cdd0-c67e-4bf8-a1f9-72b8e8b2d088`, with
`transparent_background: true`. Left modules have a solid inner right edge;
the renderer mirrors them for the opposite side.

## Generation prompt

Use case: stylized-concept. Asset type: 2D fantasy platform game modular architectural boundary art sprite sheet. Input references are STYLE REFERENCES ONLY: match the massive masonry and chunky copper structures shown. Create ONE sprite sheet with EXACTLY EIGHT separated sprites on genuine transparent background: FOUR chunky pillar BASES in the TOP row, FOUR matching broad horizontal pillar COLLARS in the BOTTOM row. Four evenly spaced columns; left to right materials STONE, TIMBER, COPPER PIPE, VEGETATION. Every top-row base has width:height about 6:7, all same size. Every bottom-row collar has width:height about 3:1, same width as corresponding base. Leave large transparent gaps between all sprites, no touching. Bases: heavy short rectangular lower architectural block, not an entire column. STONE is golden lighthouse limestone with broad stepped plinth, layered cornice, dark recessed joints, deeply beveled corners, carved small corbels, no ornament icons. TIMBER is thick warm oak lower post housing with dark iron straps, brass bolts and broad squared foot. COPPER PIPE is a chunky mechanical brass/copper pipe foot housing with inset circular vent, big valve, bolted panels, worn teal patina and layered broad pedestal. VEGETATION is a mossy stone and gnarled trunk lower buttress with leafy vine clusters, bark and sturdy square stone foot. Matching bottom-row COLLARS: stone layered stepped molding; oak and iron clamp band; large riveted brass flange; mossy stone wrap with vine. Style is highly finished painterly fantasy game environment, thick dark outlines, warm lit LEFT front/outer face with deeply shaded RIGHT side/inner face; strong readable structural mass at small scale. Each base/collar must have STRAIGHT vertical rightmost bounding edge, extending full height on base and collar: it is a solid inner face aligned to an invisible wall. No protrusions, loose branches or valves beyond the straight right face; put rich features on the front/left. Objects are asymmetric left-wall modules, will be mirrored for right. Front orthographic 2D view with restrained depth bevel, not isometric, no receding ground. Transparent backgrounds genuinely alpha. No text, labels, numbers, grid lines, characters, platform layout, scenery or cast ground shadows. Landscape sheet 1536x1024 with 4 columns and 2 rows.

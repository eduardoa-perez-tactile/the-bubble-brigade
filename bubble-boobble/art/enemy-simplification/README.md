# Simplified enemy masters

Generated with the built-in ImageGen tool on 23 October 2026. Each family has a
source PNG, exact prompt and provenance file. Original sheets remain unchanged;
`tools/cartoon/build-simplified-enemies.py` only slices, scales and registers them.
Rejected boss composition and the skimmer's original muzzle-puff variant are kept
as source lineage; neither is exported or used at runtime.

| Gameplay key | Cartoon design | Movement art |
|---|---|---|
| zenchan | Crimson Roller | One wheel, two travel drawings; separate airborne pose |
| mighta | Bowler Blaster | Wheeled cannon; same-step shot/recoil, no hand/leg animation |
| banebou | Jack-in-a-Coil | One spring/base; compression from support, extension in air |
| invader | Clockwork Skimmer | Grounded wheels and downward nozzle; shot pose uses Shoot |
| monsta | Existing purple bat | Existing eight wing drawings preserved |
| pulpul | Existing teal bee | Existing eight wing drawings preserved |
| boss | Crowned Bellows Dragon | No limbs; inflated windup and contracted release |

The four regular source grids are 4×2, row-major: travel-0, travel-1, compress,
air, captured, dead, shoot, angry. The boss grid is move-0, move-1, windup,
release, captured, hit, angry, angry-windup. The generated canvases are 1774×887,
so the exporter rounds fractional cell boundaries. It rejects empty/clipped
silhouettes and uses one scale per family, not per drawing. Every output has a
128×128 canvas, center x=64, painted contact y=120, native linear filtering,
transparent edges, trimming, a stable GUID and the shared cartoon atlas.

Run from the engine project directory:

```sh
python3 tools/cartoon/build-simplified-enemies.py
```

`registered-states.png` shows all forty normalized drawings;
`export-manifest.json` records source hashes, dimensions, scales and state order.
Do not run the historical base/enemy exporters to regenerate this cast: they
reconstruct the previous artwork. Bat/bee and original source art are retained.

Runtime state selection is presentation only. Movement, gravity, jump impulses,
attack release/cooldown, capture/escape, water carry, defeat rewards, hitboxes and
RNG are unchanged. Anger reuses current movement with expression/tint. Capture
warning/escape retain the compact captive drawing and existing amber/red rim.
Frozen regular enemies use their stopped Age clock; frozen/reduced boss motion
holds a single move drawing. Mandatory attack windup delays were not added.

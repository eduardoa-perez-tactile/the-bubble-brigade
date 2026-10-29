# All-story foreground rollout

All 25 authored story levels use one of seven shared, static foreground textures. Levels 3, 7 and 24 retain the approved original images and placement. Four additional images were generated with built-in ImageGen, preserving generated transparency without pixel editing. The original full-canvas registration, uniform scaling, painted defocus, floor clearance and HUD ordering apply to every level.

| Levels | Shared source | Treatment |
| --- | --- | --- |
| 1, 3, 5 | `sailcloth` | Approved ropes and canvas |
| 2 | `parcels` | New mail sacks, parcels and twine |
| 4, 22, 24 | `foundry-4` | Approved bronze pipes and cables |
| 6–10 | `garden-2` | Approved moss roots and ferns |
| 11–15 | `carnival` | New carnival fabric, crates and pinwheels |
| 16–20 | `springs` | New reeds, moss stones and waterside roots |
| 21, 23, 25 | `glassworks` | New pipework, glass offcuts and cables |

All sources live in `assets/adventure/foreground/`. Each episode group loads its assigned shared path, with no duplicated PNGs or shared atlas pinning unrelated art families. Texture import settings retain the original 1024 cap, 768 phone-low override, linear filtering and ASTC6×6 compression. No runtime blur or animation is added. Party mode is excluded.

## Reproduction and review

`python3 tools/cartoon/measure-foreground-alpha.py` reads source alpha into the registration manifest without modifying images (requires Pillow). Existing pilot measurements are unchanged.

`gameengine test --tier t0 --js v8 --filter '*Story foreground rollout*' --json` checks all 25 rooms at four shapes, protected walkable-band and actor clearance, continuous center paint, unchanged gameplay state and Party exclusion.

`node tools/cartoon/capture-story-foreground.mjs --all-levels` captures all 25 native 1280×720 engine frames via actual map/card inputs on mobile tier with phone-low memory class. It records draw counts, validation errors and residency. `python3 tools/cartoon/build-story-foreground-gallery.py` builds a numbered contact sheet and full-size offline gallery from those captures. The images are for user visual approval; no manual per-level visual sweep was performed.

The existing global phone-low texture-residency warning predates this rollout (documented in the pilot PR #54). Budgets are unchanged. Broad suites, the expanded T1 flow sweep, Hermes, cooks, historical goldens/replays, pipeline recording and physical-device GPU/thermal testing are deferred under the prototype policy and the requested fast review workflow. This rollout must remain unmerged pending user approval.

## Root-generated art provenance and exact prompts

Both calls used the built-in ImageGen tool, genuine transparent output, and the approved source PNG as a reference. Generated output is copied unchanged into the asset directory. The companion `story-foreground-new-prompts.md` records carnival and springs provenance.

### Parcels

Reference: `sailcloth.png`. Output: `exec-9acbc324-cae9-42f5-af6c-f8abf3798758.png`.

Use case: stylized-concept. Asset type: transparent 16:9 foreground overlay for handpainted cartoon platform game. Input image is approved STYLE AND EXACT LAYOUT reference. Create matching new foreground made of POST OFFICE PROPS: soft bulky burlap mail sacks and warm brown wrapped parcels at far left/right outer corners, low envelopes/packing twine/parcels draped continuously across bottom center. Keep full wide 16:9 canvas, same sparse low U silhouette as reference: upper 70% entirely transparent, taller props confined extreme outside corners bottom25%, low continuous center band only bottom8-10%. Strongly OUT OF FOCUS painterly blur exactly like reference, soft rounded silhouettes/feathered alpha, muted warm brown/ochre. No sharp edges or readable labels. Genuine transparent alpha above props. No background, floor, scene, actors, HUD, text, borders, checkerboard. Do not crop transparent space or turn into 3:1 strip. Keep registered full-canvas proportions.

### Glassworks

Reference: `foundry-4.png`. Output: `exec-017abff4-6af9-4764-857e-64c8763e987a.png`.

Use case: stylized-concept. Asset type: transparent16:9foreground overlay for handpainted cartoon platform game. Input is approved STYLE/EXACT LAYOUT reference. Make matching GLASSWORKS foreground props: muted dark bronze pipe segments and thick sagging cables form low continuous band across bottom center, soft chunky teal/purple glass crystal offcuts/cropped glass-blowing workshop pieces at far left/right outer corners. Keep full wide16:9canvas with upper70% entirely transparent. Taller silhouettes only extreme outercorners bottom25%; center band bottom8-10% only. Strong OUT OF FOCUS painterly blur identical reference, softly feathered alpha edges. Muted amber/bronzebrown with restrained desaturated bluegreen and plum glass; no bright glow, sharp crystal points, or distracting reflections. Genuine transparent alpha, no checkerboard, background/floor/platforms/actors/HUD/text. Preserve layout proportions; no crop or 3:1strip. This is one low near-camera decoration overlay not complete scene.

## Final silhouette correction

The first parcels and glassworks generations had taller silhouettes that pushed the low center out of view under conservative floor protection. The focused check caught this. One built-in ImageGen edit per source shortened those props; no placement thresholds or tests were relaxed. Carnival and springs passed the same check with their original generations, which remain in use.

Final parcels output: `exec-88da1d9f-b9d3-48ab-8860-4a5e99daec26.png`. Edit targets: initial parcels and approved sailcloth reference. Exact transparent-output prompt:

Use case: precise-object-edit. Image1 EDIT TARGET mail foreground. Image2 exact SILHOUETTE HEIGHT reference. Correct ONLY shape/height of image1 mail props to match image2's very LOW silhouette. Full16:9canvas transparent alpha. IMPORTANT ALL painted pixels must be within BOTTOM27% ofcanvas (nothing above y=73%height at ANY horizontal position). Shorten mail sacks/parcels down to this height. Corners top y=74%; central70% ofwidth must have continuous low softpaint starting near y=90% through bottom edge. Entire upper73% must be genuinely transparent. Retain same parcels/burlap sacks/twine/envelopes warm brown palette and STRONG OUTOFFOCUS painted blur/featheredalpha. Do not move props to midframe, no scene/background/checkerboard/text. Keep full canvas registration. Make low corners as reference, not towering stacks. Bottomcenter must remain present at least10%canvasheight continuous.

Final glassworks output: `exec-126e30b9-b7be-471f-ae7a-28119aeebad4.png`. Edit targets: initial glassworks and approved foundry reference. Exact transparent-output prompt:

Use case: precise-object-edit. Image1 EDIT TARGET glassworksforeground. Image2 exact SILHOUETTE HEIGHT reference. Correct ONLY shape/height of image1 glass props to match image2 very LOW silhouette. Full16:9canvas genuine transparentalpha. ALL paintedpixels confined bottom27%canvas, nothingabove y=73%height at ANY horizontalposition. Shorten teal/plum glass pieces to fit exactly within image2corner silhouettes; no glass towers. Corners starty74%; lowcenter bronze manifold+cables fills bottom10%canvas continuously fromy90% tobottom acrosscentral70%width. Entire upper73%canvas must be transparent. Retain same props/palette/strongOUTOFFOCUSpainterlyblur with softly featheredalpha. Do not sharpen glass or bolts. No scene/background/checkerboard/text. No crop, keep fullcanvasregistration. Target approvedpipe reference silhouette, replace some low outer shapes with darkteal/plumglass only.

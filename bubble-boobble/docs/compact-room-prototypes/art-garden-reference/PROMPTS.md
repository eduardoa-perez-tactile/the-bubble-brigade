# Built-in imagegen prompt record

References: `../references/approved-lighthouse.png` for finish and architectural mass; `assets/adventure/garden-1.png` for palette and light. These were references, not edit targets. All calls requested genuine transparent background.

Initial generation: `exec-da59ddc6-bca6-473d-9ae1-d4720b9c8a54`.

```text
Use case: stylized-concept. Asset type: production 2D painted game architectural border sprite composition, genuine transparent RGBA background. This is a NEW coherent room-frame design, using image1 only as hand-painted material quality and geometric mass reference, image2 only for palette/light. Wide 1672x941 canvas. Orthographic side-view U-shaped architectural stage: full LEFT and RIGHT structural piers running offscreen at top, joined by one continuous horizontal raised floor at bottom. Empty transparent center and transparent exterior; no background, no ceiling beam, no characters, no HUD, no text, no props on floor. Left inner vertical collision body plane x325, right x1345, floor walkable top y777, base bottom y858. Side piers occupy approximately x110..325 and x1345..1562, with complete natural outer profiles and projecting shoulders/stepped feet kept entirely within canvas. Main shafts continue through top edge at y0, flat cut only at canvas top. Broad opaque dark inner vertical side planes must read continuous from top to floor. Floor spans x325..1345, top cap24px deep, full front fascia~58px, contacts feet naturally. Accurate stone/wood grain comparable scale to lighthouse blocks, warm upper-left light, distinct left and right illumination and hand-painted irregularity, crisp painterly silhouettes and deep convincing shadows. Do not mirror; render both sides individually. No alternating repeating modular belts. Floor straight horizontal top and no perspective sloping ends. All silhouette pixels real alpha, no checkerboard.
GREENHOUSE GARDEN: massive moss-worn pale warm limestone structural piers with modest elegant greenhouse-style capitals, deep olive shadow inner planes, broad irregular masonry blocks (not small bricks), broad stepped stone plinths. Restrained aged bronze greenhouse ribs inset into the stone. Selective asymmetric roots and small vines only in a few pockets: left has a short hanging ivy cluster at upper shoulder and a gnarled root around lower base; right has small fern at foot and sparse upper leaf sprig. MOST shaft surface is visible solid stone, NOT vine wallpaper, NOT identical helices, NOT twisting tree columns. Soft bright golden-green botanical atmosphere. Floor matching limestone cap and mossy substantial stone fascia, slight moss along joints only. No foliage crossing the central walkable opening. Full natural foliage/root silhouette with safety margin, no chopped rectangular edges. Two different believable piers, one unified architectural build.
```

Targeted edit 1: `exec-997fe423-c590-4833-b12c-b97e36efd9a2`, input `source-initial.png`, saved `source-margin-attempt.png`.

```text
Use case: precise-object-edit. This transparent 1672x941 greenhouse border is the edit target. Keep ALL architectural stone, brass ribs, floor, dimensions, positions, shadows, center opening and material pixels unchanged. Fix ONLY foliage clipping the far LEFT and RIGHT canvas edge: remove the few leaf tips touching x0 or x1671 and tuck them 20 pixels inward, so the full natural leaf silhouettes fit inside transparent margin on BOTH exterior edges. No other changes. Preserve the original RGBA transparency, no background. The columns still continue off top canvas on purpose. No redesign, no smoothing architecture, no extra vegetation.
```

Targeted edit 2: `exec-0b1ed974-d56a-4940-a5b8-39a0ce47eb2b`, input `source-margin-attempt.png`, saved `source-master.png`.

```text
Use case: precise-object-edit. Preserve this transparent1672x941 architectural U-frame exactly EXCEPT remove all vegetation on the RIGHT PILLAR (both upper right ivy and lower right fern). Clean right pillar with exposed worn limestone and bronze. Keep left roots/ivy untouched. Right vegetation is clipping image edge, so REMOVE IT rather than reposition. Keep all stone pixels/shape/scale, entirefloor and allleftcolumn unchanged. No new plants, no canvas filling, preserve genuine transparency, no black background. Rightmost exterior should have clearly visible transparent space beyond all architectural silhouette except the top intentionally continuing offcanvas. No other changes.
```

The final edit generated a revised master. We preserve that complete generated result; this is not an original-pixel extraction claim.

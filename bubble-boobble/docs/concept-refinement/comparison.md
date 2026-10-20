# Second concept comparison

Reference: `docs/art-reskin-investigation/concept-ten-player-arena.png` (1672×941). Before: `docs/concept-playable/wide-combat.png` (1536×864), committed in `71e9d52`. Both have approximately the same aspect ratio. Image observations below describe composition, not pixel-perfect source equivalence.

| Area | Remaining difference before this pass | Refinement target |
|---|---|---|
| Character presence | Existing actor drawings read roughly half the reference height. | Enlarge existing drawings around their established feet/centers; do not redraw or change hitboxes, controls or physics. |
| Side framing | The first shelf starts about 7% into the game image; the concept begins near its masonry edge. | Frame the playable footprint closely, preserving every traversable position and safe-area clearance. Decorative solid backing need not consume viewport space. |
| Shelf rhythm | Current upper rows have two long shelf sections; the concept mixes two, four, five and three sections. | Add staggered breaks and varied lengths while preserving viable ascent routes, landing support and spawn safety. |
| Top clearance | Current crown is around 31% down the image versus about 27% in the concept. | Improve composition where possible; retain visibility at the actual unchanged jump apex, which a single concept pose does not establish. |
| Score header | Current left plaque is small, with small label/type; a permanent dragon-count plaque occupies the right. | Broader score plaque, stronger typography and contextual right-side information. |
| Roster | Current full-width row emphasizes names/role text and comparatively small faces. | Center a portrait-led row at 70% wide, with larger faces and corner numbers; use compact condition indicators. Preserve readable narrow-screen fallback. |
| World identities | Current small colored markers omit the concept's player numbers. | Larger colored diamonds with centered, outlined 1–10 labels; move only the marker beside an apex actor when header clearance requires it. |
| Footer proportion | Current wide footer is 64 logical pixels with 52px faces. | Wide 80px footer and 64px faces, yielding 96px and 76.8px respectively at 1536×864; narrow 64px fallback. |

All existing character source images, animation masters and palette variants remain unchanged. This iteration uses presentation scale only for characters. Prior concept-playable images, reports and recordings remain historical evidence. Final captures and verification for this pass are recorded separately in this directory.

The 40px-high/96px-repeat platform trial was rejected: it stretched the individual top stones and removed 6.4 world pixels of clearance beneath ledges for the enlarged actors. The delivered caps keep 32px depth and 48px repeat, aligned to the same collision tops. Its separately named capture is intermediate evidence, not the delivered composition.

## Delivered comparison and remaining differences

At 1536×864, the authored layout puts the first shelf edge at 36.5px instead of approximately 114px before this pass. The safe stage footprint occupies 98.75% of width, versus 94.48% previously. Player/enemy draw size increases by 1.6× while the layout scale changes from 0.8398 to 0.7470, giving approximately 1.42× the previous apparent size. Wide faces increase from 62.4 to 76.8 physical pixels. These are layout calculations accompanying actual engine captures, not measurements inferred from a resized mockup.

The crown remains lower than the concept: its collision top is 283.7px (32.8% of height), compared with 271.2px before and approximately 27% in the illustration. The larger actors require visible space through the real jump apex. The final full-jump body envelope clears the header by 29.8 physical pixels. This tradeoff was retained rather than clipping actors or changing jump physics. The floor top is 714.0px and the footer begins at 768px; its extra gap remains visibly different from the illustration.

The background painting lacks the concept's central dragon statue, waterfalls and heavy ornamental footer carving. The actor drawing styles also differ because this pass preserves their artwork. Those art differences remain for later feedback; this iteration implements the requested UI, shelf layout, framing and scale changes.

![Refined actual game](wide-combat.png)

Dragon motion masters, October 2026

walk-source.png: eight poses, 4 columns x 2 rows, generated in one edit from the shipped green run/idle sprites.
shoot-source.png: six poses, 3 columns x 2 rows, generated in one edit from the shipped green release/idle sprites.
release-anchors.png: exact shipped release pose for all ten colors in party color order.
release-anchor.png: green release reference used during authoring.

Rebuild with: python3 tools/cartoon/build-dragon-animation.py
This only exports dragon run/shoot clips and metadata; historical art and migration evidence remain untouched. The full base asset builder invokes this afterward.

Each strip uses one scale, 128x128 canvases and feet at [64,120]. Linear filtering and trimmed transparent texels preserve sprite bounds while limiting atlas growth. The six-frame shoot retains the original first release drawing and muzzle [100,80], then adds recoil and recovery. Walk uses 32 ticks (four ticks per frame, 25% slower playback); shooting remains 12 ticks, with no added input delay or simulation changes. Walking uses only the drawn body motion, without a procedural scale pulse.

October 22 implementation pass

Accepted locomotion source: walk-source-2026-10-22-v2.png. Fixed grid cells share scale0.27, X4; source row0 uses Y3 and row1 Y9 as row registration. No per-pose opaque-bounds centering, height fitting, or sprite squash. Eight poses improve the passing-leg clearance and restore a grounded support in prior airborne-looking keys. The original walk-source.png remains preserved.

Control exposure remains4ticks perkey /32ticks. The trial20tick GIF is synthetic evidence only; the measured sheet does not establish90gamepixel stride or perfect foot planting. See registration-2026-10-22.json for approximate support observations and limitations.

Moving shots use shoot-locomotion-source-2026-10-22.png (8 crouched walk lowers +2 air lowers) at fixed scale0.31/origin[-12,8], with integer sole registration corrections. Crops retain128x32 canvas, sourceOrigin[0,96], ground reference[64,24]. Upper0 is an exact128x96 crop of the preserved per-skin release anchors. Upper1/2 replace only face rectangle[58,56,104,92] from shoot-head-recovery-source-2026-10-22.png; torso, waist, skull/frill and blue accent stay original. Existing stationary fullshoot0 and authored projectile release stay exact.

Review files: contact-review-2026-10-22.png, face-recovery-composite-2026-10-22.png, walk-control-2026-10-22.gif, walk-trial-2026-10-22.gif and moving-shot-preview-2026-10-22.gif. GIFs are synthetic previews, not engine gameplay tests. Root coordinator owns the final engine acceptance and production export.

Other dated source attempts and seam-review sheets document rejected registration approaches; the exporter only consumes the three accepted source names above. No Cuphead reference pixels are used in any production artwork.

October 22 follow-up: 16-drawing walk

Current accepted canonical master: walk-source-2026-10-22-16-registered.png, exactly 4x4 logical 128px canvases. It interleaves the previous eight keys unchanged with eight newly drawn inbetweens. Exposures are two ticks each, so full cycle pace stays 32 ticks while normal grounded pose updates increase from 15 to 30 per second. No duplicated key holds, alpha crossfade, blur, per-frame bbox fitting, or gameplay retiming.

Inbetween source: walk-inbetween-source-2026-10-22.png. Corrected lower-leg regions (rows 92..128) of poses 5/13/15 use walk-inbetween-support-source-2026-10-22.png, retaining the original upper art; these repair raised support feet. A separate guided 16-frame attempt was rejected because it did not follow its stance chart. Existing near/far support geometry is not perfectly uniform, and this pass does not claim continuous foot planting.

Final review: walk16-contact-review-final-2026-10-22.png and walk16-after-final-2026-10-22.gif (synthetic exposure preview). registration16-2026-10-22.json records provenance and limits. All 80 original color walk keys remain RGBA exact at even indices; ten full release anchors remain exact. The separate eight moving-shot lower poses are unchanged; presentation must map the full 16-phase cycle back to their eight keys.

Final registration refinement: odd drawings receive integer horizontal anatomical offsets [+3,-1,+7,-3,+5,+6,+1,0] source pixels to align their head silhouettes with neighboring original keys. This corrects generation drift without changing scale, fitting opaque bounds, moving vertically, or altering sole contact heights. The unregistered 16-frame master is retained as authoring evidence. Final review files are walk16-registered-review-2026-10-22.png and walk16-registered-preview-2026-10-22.gif.

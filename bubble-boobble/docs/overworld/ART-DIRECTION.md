# Corrected overworld direction

User correction, 23 October 2026: **follow the analyzed Cuphead art style and map; it is a free-roaming map.** The first generated fantasy-map screenshot is rejected.

The supplied video is the visual specification. Use its close neighborhood framing, hand-drawn oblique façades, softly painted terrain, curved promenade, planting beds, stairs and retaining coastline. Movement happens freely within continuous walkable geography. Door thresholds provide local interaction prompts. The camera follows the avatar through the scenery.

Remove the rejected composition's rectangular path lattice, evenly spaced five-landmark arrangement, persistent label/signboard below each building, detailed medieval fantasy props and highly rendered treehouses. A different paint texture alone does not correct the layout or art direction.

First calibration sample: the exact downtown neighborhood visible in the video, using selected original reference layers from the user's local Cuphead library. Mainland `world3_mainland_03.png` contains the promenade and blank Honeycomb Herald building slot; `world3_icon_bee_0001.png` supplies that landmark. Preserve native aspect ratios and source provenance. Label the result as a **source-reference engine sample**, not newly authored original game art.

Source art and navigation share one declared pixel-to-world transform. Trace walkable footplanes, building footprints, planting beds, coast and stairs in source pixels. Image transparency cannot define walking collision because rooftops and raised scenery are also opaque.

The corrected direction must be visible in an actual engine-rendered sample before expanding production artwork or district layouts. Existing progression and encounter code can be retained; rejected artwork must not become a golden or a completed-feature claim.

All work remains on `codex/walkable-overworld`; PR #10 stays unmerged pending the user's playtest and explicit approval.

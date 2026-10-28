# Original Brigade overworld direction

Current approved direction, 28 October 2026: use the vintage cartoon winged mission
crests (Ready play symbol, Locked padlock, Completed with three gold stars). Keep
state symbols prominent at map size. Shops use the matching bag/candy crest. Remove
world NPC actors, resident shadows and floating map labels. Keep original map
paintings, geography and existing coastline drawings intact. Guide information and
its saved three-clear reward live in the journal, with no invisible NPC interaction.
Walking puffs use authored cream/ochre sprite frames at actual foot contacts, oriented
on the isometric ground plane for the captured travel direction; no continuous emitter.


Current user correction, 27 October 2026: **the shipped game artwork is the visual reference; the linked art guide is out of date.** Match the existing dragon, residents, illustrated items, title lettering and painted district scenery directly. Review new art beside the real player on an unchanged map. Do not treat compliance with the older PDF palette or example glyphs as artistic approval.

Rejected mission-marker studies used generic polished UI symbols and sticker borders. They are not production art. New mission indicators require fresh in-context samples and explicit user approval. Existing paintings and geography stay fixed. The earlier resident idle drawings are superseded by the approved NPC removal; the added lighthouse and door-leaf overlays are removed. The opening is a closed curtain alone, with title and dragon visible only in the main menu revealed behind it.

## Earlier integration direction

Earlier user correction, 23 October 2026: build **original game art inspired by the Cuphead overworld**, with an original isometric map dragon. Cuphead supplies reference for interaction, composition and animation language. Its copied map plates, landmarks and completion flag have been removed or replaced in this feature.

The earlier production reference was the [Theatrical Cel Adventure art style guide](/Users/eduardoleale/workspace/art/poc-popeye/output/pdf/theatrical-cel-adventure-art-style-guide.pdf): broad readable shapes, a controlled palette, bright actors against a quieter world, and clear gameplay silhouettes.

The visual target is a freely explored, hand-drawn oblique neighborhood: curved continuous footplanes, readable building façades, softly painted terrain, planting beds, stairs, coastlines and foreground overlap. A close follow camera tracks the dragon. Physical door thresholds offer contextual interaction prompts. Avoid rectangular route lattices, evenly spaced landmark rows, permanent signboards and unrelated medieval fantasy detail.

Five original district paintings and original eight-direction dragon poses are now integrated for validation. Map geometry must be authored against those paintings rather than retaining the reference game's geography. Walkable ground, solid building footprints, stairs and coast share a declared source-pixel-to-world transform; PNG opacity is not walking collision.

The original completion pennant is a green forked banner with a cream bubble emblem, built from authored geometric primitives by `tools/overworld/build-cleared-flag.py`. It uses no external source image. Original assets need their own provenance, coherent foot anchors and phone-low import metadata.

Original generation prompts, exact hashes and source copies are recorded in `tools/overworld/original-art-manifest.json` and `original-map-prompts.json`. The tracked copied-art audit verifies all 17 copied PNG identities are absent from the current assets tree.

Previous source-reference captures, map reachability results, performance figures and render approvals describe the superseded copied-art prototype. They are historical evidence and do not validate the replacement artwork. New maps and dragon require fresh engine captures, collision/interaction reachability, responsive framing, cooked validation and asset memory measurements.

Historical workflow note: the original integration used `codex/walkable-overworld` and PR #10. That approval checkpoint is historical. Use the current repository Git workflow for new changes. The user's local Cuphead reference library and archived migration evidence remain untouched.

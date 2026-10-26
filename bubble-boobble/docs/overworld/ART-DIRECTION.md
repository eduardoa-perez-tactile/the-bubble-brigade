# Original Brigade overworld direction

Current user correction, 23 October 2026: build **original game art inspired by the Cuphead overworld**, with an original isometric map dragon. Cuphead supplies reference for interaction, composition and animation language. Its copied map plates, landmarks and completion flag have been removed or replaced in this feature.

The production reference is the [Theatrical Cel Adventure art style guide](/Users/eduardoleale/workspace/art/poc-popeye/output/pdf/theatrical-cel-adventure-art-style-guide.pdf): broad readable shapes, a controlled palette, bright actors against a quieter world, and clear gameplay silhouettes.

The visual target is a freely explored, hand-drawn oblique neighborhood: curved continuous footplanes, readable building façades, softly painted terrain, planting beds, stairs, coastlines and foreground overlap. A close follow camera tracks the dragon. Physical door thresholds offer contextual interaction prompts. Avoid rectangular route lattices, evenly spaced landmark rows, permanent signboards and unrelated medieval fantasy detail.

Five original district paintings and original eight-direction dragon poses are now integrated for validation. Map geometry must be authored against those paintings rather than retaining the reference game's geography. Walkable ground, solid building footprints, stairs and coast share a declared source-pixel-to-world transform; PNG opacity is not walking collision.

The original completion pennant is a green forked banner with a cream bubble emblem, built from authored geometric primitives by `tools/overworld/build-cleared-flag.py`. It uses no external source image. Original assets need their own provenance, coherent foot anchors and phone-low import metadata.

Original generation prompts, exact hashes and source copies are recorded in `tools/overworld/original-art-manifest.json` and `original-map-prompts.json`. The tracked copied-art audit verifies all 17 copied PNG identities are absent from the current assets tree.

Previous source-reference captures, map reachability results, performance figures and render approvals describe the superseded copied-art prototype. They are historical evidence and do not validate the replacement artwork. New maps and dragon require fresh engine captures, collision/interaction reachability, responsive framing, cooked validation and asset memory measurements.

The user's local Cuphead reference library remains untouched. Existing baseline UI and archived migration evidence are outside this cleanup. Keep work on `codex/walkable-overworld`; PR #10 stays unmerged until the user playtests and explicitly approves.

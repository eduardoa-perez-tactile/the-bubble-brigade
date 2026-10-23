# Directional Brigade character

23 October 2026, built-in OpenAI ImageGen **edit** of the shipped game sprite `assets/cartoon/frames/dragon/green/idle-0.png`. The shipped sprite is the identity seed, rather than the rejected fantasy character. That earlier character is not imported or referenced by production rendering.

One whole horizontal strip contains front idle/two front walking keys/back idle/two back walking keys. Prompt invariants: same slender green dragon; cream muzzle, face and belly; black oval eyes; rosy cheeks; rounded yellow head/back spikes; short green tail; thin arms; cream mitten hands and oversized cream shoes; flat dark-ink outlines and flat fills; **no horns, no new outfit, no bulky redesign, no watercolor dragon**. Output has a real transparent background and no ground, UI, text or scenery. Front looks toward the viewer; back has no face/eyes on the rear of the head.

`source/dragon-directions-approved-edit.png` preserves the unmodified generated edit. The sprite-pipeline skill's `normalize_sprite_strip.py` extracts all six keys with one shared scale at 108px. `build-directional-dragon.py` pads them into 128px canvases with common bottom-center logical foot anchor **(64,120)**, matching the shipped 128px dragon animation. It uses the exact established Brigade recolor function/palette for the ten existing profile skins. No new skin IDs are introduced.

The generated front walk keys have the same foot stance. The renderer mirrors the alternating front walk key to show the opposite foot; the front character is symmetric. The back walking keys are distinct. The sequence uses idle as an intermediate contact pose: idle → left step → idle → right step. Left/right preserve the shipped sixteen-key running animation and its mirrored facing. The character's identity, profile skin and foot position persist across directions.

Rebuild packaging:

```sh
python3 /Users/eduardoleale/.codex/plugins/cache/openai-curated-remote/game-studio/0.1.2/scripts/normalize_sprite_strip.py --input tools/overworld/source/dragon-directions-approved-edit.png --out-dir tools/overworld/source/direction-normalized --frames 6 --frame-size 108
python3 tools/overworld/build-directional-dragon.py
```

Engine captures and render tests must verify the four facing directions and common foot anchor at gameplay scale. These keys supply the overworld directions; they do not change combat animation.

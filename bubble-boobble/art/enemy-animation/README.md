# Enemy locomotion masters

Five approved transparent 4×2 sheets extend the shipped cartoon families into eight
poses each. Generated with ImageGen from each shipped `walk-0` reference on
2026-10-21. `banebou-anchors.png` preserves the two shipped hopper poses: its native
three-part rig stretches only the spring section, retaining rigid body size and a
fixed shoe anchor. Captured, warning, escape, defeated and attack art is preserved.

Run from the game project:

```
python3 tools/cartoon/build-enemy-animation.py
python3 tools/cartoon/preview-enemy-animation.py
```

The exporter uses a single scale per family. Walkers use a bottom-center foot
anchor; flyers use a fixed cream face/goggle landmark so wings cannot change body
placement. The fourth invader source cell is mirrored to normalize its direction.
Exports retain full alpha, 128px logical canvases, linear filtering, trimmed packing
and the existing `cartoon` atlas group. Hopper parts include canvas-size metadata.

Runtime exposures: imp and boxer 4 ticks/pose, bat 3, bee 2, saucer 5. Hopper steps
hold each original pose for 16 ticks, with continuous 32-tick spring articulation.
Angry movement reuses the locomotion poses with a warm tint. All clocks and rig
transforms are presentation only; simulation and collisions are unchanged.

`.cache/enemy-animation-motion.gif` shows one common cycle at the same tick exposures as the game.
Engine tests cover complete clips, both directions, rigid body/foot anchors,
preparation wing motion, four desktop aspects and phone-low rendering budgets.

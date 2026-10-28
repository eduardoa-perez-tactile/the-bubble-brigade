# Flying enemy state registration

The bat (`monsta`) and bee (`pulpul`) keep their shipped eight-frame flight
animations. Their captive and death states are mechanically registered from the
existing transparent character sheet at
`docs/cartoon-overhaul/sources/enemies.png`; no source sheet is modified and no new
art is generated.

Run from the game project:

```sh
python3 tools/cartoon/build-flying-enemy-states.py
python3 tools/cartoon/build-flying-enemy-states.py --check
```

This scoped exporter replaces only each flyer's `captured-0` and `dead-0` PNG,
the corresponding `animation.json` frame records, and `trim` in their existing
`.gmeta` files. GUIDs, atlas group, filtering and compression stay unchanged.
Flight PNGs are read as scale references and checked for byte preservation.
The historical broad base/enemy exporters are not required for this correction.

Detached halo and bubble marks are removed by taking the connected character
silhouette within an explicit reviewed source rectangle. The same cream
face/goggle colour landmark as the flight exporter provides a median reference
area across all eight shipped flight frames. One uniform source scale matches
that body landmark, with a bounded raster refinement to account for antialiasing
at 128px. Every pose shares the flight body anchor `[82,76]`.

Death rotates the same scaled captive by 28 degrees on an expanded canvas before
registration; it is never fitted independently or enlarged to fill the canvas.
Both outputs are rejected if paint would approach within two pixels of a canvas
edge. Metadata records the immutable source hash/rectangle, the eight reference
hashes, chosen scale, body landmark, rotation, canvas size and alpha bounds.

At alpha >16, the registered bat captive/death bounds measure 68×64 / 68×65
pixels; the bee measures 66×52 / 66×64. The change in the rotated bee's bounding
height is rotation, not an increase in body scale. Runtime controls the compact
post-pop drawing envelope separately from these source-art proportions.

All six regular enemies use the same compact defeat presentation. Captives and
defeated poses register their painted bounds at the bubble root; shell squash
does not displace the character. Defeat starts on the captive drawing and blends
to the dead pose over four existing simulation ticks, fitting the dead drawing
inside the captive's visible envelope. Reduced effects omit the blend. Normal
and water-carried drawing sizes, simulation movement, rewards and the 50-tick
defeat lifetime are unchanged. Elemental defeats use the same compact treatment.

Focused regression coverage lives in `tests/enemy-size-transitions.test.ts`.
`node tools/cartoon/enemy-size-capture.mjs` captures all six families at the start,
middle and end of defeat on slim and wide engine viewports, writing disposable
comparison images and render statistics under `.cache/enemy-size-transitions/`.

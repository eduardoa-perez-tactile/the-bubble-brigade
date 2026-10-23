# Blue dragon floating oval correction

The oval was procedural output, not part of the authored dragon master. Both `tools/cartoon/build-assets.py` and `tools/cartoon/build-dragon-animation.py` added a blue-only ellipse above the skull. Those additions are removed. The existing source release sheet also baked the old oval into the blue slot, so the exporter restores only that rectangle, `(23, top+3, 58, top+16)`, using the clean green slot and the existing blue palette mapping. Every release pixel outside that rectangle stays RGBA exact. The original release sheet remains unchanged as authoring evidence.

Reproduce the complete scoped correction with:

```sh
python3 tools/cartoon/build-assets.py --dragon-skin blue
```

This exits before the full asset export: it rebuilds only the selected skin's base/expanded frames and exact existing portrait crops. It skips old base run/shoot keys until the current expanded exporter owns them. The animation exporter also supports `--skin blue`. Both normal full builders now omit the ellipse, so a later full regeneration will retain the correction.

Production differences are confined to 30 PNGs under `assets/cartoon/frames/dragon/blue/` (five idle/jump/hurt, sixteen run, six full shooting, three upper shooting), the blue 80×80 UI face crop and its 80×64 reconstruction crop, and three `visualBounds` entries in `assets/cartoon/animation.json`. Downed and lower-body PNGs are unchanged. Import GUIDs, sidecars, atlas layout, all other character colors and all source animation masters are byte-identical.

`blue-oval-fix.json` records every affected path, frame changed-pixel rectangle, canvas size and SHA-256. Pixel verification confirms every blue frame now has the corresponding clean green alpha silhouette; frame dimensions stay 128×128 or their existing upper/lower crops. Every changed frame pixel is confined to the former oval area (`x≤72`, `y≤50`), preserving muzzle `[100,80]`, soles `[64,120]`, and waist rows 92–96. A second completed scoped build reproduced every output and metadata file byte for byte.

`blue-oval-before.png` and `blue-oval-after.png` compare idle, walking, release and moving-shot recovery at 2× nearest enlargement. They are sprite inspection sheets, not gameplay captures. Integrated engine rendering and anchor regression tests remain coordinator-owned.

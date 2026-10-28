# Approved lighthouse source and floor

`approved-lighthouse-mockup.png` is the original 1672×941 approved concept.
The active v4 import retains only the complete floor cap and corbel fascia;
full transparent v5 profiles supersede the earlier cropped column experiments.

```sh
swift tools/art/import-room-boundaries-v4.swift
```

The importer exports `floor-stone-v4` directly from source rectangle
[387,777,1285,854), 898×77 pixels. No resampling, painting, alpha extraction,
keying or redraw occurs. [import.json](import.json) records source/output hashes
and source-space walking-floor/body-plane anchors. Runtime RGB is identical to
the original crop. Original left/right column lighting is preserved separately
by the [v5 full profiles](../art-v5/README.md).

The floor replaces the generic last-row platform artwork only; collision and
all higher platforms remain authored. The reference columns and floor share
one source pixel density, with the floor drawn after the profiles to preserve
the original foot/fascia junctions. Its atlas sidecar uses linear filtering,
no compression and no trim.

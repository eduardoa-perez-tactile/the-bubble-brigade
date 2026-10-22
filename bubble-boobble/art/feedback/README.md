# Cartoon feedback assets — 22 October 2026

`dust-puff-source-2026-10-22.png` is the generated and visually approved warm, inked puff master. The importer only crops its transparent margins using alpha>2 to ignore stray generation noise, scales it proportionally and registers it at the bottom of a128×64 canvas. Its alpha is preserved. The game composes three takeoff/five landing lobes from this drawing; reduced mode omits them.

Rebuild only these assets with `python3 tools/cartoon/build-feedback-assets.py`. The main cartoon asset builder invokes it too. Import settings match the existing cartoon atlas, with linear filtering and no compression.

`build-bubble-body.py` generates a neutral translucent color-wash layer for the existing procedural ink rim. Its center alpha is56/255 and edge band rises to120/255 before fading at the outline. Runtime player color tints this layer. It is drawn behind captives; the original unchanged ring stays in front. Capture/rescue/pop rings continue using the original ring texture and do not inherit the body fill.

Mature bubble canvas110, fixed captive canvas84; empty-shot growth lasts16ticks. At point-blank capture the shell completes around the fixed captive. These asset dimensions and timings are presentation values. Cartoon head/body pop contact and bounce separation are documented in `docs/bubble-readability-follow-up.md`; asset generation does not change trajectory or combat timing.

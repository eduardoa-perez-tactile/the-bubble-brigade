# Cold viewport regression

`tools/harness/viewport-smoke.mjs` explicitly selects the retained pixel scene so changing the project's default scene cannot silently change the old regression. Its original tile-band, green-player and mesh-triangle assertions remain intact.

```sh
# From bubble-boobble/
node tools/harness/viewport-smoke.mjs
node tools/harness/viewport-smoke.mjs --cartoon
```

The cartoon option selects `scenes/cartoon.scene.json` and writes separate `artifacts/viewport-smoke-cartoon.png`, `.json` and `.log` files. It checks the actual readback viewport for the teal wall band and muted green dragon, then confirms that the native sprite path has visible alpha-blended, stencil-clipped sprites with no world mesh on their rows. It does not require 3D geometry from a sprite renderer.

Both modes create the live readback viewport before any screenshot, render probe, preview, preload or offscreen render request. Normal engine frames allow ordinary asynchronous loading. The PNG is encoded directly from the received RGBA viewport buffer; requesting a screenshot cannot initialize a missing renderer and conceal a cold-start bug.

Recorded pass/fail and draw counts are in the resulting JSON. This establishes cold engine-viewport visibility, not OS-window behavior or phone performance.

## Verified results

Both modes passed on 20 October 2026, before any offscreen rendering. Pixel: 5 draw calls, 1,065 triangles, 1,136 green player pixels. Cartoon: 6 draw calls, 641 triangles, 373 muted green player pixels and 235 native alpha sprites. In both cases every one of the 34,380 sampled wall-band pixels passed. See [the evidence](cold-viewport-evidence.json), [pixel capture](viewport-smoke.png) and [cartoon capture](viewport-smoke-cartoon.png).

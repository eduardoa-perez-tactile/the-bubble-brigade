# Tactile curtain branding

`tactile-logo.svg` is the official wordmark embedded in the header of
https://tactilegames.com/ (retrieved October 28, 2026). Its geometry is unchanged.
The curtain sprite `assets/cartoon/menu/tactile-logo.png` is rendered at 798×300,
with the purple path (#753EDB) replaced by the curtain's warm ivory (#fff0c9).

To regenerate, render the SVG with that fill replacement using Sharp, resized to
798×300 with transparency. The sprite shares the `menu-presentation` atlas.

## Embedded curtain versions

The active menu uses `assets/cartoon/menu/curtain-tactile.png`, with
`curtain-tactile-portrait.png` for the existing narrow layout. These were edited
using the built-in imagegen tool. The original curtain is preserved. The landscape
version reuses the original curtain's alpha channel to keep the cloth opaque and
retain its precise transparent hem. The separate presenter UI layers were removed.

Prompt set:

1. Bake the official Tactile wordmark and serif “presents…” into the existing red
   curtain as warm ivory textile print. Follow the cloth pleats, shadows and grain;
   preserve the curtain, gold scalloped hem and bottom transparency. Do not bake the
   live “PRESS PLAY TO ENTER” prompt into the texture.
2. Adapt the printed curtain to portrait while preserving the logo's proportions,
   fabric treatment, red folds and gold hem.
3. Reduce the portrait wordmark and credit to 70% of their initial sizes, keeping
   their group center fixed and the full wordmark within the central 45% of the
   canvas. Restore matching cloth where the larger print was.

Visual verification uses Game Engine view captures at 360×880, 1280×720 and
2520×1080, plus the curtain's fully lifted pose. Full suites are deferred under the
project's presentation-only prototype verification policy.

## Transparency repair

Run `node tools/menu-branding/restore-curtain-alpha.cjs` with Sharp on `NODE_PATH`
to restore and verify alpha after importing artwork. It preserves every RGB byte,
uses the original curtain's exact alpha for the landscape, and uses the preserved
`curtain-portrait-alpha-cutout.png` mask for portrait. Generated mask alpha values
0–8 become transparent, 238–255 become opaque, and intermediate edges are remapped.
Both exports have fully transparent bottom rows and fully opaque cloth above the hem.

The portrait mask was made with built-in imagegen using this prompt:

> Edit this exact 1024x1536 portrait curtain image ONLY to remove the brown
> floor/matte below the bottom scalloped gold hem, replacing ALL background below
> the hem with genuine alpha transparency. Keep the curtain fabric and gold hem
> fully opaque. Follow the precise gold hem silhouette including scallops and
> antialiased edges. The bottom row must be fully transparent. Do not crop, resize,
> move, repaint or alter any red fabric, gold trim, Tactile wordmark or presents…
> lettering. Preserve every existing cloth detail and the exact canvas size and
> framing. Output PNG with alpha; no checkerboard drawn into image, no floor, no
> cast shadow below the hem, no colored matte.

Only the mask's alpha is used; its generated RGB is discarded. Engine half-lift
captures were inspected at 360×880 and 2520×1080 after the repair.

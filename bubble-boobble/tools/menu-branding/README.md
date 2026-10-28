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

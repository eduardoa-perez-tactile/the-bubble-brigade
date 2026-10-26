# Map painting correction — 26 October 2026

The user rejected the previous style-compliance claim. Originality, gameplay tests and successful rendering did not establish that the paintings matched the art direction. This pass corrects painting treatment while retaining the accepted map geography.

References: the existing original `assets/cartoon/courtyard.png`, the environment and palette pages of the Theatrical Cel Adventure guide, and the established original Brigade dragon. No Cuphead raster is an input to this repaint.

## Visual review criteria

| Previous mismatch | Correction to inspect in the painting and game capture |
| --- | --- |
| Dense, uniformly outlined paving and ornament | Broad ground washes, selective broken seams, grouped foliage and fewer small props |
| Polished miniature materials | Matte painted metal/glass, few tonal masses, restrained glints |
| Busy water and repeated surface texture | Quiet pooled color, sparse local ripples and readable shores |
| Similar edge contrast at all depths | Selective distant edge loss and cooler haze, clear middle-ground entrances, stronger near framing |
| Bright scenery competing with actors | Restrained world colors and highlights; the saturated inked dragon remains the first readable moving subject |

These are visual criteria, not claims that pixel statistics or automated tests can certify artistic compliance. The user retains final art approval.

## Harbor iteration

The first repaint reduced shiny brass, flower clutter and saturation but retained overly regular paving, shiny dome modeling and uniformly busy water. Independent review rejected it as a style master.

The second repaint simplified paving, foliage and material shading enough for provisional engine review. It still needed quieter water and selective distant edge loss.

The third repaint targets those remaining issues. Navigation review found the existing door, bridge, stair and coast anchors remained within roughly 0–3 source pixels; the accepted traversal geometry does not need to change. Gameplay-scale landscape and portrait review is required before propagating its treatment to the other districts.

Prompt history is recorded in `tools/overworld/style-pass-prompts.json`. Prior original plates are retained outside cooked assets under `tools/overworld/original-sources/style-pass-before/`.

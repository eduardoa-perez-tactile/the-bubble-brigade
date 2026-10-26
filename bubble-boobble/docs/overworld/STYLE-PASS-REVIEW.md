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

The third repaint targets those remaining issues. Navigation review found the existing door, bridge, stair and coast anchors remained within roughly 0–3 source pixels; the accepted traversal geometry does not need to change. Actual landscape and portrait captures established that the player, guide and vendor remained readable, so this treatment became the reference for the other districts.

Prompt history is recorded in `tools/overworld/style-pass-prompts.json`. Prior original plates are retained outside cooked assets under `tools/overworld/original-sources/style-pass-before/`.

## Selected five-map pass

| District | Visible paint changes |
| --- | --- |
| Bubblebrook Quay | Matte dome/brass treatment, grouped planting, calmer water and reduced distant edge contrast |
| Fernfall Gardens | Fewer flower/pot accents, quieter greenhouse materials and grouped green/plum vegetation; pond and bridge topology preserved |
| Pinwheel Fair | Broad warm floor washes replace most individual paving marks; coral/lavender identity remains with fewer bright fittings and foliage accents |
| Cloudtop Springs | Airy cream/lavender palette retained; fewer bright details and softer distant pillars/cloud banks; both bridge footplanes preserved |
| Emberglass Works | Quieter plum/teal stone and glass, reduced white glints, broad forecourt wash and localized amber fire |

A foundry repaint that shifted lower doors, stairs and coast by 10–25 pixels was rejected. A subsequent alignment-preserving draft was also rejected for weak style correction and an invented floor motif. The final selected foundry restores the existing registration and receives a localized glass/paving cleanup. `evidence/style-pass-alignment.json` records the selected candidates, rejected history, comparison method and its limits. None of the five map geometry files changed.

All ten final landscape/portrait captures have been visually reviewed with the actual original dragon. Captures live under `.gameengine/style-pass-final/map-{1..5}-{landscape,slim}.png`. This establishes gameplay-scale readability, not user approval of the artistic direction.

## Remaining visual judgments

The accepted rounded architecture remains, and some roof volumes, small light accents and mottled paper/paint texture still differ from the courtyard reference's more selective wash treatment. Cloudtop's coin text has weaker contrast against pale clouds than against the darker districts, though its existing outline remains readable. The pass meaningfully reduces the previous polish, clutter and uniform contrast; it is not an assertion of an exact courtyard match or final guideline compliance. The user must review the revised paintings.

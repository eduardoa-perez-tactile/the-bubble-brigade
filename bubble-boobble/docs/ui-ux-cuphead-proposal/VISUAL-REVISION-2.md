# Visual revision 2: Cuphead is the layout and motion reference

22 October 2026. Proposal only. This supersedes the first proposal's generic paper-panel mockups; production remains untouched.

The initial Ready treatment was wrong for the requested match: a centered beige rectangle, serif type and scale-pop are visibly different from the inspected Cuphead fight-text artwork. Reproduce the actual reference's lettering silhouettes, transparent framing, size contrast and authored distortion. Our arena, cast, names and mechanics remain the content.

![Revised introduction concept](/Users/eduardoleale/workspace/tactile-game-engine/the-bubble-brigade/bubble-boobble/docs/ui-ux-cuphead-proposal/cuphead-intro-v2.png)

Generated with built-in imagegen using our current engine screenshot as the background and the two inspected Cuphead frames below as lettering references. This image is a presentation concept, not a new gameplay capture. AI redraws of platforms, dragons, portraits and HUD are not approved replacements. Keep the actual existing production art and arena layout when implementing. Exact prompt: [intro-v2-prompt.txt](/Users/eduardoleale/workspace/tactile-game-engine/the-bubble-brigade/bubble-boobble/docs/ui-ux-cuphead-proposal/intro-v2-prompt.txt).

## The introduction should look like this

| Beat | Direct Cuphead visual reference | Brigade specification |
|---|---|---|
| Reveal | Circular black aperture in the Iris Transition collection. | Arena revealed through a true circle; no paper card around the arena, no stylized rectangular vignette replacing the aperture. Radius uses screen pixels and clears all viewport corners. |
| Ready | [Ready frame 13](</Users/eduardoleale/workspace/art/cuphead/extracted/screen-overlays/102767-fight-text/Cuphead/Fight Text/Fight Start A - Ready/FightText_GetReady_0013.png>). White, flowing brush-script lettering with an oversized sweeping R and connected italic strokes. | Text is “Ready?” with the same typographic character and diagonal energy. White strokes with an irregular ink edge; subtle dark separation only where required against bright scenery. Center at roughly 50% width / 48% height of the usable arena, width about 48% of viewport, cap so it clears HUD/insets. No backplate, rules, frame, subtitle, button or timer beside it. |
| Start | [Wallop frame 30](</Users/eduardoleale/workspace/art/cuphead/extracted/screen-overlays/102767-fight-text/Cuphead/Fight Text/Fight Start B - Wallop!/FightText_GetReady_0030.png>). Huge condensed white capitals with irregular contours and surrounding white contour/smear shapes in this intermediate frame. | “BUBBLE UP!” uses the same emphatic condensed, tilted, hand-lettered language and similarly oversized punctuation. Width about 78% of viewport; irregular shared baseline, varied letter widths. A few distinct smear/echo silhouettes lead into a clean legible hold. No standard bold font enlarged to approximate it. |
| Play | The cue clears, leaving the arena as the focus. This flow is proposed; exact Cuphead clearance/input timing is not verified. | Remove every center cue. Keep score, wave and numbered ten-dragon roster. Eliminate duplicate GO tile and beige WAVE 1–GO / safe-start banner. Keep necessary mechanic guidance in dedicated help or conditional HUD states. |

The words and exact percentages are adaptation choices. Cuphead artwork establishes visual forms and intermediate contours; it does not establish playback fps, easing, accepted-input windows or a measured UI timeline.

## Revised animation instructions

All values below are starting estimates, not measured Cuphead timing. Keep the existing three-second first-wave prepare clock and the main proposal's recorded input rules. Practice fire is already permitted during preparation; movement/jump return at the existing combat boundary. No animation may extend that boundary.

- P=0–400 ms: circle opens. Preserve first-wave input rules and discard stale Start/Retry actions. Pause is usable after reveal as specified in the main proposal.
- P=400–520 ms: Ready brush-letter silhouette resolves through authored contour/stroke frames. Do not write it like a modern UI typewriter. Use a short drawn smear or narrow-to-full silhouette with a small contour overshoot.
- P=520–2280 ms: readable Ready hold. A very restrained two/three-drawing contour variation may run briefly and then hold still; avoid a smooth bob or breathing scale loop.
- P=2280–2400 ms: Ready clears through authored opacity/contour frames; scenery remains visible throughout.
- P=2400–2520 ms: BUBBLE UP! enters through distinct thin, expanded/smeared, then clean letter silhouettes. The inspected Wallop frame is an example of the expanded/smeared visual state, not proof that these are Cuphead's exact chronological poses.
- P=2520–2760 ms: clean, high-contrast word hold. Our game’s start phrase reads immediately.
- P=2760–3000 ms: authored streak/dissolve clears the text. At P=3000 ms the center is completely clear and movement/jump become available through the current sim phase, regardless of animation callbacks.

Use document-owned image states/flipbooks and a thin view timeline. A generic scale tween alone cannot create changing hand-drawn stroke contours. Prototype original lettering as a small atlas of entrance/hold/exit drawings; keep the old exact draw-call and memory targets until measurements justify an explicit change. Reduced effects uses static lettering and short fades, preserving the same information and gameplay boundaries.

## Apply the same closeness to the rest of the UI

These are revised art-direction requirements, grounded in the inspected local collections; navigation and precise motion remain proposed until primary footage verification.

| Surface | Replace the loose approximation with |
|---|---|
| Stage billing | Cuphead title-card composition: charcoal/black illustrated card, cream/white display lettering, small “in” connector and restrained studio/billing line. Match the source frame silhouette and spacing; put our stage/mode names into it. Do not reuse the cream settings sheet as a level title. |
| Main menu | Oversized illustrated Brigade title/cast with simple text actions and a drawn focus pointer. Preserve the hierarchy and negative space of the reference, rather than presenting generic filled rectangular buttons. Explicit focus/press/disabled states remain required. |
| HUD | Small inked information clusters and restrained framing. Preserve ten-dragon identity and rescue states; reduce oversized trim and duplicate plaques before adding film texture. The current roster rail in the concept is retained for comparison, not declared the final Cuphead-like HUD. |
| Pause/options | Closely trace the miscellaneous-menu panel proportions, rules and value-arrow language into our own original panel art. Pause stays visually anchored to the frozen arena through the engine scrim. Do not put it on the same full-page ornate backing as title or results. |
| Defeat | Closely follow the tall death-card silhouette, portrait circle, taunt/context area, progress track and vertically stacked Retry/Exit hierarchy. Use our dragon/enemy portrait and honest round/wave progress. The earlier wide generic mockup is superseded. |
| Victory | Large hand-lettered outcome cue first; then the win-screen’s radial theatrical field, celebratory dragon vignette and compact existing metrics. Distinguish it immediately from the defeat card. |
| Loading | Opaque black field with a small animated hourglass silhouette near the safe corner, reinterpreted as our original bubble timer. Avoid a full cream loading page or invented progress percentage. |
| Screen surface | Very restrained edge vignette and short film flecks where readable and within mobile budget. This is supporting texture; lettering, layout and choreography must carry the resemblance first. |

Acceptance criterion for the next visual pass: compare equal-size Cuphead reference and Brigade mockup side by side. The intended reference should be identifiable from silhouette, lettering and hierarchy before reading any title or seeing a film-grain overlay. The current revision establishes that direction for the gameplay introduction; the other screens still require their own reference-matched visual passes before production implementation.

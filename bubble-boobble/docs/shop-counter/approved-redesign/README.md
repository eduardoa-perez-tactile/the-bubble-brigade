# Approved close-counter shop

The user approved `reference.png` and explicitly requested this composition, blinking, and separate layers so the shopkeeper can hide behind the desk. This replaces the previous centered merchant / parchment-panel implementation.

## Runtime layers, back to front

1. `scene-wall.png`: dark painted shelves and wall, no merchant, merchandise, counter or text.
2. `scene-counter.png`: transparent above the tabletop; supplies the wooden surface behind the character.
3. `merchantLayer`: a presenting spool character. `ownerBody` holds the stable open-eye sprite. An eye-only clipping window plays `owner-idle.clip2d.json`: 3.8 seconds open, 0.14 seconds closed. Its two source frames are registered on the same 1430×1100 canvas. Only the eye window is animated so small generation differences elsewhere cannot cause silhouette shimmer.
4. `counterFront`: a clipped second use of the counter texture's lower 30%. It is opaque and renders over the character, independently of merchandise or UI. The view's `ownerHidden` property moves the merchant behind this layer; it does not fade him out. The `hidden` view sample demonstrates this state.
5. Four live product widgets: existing item illustrations, contact shadows, drawn glove cursor and folding price tags. Prices, owned state and equipped state are model values.
6. Live navigation, wallet and compact information area. The purchase label is drawn over a blank torn-paper sprite; no text is baked into the art.

The same screen serves all districts. Presentation-only native Flipbook playback never enters game simulation. Reduced effects uses a static open-eye clip. The controller resolves landscape/tablet/portrait layout from recorded viewport dimensions; UI documents own all layout poses and visual states. Existing purchasing, save isolation, retry application and one-power rules remain authoritative.

## Art generation

All eight new PNGs were made with the built-in ImageGen tool from the approved reference (the closed-eye edit instead references `owner-open.png`). Exact prompts are in `prompts.md`. Assets live in `assets/cartoon/shop/`; the `shop-presentation` group explicitly includes only the new layers and clips, leaving rejected earlier art out of the group's residency. All new PNGs have phone-low import size overrides.

## Focused verification

- `gameengine test --tier t0,t1 --js v8 --filter 'powerup shop*'`: five shop tests, including native keyboard/button transactions, supported screen control bounds, Help, actual timed blink pixel changes, stable body pixels during blink, opaque desk occlusion, and purchase availability while the owner is hidden.
- Inspected actual engine captures of open eyes, closed eyes, hidden owner, portrait and ultrawide/insufficient funds; UI documents checked through `gameengine ui doc check`.
- Broad suites, Hermes, pipeline recording, cook and physical-device GPU/thermal measurements remain deferred under the project's prototype policy. Typecheck continues to report the two pre-existing tuple errors in `tests/adventure-compact.test.ts` (200, 208); no new shop errors.

The image concept is a composition target, not a baked screenshot used in the game. Native fonts and state-dependent labels remain editable and responsive.

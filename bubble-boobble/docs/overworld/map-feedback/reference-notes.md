# Map feedback: reference and approval notes

Status: reference/design only. **Current user correction: the older art guide is out of date; the actual shipped game artwork is the authority.** Existing map paintings, geography, door leaves and destination coordinates remain authoritative. Mission indicators require approval of a fresh in-context sample before import or implementation. No reference-game assets are proposed for shipping.

The earlier A/B/C marker study and its PDF-derived palette prescription are rejected and superseded. They are not approved production directions and must not be reused as an implementation specification.

## References actually inspected

The local Cuphead library `INDEX.md`, collection `161300-overworld-locations`, and collection `161266-porkrind-s-emporium` were inspected. These remain outside the repository. The following image paths are relative to that local library:

- `extracted/overworld/161300-overworld-locations/Cuphead/Overworld Locations/Inkwell Isle I/Porkrind's Emporium/world1_icon_shop_0001.png` and its three-drawing family.
- The corresponding Isle III `world3_icon_shop_0001.png` and three-drawing family.
- `extracted/menus/161266-porkrind-s-emporium/Cuphead/Porkrind's Emporium/Backgrounds/shop-background.png`.
- The separate `Backgrounds/shop_table.png`, `shop_drawer_left.png`, `shop_drawer_right.png` and chalkboard/price-number artwork.
- `Porkrind/Idle/pig_idle_0001.png`, plus the collection's recorded acting families.

The original **Theatrical Cel Adventure** PDF was inspected earlier, but the user has explicitly superseded it. Its palette, glyph examples and claims of style compliance do not establish approval. New work must be compared directly with the current dragon, residents, title lettering, items and painted maps.

Current shipped references reviewed for this correction:

- `assets/cartoon/menu/logo.png`: cream lettering, dark ink and scarlet offset depth.
- The actual green menu dragon in the newly captured menu-reveal goldens.
- `assets/cartoon/frames/item/clock.png`: illustrated gold object with dark contour and authored highlights.
- `assets/cartoon/frames/item/pink_candy.png`: rounded bright item with ink, bounded shadow and highlight shapes.
- Actual existing map dragon, residents and lighthouse scenery in the three temporary marker context captures.

The newest user attachments are not present in this subagent's inherited context; no claim is made that those attachments were inspected. This audit uses the current repository images and actual engine captures named below.

## What the shop reference establishes

The map shop is a distinct, compact exterior with a large integrated **SHOP** fascia, an open threshold, curtains and physical access steps. The inspected exterior has no merchant drawn in its doorway or on its counter. Three authored drawings preserve the same footprint; they do not turn the map exterior into a miniature shop interior.

The interior is a separate theatrical composition: a quiet central field, framing shelves at the sides, a substantial foreground counter, separate drawers/product illustrations/prices, and a large readable merchant. The collection records six idle, 27 welcome, 14 nod, 23 clock-check and 34 goodbye drawings. These counts establish authored acting families, not verified playback timing.

For Brigade:

1. Keep each existing district stall as the map's shop location, with a legible integrated SHOP label. Leave its counter/doorway free of NPC sprites. Avoid crowding the small counter with extra stock and decorative layers.
2. Reuse the original spool merchant as a fully grounded street resident on nearby clear paving. Give it its own foot anchor/shadow and separation from the counter, player approach, fences, steps and water. It must neither appear pasted onto the shop nor obstruct the interaction radius. Validate positions independently in all five maps.
3. Put product choice, coin prices, owned/equipped state and purchase actions in the shop screen. Borrow the reference's separation of scenic frame, product display and transaction information, not its wagon design, pig character, shelves, lettering or raster art.
4. The map shop and shop screen need different information density. A small exterior should identify a place; the interior can explain four products and an equipped starting power clearly.

## Rejected historical marker directions

The earlier bubble token (A), admission ticket (B) and PDF-derived bare ink family (C), including their old approval board, were rejected. Do not restore them, implement their colors, or treat the previous A-versus-C recommendation as current advice. The user's criticism concerned their generic polished UI/sticker appearance and their failure to follow the actual game.

Any old prompt/provenance record mentioning the PDF describes historical generation input, not the current art authority.

## Approved shipped-art direction

The current study is `marker-study-shipped-style.png`, generated with actual current logo, menu dragon, clock and candy references. Its three samples are a cream exclamation with red offset depth, an illustrated gold closed padlock, and a rounded green check. The user approved this direction after seeing the actual in-map sample. The three state drawings are now normalized into fixed mission-marker sprites.

Read-only review inspected all three actual temporary world captures:

- `.gameengine/marker-context-available.png`
- `.gameengine/marker-context-locked.png`
- `.gameengine/marker-context-cleared.png`

The available exclamation most directly inherits a specific shipped-art feature: cream/red/dark title lettering. The gold lock's contour, shading and highlights are consistent with the shipped clock; the check's rounded green body and highlights relate to existing bright item art. A glossy highlight is not automatically a style defect: the actual clock and candy already use illustrated highlights, regardless of what the old PDF prescribed.

The lock and check remain familiar generic symbol shapes; the study is not automatically distinctive merely because references were supplied. At the actual lighthouse capture scale, however, all three states read clearly, the markers are subordinate to the player, and none has a large sticker container, modern map-pin tail or glow halo. No contrast or scale blocker was visible on that cream-wall background. This observation does not replace user approval.

Only the Harbor lighthouse context has been inspected for these markers. Readability over darker foliage, other facade colors and crowded architecture is not yet established. Review placement and scale on the other facades as part of the final engine pass; the single-lighthouse sample alone does not prove all 25 buildings. Shape must continue to distinguish locked/available/cleared; color alone is insufficient. Preserve the original door painting and approach collision.

The audit itself was read-only. The user's subsequent approval authorized the fixed three-state integration; no additional map decoration was requested.

## Closed-curtain visual audit

Inspected the actual `curtain_start`, `curtain_middle` and `curtain_end_menu` goldens in both:

- `tests/goldens/title_curtain_lifts_registered_splash_onto_prepared_menu_at_2520/`
- `tests/goldens/title_curtain_lifts_registered_splash_onto_prepared_menu_at_360/`

Both start frames show closed red cloth and its gold hem only. Neither start frame has a logo, dragon, prompt, menu text or scenery on the cloth. Both middle frames keep the cloth undecorated while revealing the main menu below the rising hem; partial menu/dragon occlusion by that hem is the expected curtain reveal, not artwork printed on the cloth. Both end frames expose the prepared main menu, with its title and dragon in the scene behind the curtain. No actionable visual defect was found in these six inspected frames.

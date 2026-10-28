# Shop feedback: stacking and illustrated state

The user clarified that powers stack and asked for the shoe selection zoom to work, ownership artwork over the price tag, and an illustrated active indicator. This supersedes the earlier one-equipped-power design in the shop proposal and implementation notes.

## Behavior

- Buying an upgrade permanently enables it alongside every other bought upgrade. There is no equip or unequip step or control.
- Each new encounter snapshots the purchased power IDs in catalog order into `pending.startingPowers`. The encounter runner grants all those flags. A retry captures the full current set again. Granting starting flags does not generate pickup rewards or sounds.
- Buying another upgrade cannot mutate an already-captured attempt. Duplicate/unknown/unowned receipt IDs are rejected.
- Existing version-2 Adventure saves remain valid. `equippedPower` and singular `pending.startingPower` remain readable legacy fields. An old in-flight single-power receipt keeps that captured value; the next new attempt uses all owned powers. Legacy equip/unequip actions are no-ops. No purchase or currency migration is needed.
- Losing a life still removes the in-encounter effects; beginning/retrying an encounter restores the complete purchased set.

## Presentation

The shoe's intrinsic size and its selected scale previously wrote the same `art.scale` pose; the later large-item pose won. Intrinsic sizing now belongs to the inner artwork, while selection and press feedback transform its outer frame. A render test measures the selected shoe becoming at least 7% wider and returning to the original width.

The plain OWNED price text is replaced by a drawn ownership sticker, and the EQUIPPED text is replaced by a star/check sprite. The footer shows the full set of starting-power illustrations with small active emblems. The large transaction area shows the ownership sticker for a bought item and a Buy button for an affordable unowned item.

## Art provenance

Built-in ImageGen was used with `approved-redesign/reference.png` as style reference; no scene assets or unrelated artwork were replaced. Saved PNGs and their import metadata:

- `assets/cartoon/shop/owned-marker.png`: transparent cream sticker, green check and authored OWNED lettering. Phone-low maximum import dimension 512.
- `assets/cartoon/shop/active-marker.png`: transparent gold star/check emblem. Phone-low maximum import dimension 512.

Final ownership prompt:

> Create one production UI ownership badge matching the simple hand-inked 1930s cartoon shop in this reference. A small cream paper sticker with slightly uneven torn edges, thick dark brown outline, a large confident forest-green check mark, and small hand-painted dark ink uppercase lettering 'OWNED' below the check. Compact horizontal badge about 2:1 aspect. Use large legible shapes, warm watercolor paper and flat ink, minimal texture, no glossy bevels, no realistic lighting. This sprite will sit OVER a physical price tag after purchase. Tight crop with little transparent margin. Transparent background, no shop scenery, no characters, no other objects. One badge only, exact text OWNED.

Final active-emblem prompt:

> Create one small production game UI active-power emblem matching this hand-painted 1930s cartoon shop. A bright golden five-point star with chunky irregular dark ink outline and one small cream highlight, paired with a tiny black-outlined green check tucked on its lower-right edge. Simple flat ink-and-paint, clean silhouette legible at 24 pixels, restrained watercolor, no gradients or glow. No text, letters or numbers. Single compact emblem, tight crop, fully transparent background. No other objects, no scene, no panels. It means a purchased power is automatically active.

## Prototype verification

Focused V8 T0/T1 `powerup shop*` checks cover stacking receipts, legacy receipts/save round-trip, all four purchased flags in actual encounters and retries, purchase input/duplicate prevention, supported control bounds, the existing blink/desk layering, and the shoe selection regression. Desktop and portrait ownership/stacked-state captures were inspected. UI document and asset validation are included. Full suites, Hermes, historical replay re-recording, cook/pipeline work and device measurements remain deferred under PROJECT.md. The two known typecheck errors in `tests/adventure-compact.test.ts` remain outside this change.

# Shared shop counter

The same shop screen serves the vendor in all five Adventure districts. The user approved the shelf/detail/purchase/equipment composition, then requested a generic reusable shop with simpler 1930s cartoon art and a matching shopkeeper. No map exteriors or destination positions change.

## Flow

- Four stable product positions; selecting a product never spends coins.
- One explicit Buy & Equip action, or free Equip for an owned power.
- Equipped and unaffordable products show a noninteractive status in place of the purchase control.
- The wallet, shelf ownership and single starting-power slot update together.
- Left/right browse; down moves from a shelf product to its transaction. Up returns to the selected product. Further down reaches Remove and Back. Escape returns to the map.
- Purchases, prices, save compatibility, first-clear rewards and encounter/retry rules are unchanged. Losing a life clears the active effect, not ownership.

The controller supplies `shop-model.ts`; `shop.view.tsx` only binds the model and emits intents. The shop, product and action are editable UI documents. Documents were authored using `gameengine ui doc` inspection and validated atomic save, followed by `gameengine gen`. Existing item illustrations are reused. The scene art has its own `shop-presentation` asset group, acquired on shop entry and released on exit.

## Art provenance

Both new images were generated with the built-in ImageGen tool. They are background/sprite assets, not baked interface screenshots. Labels, prices, selection states and controls remain native UI. No Cuphead assets ship with this change.

`assets/cartoon/shop/interior.png` final prompt:

> Production background plate for a reusable 1930s cartoon video-game shop interior. Landscape 16:9, simple hand-painted watercolor shapes and bold dark ink contours, muted warm brown, cream, soft desaturated green. Generic tiny shop with broad empty counter across at 55 percent height, its dark wooden front filling lower 40 percent. Quiet central wall occupies central 70 percent, two simple shelves at far sides with just a few abstract jars, subtle draped cloth at top corners. Large clean shapes, flat values, minimal hatching, restrained watercolor texture, no ornate detailing, no shiny modern 3D finish. Fits every game level: NO harbor, ropes, anchors, boats, ocean, windows, location-specific props or scenery. NO characters, merchant, products, candies, shoes, signs, labels, lettering, text, numbers, UI panels or buttons. Empty counter so interactive game item illustrations can be placed on top; quiet wall behind for merchant layered separately. Simple theatrical 1930s animation background, charming but highly readable, no decorative clutter. Full bleed opaque landscape image.

`assets/cartoon/shop/merchant.png` used `assets/overworld-living/common/npc/vendor-0.png` as its character reference, with transparent background enabled. Final prompt:

> Create an upper-body shopkeeper sprite of this exact friendly cartoon spool-of-thread character, preserving the tan thread spool body, black smiling facial features, blue-and-tan hat and blue clothes. Simple 1930s ink-and-paint cartoon, bold dark contours, flat hand-painted fills, restrained highlights. Front view, smiling, leaning forward with both white-gloved hands resting flat on an imaginary horizontal shop counter at the bottom edge. Show hat, face, upper body and two hands only; crop at waist at bottom, NO legs, NO feet, NO visible counter, NO background, NO props, no text. Transparent background. Sprite compact wide roughly square, all hat and hands inside image with small padding. Match supplied character identity; avoid glossy 3D or ornate detail. Single merchant, fully transparent outside silhouette.

## Prototype verification

`gameengine test --tier t0,t1 --js v8 --filter 'powerup shop*'` passes four focused tests: save/receipt compatibility, all four purchases and retry application, safe reachable controls at 360×880 / 768×1024 / 1280×720 / 2520×1080, and real keyboard/button input for browsing, spending, owned equipment, insufficient funds, removal and return.

Affected settled view captures were inspected at 1280×720, 360×880 with top/bottom safe insets, and 2520×1080 with a left safe inset; no layout warnings. Desktop, portrait and ultrawide are engine captures, not standalone browser playtests.

Typechecking reports two pre-existing tuple errors in `tests/adventure-compact.test.ts` at lines 200 and 208; no errors in the changed shop code/tests. Broad suites, Hermes, cook/pipeline recording and device performance were deferred under PROJECT.md's prototype policy.

## Composition refinement

The Cuphead comparison pass enlarged the existing merchant sprite to occupy the central scene, added contact shadows and small wooden product stands, and replaced the faint selection label with inked brackets. Plaque artwork tilts independently of its upright text. The detail panel now contains just the selected name, benefit, replacement consequence and transaction; the repeated large illustration and benefit sentence were removed.

Help toggles the encounter/retry rules on demand. Greeting text no longer occupies a permanent strip; that area appears only for transaction feedback. A short welcome lean and departure gesture use the document's Enter/Exit poses; successful purchases/equipment changes trigger a finite native nod (100 ms in, 70 ms hold, 190 ms return). The merchant remains still afterward. The existing static sprite supplies these poses; no new character frames or location-specific art were introduced.

Focused V8 shop tests cover Help toggling without spending and the purchase reaction trigger as well as the existing transaction flow. Narrow portrait layouts group the scene vertically instead of stretching the empty wall. Broad verification remains deferred under the prototype policy.

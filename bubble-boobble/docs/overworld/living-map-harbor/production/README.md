# Five-map living-map rollout

The existing Harbor, Garden, Carnival, Cloudtop and Foundry maps now use layered sprite drawings for local animation and interaction. Open [the production review](review.html) for actual Game Engine captures. The previous harbor study remains historical.

## Result

- Exact foot-to-solid collision stops corner clipping. Existing harbor planting beds and Cloudtop water basins block walking; all 55 existing destinations remain reachable through actual movement. All 25 encounter doors require the visible front approach and a clear path to the threshold.
- Closed, open and cleared doorway drawings plus focused ENTER / REVISIT / LOCKED text clarify entrances. Door drawings are clipped to the original painted door leaves.
- Four held shoreline drawings follow each existing coastline; Cloudtop animates its two existing pools. A local cleanup layer covers the old foam only in measured shore regions. The lighthouse uses four registered lantern-window drawings. No runtime particles, generic wave stamps, gradient beams or added flags.
- A buoy guide, spool merchant and envelope courier inhabit each map, with registered blink/gesture drawings. Shop foregrounds are exact cuts from the original counters, putting the merchant behind the counter.
- A clear SHOP label and visible powerup stock identify each existing district stall. Pink / blue / yellow candy and shoes cost 10 / 15 / 20 / 25 coins. Purchases are permanent, equip immediately, and permit one starting power. New attempts and retries apply it without pickup score or counters. Existing profiles, keepsakes, coins and receipts migrate into save version 3 / Adventure version 2.

The five base paintings, geography, destination coordinates, source transforms and camera framing remain unchanged. The preservation manifest explicitly permits two interaction-radius corrections so the unchanged coin and Mist Circle anchors can be reached from safe ground. This improves authored collision; it does not claim a pixel-perfect collision outline for every painted detail.

## Art and composition

Source prompts and generation inputs are in `tools/overworld/living-sources/`; `build-living-art.py` normalizes anchors and clips generated pigment to measured source regions. `build-shop-occluders.py` extracts original counter fronts. These tools never rewrite the five base PNGs. `verify-living-art.py` verifies all 146 shipping sprite hashes, canvas sizes, nonempty alpha, fixed import settings and at least three distinct coastline drawings per district. Existing Theatrical Cel Adventure direction controls palette, actor contrast and silhouettes; no reference-game raster art was imported.

The new source-sized coast canvases are deliberately registered overlays. Keep door details / residents in their small named atlases, and district art in the existing streamed district groups. The fixed presentation pool remains 48 slots with explicit overflow failure; sampled full plans peak at 28 slots before a focused doorway label. Reduced motion holds rest drawings.

## Verification

All gameplay verification uses Game Engine APIs. See the local evidence summaries beside this file. The full T0 run passes 511 cases on each of V8 and Hermes with zero mismatches. A fresh actual-input shop purchase / launch / retry / persistence recording verifies 992 steps on each runtime; it uses the production scene, without replay rehashing. Typecheck, validation with existing warnings, pipeline coverage, desktop cook and 600-frame cooked smoke pass.

All changed map, HUD and shop render goldens were inspected at the supported extremes. Only the three affected overworld golden families and the two campaign map checkpoints were refreshed. The campaign intro and result goldens remain unchanged. A separate clean worktree at the pre-rollout commit reproduces 40 existing T1 failures and the same four structural-budget failures; no unrelated golden or threshold was changed to hide them. See `baseline-t1-comparison.json` for exact case names and errors. Targeted reruns establish the changed overworld flows; the complete legacy render suite is not green.

Fresh Android cooked memory passes unchanged budgets: districts 0.88–0.94 MiB / 2 MiB, shared 1.929 MiB / 2 MiB, and scenario peak 38.203 MiB / 48 MiB. The 768 phone-low cap forces a mip chain under the 1024 source cap, selecting approximately 512 logical texels for coast drawings. Local paused-host CPU / rendering diagnostics and cooked estimates do not establish physical-phone FPS, GPU overdraw cost, application RSS or sustained thermals. No physical phone test was performed.

## Reproduce

Run from the engine project directory:

```sh
node tools/overworld/approval/verify-map-preservation.mjs
python3 tools/overworld/verify-living-art.py
gameengine test --tier t0 --js both --json
gameengine test --tier t1 --filter '*overworld*' --json
gameengine test --tier t1 --filter 'powerup shop*' --json
gameengine replay verify tests/replays/powerup_shop_purchases_equip_one_actual_starting_power_and_retry_reapplies_without_pickup_rewards.greplay --js both --json
gameengine cook --platform android --json
gameengine memory report --device phone-low --json
gameengine check --json
```

Do not refresh unrelated render baselines or archived migration evidence. The PR remains subject to review and explicit merge authorization.

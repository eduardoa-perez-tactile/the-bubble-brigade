# Independent story-room rollout review

Scope: the remaining 20 encounters, bringing all 25 to compact rooms, while preserving the five approved rooms 1/2/4/5/6 from main `a704f8c8`. This branch is a user review proposal; no merge or broad art approval is inferred.

## Verification design

New focused tests pin complete approved level hashes and the six approved art manifests from the main baseline. All 25 levels must be 40 columns for lighthouse 1 or 44 columns otherwise, preserve original enemy-kind order/counts and finale-wave kinds/counts, keep every player/enemy/pickup/wave cell inside the compact volume, and select a complete reference family without old generic kits.

Every physical shelf is independently enumerated as a contiguous non-wall tile interval. Authored control tours start at the real player spawn and use `stepGame` movement/jump inputs. A shelf counts only after a grounded visit with the player's full 44-unit body supported within its bounds. The tour must visit every interval, including both split upper terraces in 23. A further jump from each highest tier verifies actual maximum crown clearance; all highest tiers leave room for the complete 126 world-unit jump. The implementation replaced the proposed ceiling-limited row 6 lookout in 23 with split row 10 wings before testing.

The same controller runs through recorded live-engine `ArcadeInput` for 3/7/11/16/21, one changed representative per border family. `AdventureMoment` grants temporary survival grace and advances encounter time, without movement upgrades, teleports or geometry edits. Isolated pure routes freeze enemies for geometry diagnosis. Finale 10/15/20/25 second-act checks explicitly trigger real arrival staging from both flanks and center, verify safe separated arrivals inside 44 columns and unchanged anchors through countdown. Their flank setup is not route evidence.

Crown, platforms, wall faces and HUD bounds are checked at 344×882 (top inset 32), 1280×720 and 2520×1080. Captures include all 25 native rooms, narrow/ultrawide representatives 3/7/11/16/21, and four native second acts: 39 images. All 25 native images require independent visual inspection; representative geometry or a source-master preview cannot stand in for this.

Measured mobile-tier/phone-low draws and actual shared/active-episode/total residency are reported below. Existing project 40 MiB shared-texture and 48 MiB total targets remain unchanged; existing memory debt is not a pass. No numerical resemblance claim is made for a new fair design or reused themes without an approved exact scene reference.

## Focused evidence

Final coordinator run `.cache/story-room-rollout-verified.json` is `ok:true`: all four focused V8 T0 cases and all 39 T1 images pass after selective approval of the independently inspected images. Its `mismatches` and `structural` arrays are empty. The earlier missing-baseline run was retained as review evidence rather than relabeled as a passing comparison. No source changes followed visual approval.

The other focused selections also pass: four existing compact-layout T0 cases; two approved-prototype T0 cases plus nine T1 captures (all existing prototype images match exactly); and two existing story-boundary T0 cases plus 15 T1 captures. Only the intended compact-room images for levels 16 and 21 in the legacy boundary selection required coordinator inspection and selective approval. Across the four selections this is **12 T0 cases and 63 T1 captures**. The selected recorded live replay separately verifies **3,350 steps with `firstDivergence:null`**. These are focused prototype checks, not a full-suite claim.

The 25 isolated control tours visit **96 physical shelves** in 11,246 controlled simulation ticks. Every tour starts at its authored player spawn, uses no movement upgrades, reaches every enumerated shelf with full-body support, returns to the floor and demonstrates the full 126-unit jump from its highest tier. Tours take 339–562 ticks. Stage 23's split-upper tour took 562 and stage 24's five-shelf tour 515. The first stage 23 attempt stopped 4.5 units before its intended gap, remaining on the adjacent ledge; moving its controller target from column 20 to 21 fixed the route while retaining the original geometry and every-shelf assertions.

Live recorded engine controls pass for 3/7/11/16/21, taking 483/354/483/488/488 gameplay ticks respectively. The whole recorded engine case includes 3,350 engine steps with navigation/loading setup. Persisted input evidence is `tests/replays/story_room_rollout_recorded_live_engine_controls_traverse_each_affected_border_family.greplay`. Pure `stepGame` tests are meaningful engine-host simulation checks but their zero-ECS-step replay wrappers are not independent recorded-gameplay evidence.

All 12 finale arrival combinations pass: 10/15/20/25 from left/center/right floor positions. Each second act retains three original kinds, arrives within 44 columns with safe separation, and preserves its landing anchors through countdown. No old column 48 wave remains. Approved five complete level hashes and all six approved art manifests match main `a704f8c8` exactly. Every original opening enemy-kind order/count and second-wave kind/count is preserved across 25 rooms.

## Independent visual acceptance

Inspected all 39 actual Game Engine images individually in `.gameengine/t1/story_room_rollout_shows_all_twenty_five_native_rooms_and_affected_family_screen_extremes/`: 25 native openings, 10 responsive extremes and 4 second acts. This is not an inference from five representatives. All native frames show intact outer returns/feet, continuous matching floor joins, readable blocking structure and all platforms. The architecture continues above the viewport, avoiding an arbitrary visible cap. Actors remain readable against the varied backgrounds and the floor/base art shares the reference family's original density.

The per-room result below is **accepted for the user's review**, not a claim of user approval, automatic merge authorization, exact-scene resemblance or a numerical similarity score.

| Level | Room | Family | Physical shelves reached | Native visual result |
| ---: | --- | --- | ---: | --- |
| 1 | Lantern Landing | Lighthouse | 3 | Approved stone composition and landings preserved. |
| 2 | Parcel Panic | Parcel oak | 3 | Approved oak/brass frame, sorting lanes and floor preserved. |
| 3 | Sailcloth Shuffle | Parcel oak | 4 | Oak fits the sail loft; five sprites separated across shelves and air lanes. |
| 4 | Pressure Trouble | Copper pipe | 3 | Approved valves, body planes and floor/plinth joins preserved. |
| 5 | Tugboat Tussle | Bubble | 2 | Approved curved film, emitters and shallow deck preserved. |
| 6 | Dewdrop Steps | Garden stone | 4 | Approved greenhouse piers and four-terrace composition preserved. |
| 7 | Acorn Antics | Garden stone | 3 | Warm treehouse backdrop contrasts with the cool stone; ivy/root mass ties the frame to the woodland theme. |
| 8 | Willow Waltz | Garden stone | 4 | Open willow/sky view remains readable through the twin upper terraces. |
| 9 | Bramble Bounce | Garden stone | 4 | Waterfall vista stays distinct behind the compact right ascent and twin lower shelves. |
| 10 | Woodland Welcome | Garden stone | 4 | Garden arch and left upper terrace form a complete finale room; footer remains clear. |
| 11 | Kettle Capers | Fair oak | 4 | Red inset/teal trim fits carnival painting; full deep fascia and both feet intact. |
| 12 | Depot Dash | Fair oak | 4 | Harbor fair background supports distinct lower lanes and right ascent; no HUD obstruction. |
| 13 | Pinwheel Pranks | Fair oak | 4 | Central launch and split middle lanes remain distinct against the sail/wheel backdrop. |
| 14 | Thunder Workshop | Fair oak | 4 | Workshop props remain outside the blocking piers; five enemies visibly distributed. |
| 15 | Last Call at the Fair | Fair oak | 4 | Warm sunset and canopy complement the red/copper finish; deep footer-facing base stays readable. |
| 16 | Lantern Hops | Bubble | 4 | Bright membrane and brass emitters read clearly against pale cloud scenery. |
| 17 | Firefly Ferry | Bubble | 4 | Deck, lanterns and sky retain a coherent ferry room with both lower flanks visible. |
| 18 | Moonpool Mischief | Bubble | 4 | Cool pool/architecture is visible through the film; central lower platform stays distinct. |
| 19 | Reedpipe Ruckus | Bubble | 4 | Waterfall/reedpipe setting remains distinct, with all five enemies separated. |
| 20 | Marshlight Matinee | Bubble | 4 | Pale arch and compact deck work together; left upper finale terrace remains readable. |
| 21 | Crystal Commotion | Copper pipe | 4 | Pipe silhouettes and matched floor/plinths fit the glassworks overlook at compact scale. |
| 22 | Foundry Frolic | Copper pipe | 4 | Warm furnace sides and cool arch center support the copper frame; clear right ascent. |
| 23 | Tempest Tangle | Copper pipe | 5 | Revised split row 10 wings keep all five shelves visible and full jump headroom. |
| 24 | Boiler Brigade | Copper pipe | 5 | Six original enemies occupy five shelves plus air lane without overlapping opening silhouettes; boiler backdrop remains readable. |
| 25 | Skybell Send-off | Copper pipe | 4 | Bell vista and compact finale platforms fit the pipe family, with intact frame/feet and readable wave HUD. |

The additional 344×882 and 2520×1080 actuals were inspected for 3/7/11/16/21. Portrait intentionally crops exterior decoration under the existing framing policy, while inner collision cues, every shelf and HUD remain visible. Characters are small in this existing all-room portrait fit; no zoom was introduced that would hide platforms. Ultrawide retains complete exterior feet/returns with the room centered and backgrounds bleeding to the edges. The long bubble film remains one smooth curve per side, with no repeated crescent stack. Tall architecture uses only the plain shaft continuation.

Fair 11–15 has the deepest new fascia (155 source pixels,150.46 canonical world units), extending decoratively behind the footer band. Direct inspection of all five native frames and the fair narrow/wide views finds the lives/remaining labels and icons readable, with no gameplay silhouettes hidden by the base. No footer or physics change was needed. Native second-act 10/15/20/25 images show all three arriving enemies inside the room, wave 2/2 HUD and readable transient second-act text. That text briefly lies over background/platform decoration in 10/20, without obscuring actors or controls.

**Visual verdict: all 25 rooms and all 14 additional captures are accepted as a complete, coherent proposal for the user to inspect.** There is no remaining old generic wood/vegetation kit in runtime family selection. Broader user approval and merge remain outstanding, by design.

## Art and rendering review

The new fair master is 1672×941 RGBA with design faces 344/1333 and floor 750. Its new red/teal/copper palette complements the fair paintings without replacing the already approved five rooms. Independently decoded left/right profiles and full floor match exact RGBA source crops; all five runtime PNG SHA256 values match the manifest. Exterior alpha clearances are 27 and 25 source pixels, retaining full shoulders and feet. The raw five-PNG RGBA estimate is 4,179,772 bytes (3.986 MiB), not a runtime residency measurement. Plain shaft continuations use the disclosed repeated source band; ornate collars are not repeated through the whole height.

Family atlas/group isolation remains in place: active episode group members are its existing background plus its own reference family's PNGs. Approved lighthouse/pump/bubble groups have 9 members and parcel/garden/fair have 6. Each captured group is loaded with no failed members. Border presentation remains static geometry/art without new simulation state, per-step animation or schema changes. Existing translucent ambient shadows and bubble film remain the principal overdraw surfaces; measured draw counts stay bounded as below.

## Mobile metrics and open memory finding

Actual mobile-tier / phone-low capture observations on the host (not physical-phone GPU/thermal evidence):

| Metric | Bytes or calls | MiB where applicable |
| --- | ---: | ---: |
| Peak sampled draw calls across 39 images | 15 / 50 limit | — |
| Shared courtyard resident textures | 49,736,856 | 47.433 |
| Active lighthouse group, including background | 3,715,632 | 3.544 |
| Active parcel group, including background | 4,180,760 | 3.987 |
| Active garden group, including background | 4,093,864 | 3.904 |
| Active fair group, including background | 4,572,692 | 4.361 |
| Active bubble group, including background | 2,753,576 | 2.626 |
| Active pipe group, including background | 4,447,504 | 4.242 |
| Minimum total resident during this capture sequence | 160,716,910 | 153.272 |
| Maximum total resident during this capture sequence | 189,943,094 | 181.144 |
| Maximum total resident textures | 188,154,072 | 179.438 |
| Resident audio | 1,789,022 | 1.706 |

**Project memory targets do not pass:** shared textures exceed 40 MiB by 7.433 MiB, and total residency remains above 48 MiB throughout this capture sequence. This sequence spans all episode families and retained caches; it is not a controlled before/after attribution of new fair art. Family isolation avoids a single atlas pinning all new border families, but does not remove pre-existing shared-content/cache debt. The final 39-sample run also reports actual engine texture pressure: 15 samples have a non-null `overBudget` message against the configured 128 MiB texture budget, stating that no released assets remain available to evict. Recorded `overCount` ranges from 2 to 21 across the samples. Later null `overBudget` values do not establish a memory pass or erase earlier pressure. Engine budgets are 192 MiB total, 128 MiB textures and 32 MiB audio; the stricter project 40/48 MiB targets also remain unmet.

The selected typecheck reports only the same four pre-existing unrelated errors: `tests/adventure-compact.test.ts`200/208 safe-area tuple types and `tests/overworld-weather.test.ts`90 tuple /92 nullable string. Full suites, cooks, Hermes parity, broad replay sweeps and physical-phone GPU/thermal performance remain deferred under `PROJECT.md`'s prototype policy. No standalone desktop or browser gameplay automation was used.

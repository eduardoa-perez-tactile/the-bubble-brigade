# Independent compact room prototype review

Scope: Parcel Panic (2 / post-office) and Dewdrop Steps (6 / garden-1) only, initially based on main `d0388361`, then rebased onto current main `b62c3a99` (including the intervening menu/doorway changes) and reverified. The accepted compact lighthouse, pump station and tugboat are the architectural benchmarks. The older generic wood/vegetation kit is rejected by the user and does not establish visual acceptance for these prototypes. No numerical similarity claim is made for new themes without an approved new-theme reference.

## Verification design

`tests/compact-room-prototypes.test.ts` pins full serialized level hashes from main for all other 23 encounters, including their tile arrays, spawn positions, enemy identities and episode/wave data. Prototype checks preserve four enemies and each original enemy-kind ordering, the original player cell, and no second wave. Actual floor travel is compared with the same encounter and physics on an explicit plain72-column floor width control; this is not claimed as an exact historical encounter replay. New food and power cells must lie inside the compact collision volume; original 72-column food positions cannot survive unnoticed.

Each route starts from the authored player spawn with unupgraded jump/movement. Parcel visits both row-18 flanks and row-14 center before returning to the floor. Garden visits row-18 left, row-14 center and both row-10 terraces before returning. Routes assert actual grounded feet against expected rows after real simulation steps. The same controller runs through recorded engine `ArcadeInput` in live episodes. Its recorded `AdventureMoment` setup grants 600 ticks of invincibility and advances encounter time to tick235; it does not teleport, freeze enemies, alter platforms or grant movement upgrades. The separate isolated simulation route freezes enemy motion to diagnose geometry independently of combat. These checks establish traversal, not live encounter difficulty or completion time.

Crown bounds at route landings and the observed highest jump, all platform drawings and both actual collision stops are checked against screen/HUD bounds at 344×882 with top safe inset32, 1280×720 and 2520×1080. Focused captures show both prototypes at all three sizes plus native lighthouse/pump/boat, nine images total. Render tests log actual shared/active-episode/total residency and sampled peak draw calls against the existing50-call bound. Project memory targets remain40MiB shared textures and48MiB total; pre-existing memory debt is not a pass.

## Actual engine and visual evidence

The coordinator's `.cache/compact-room-prototypes-current-main-verified.json` is `ok:true`: both focused V8 T0 cases and all nine requested T1 images pass, with empty `mismatches` and `structural` arrays, after selective approval of the inspected images. The earlier missing-golden result was not a geometry, asset or structural-budget failure. The isolated and recorded live routes visit every new shelf. Final isolated route times are348 ticks for Parcel and483 for Garden; recorded live-input routes take349 and483 ticks. Observed true highest player body Y is166 for Parcel and70 for Garden, after a full126-world-unit jump from each highest shelf. Same-shelf jumps from the highest landing test the full crown above that landing, rather than treating the ascent jump as the highest possible jump.

Floor travel is187 ticks versus336 for the explicit72-column width control, a44.3% reduction. All23 complete main-layout hashes match. Four enemy identities/counts, player spawn, no second wave and all compact spawn/pickup positions are checked. Live-engine input uses recorded `ArcadeInput`, with replay at `tests/replays/compact_room_prototypes_recorded_engine_controls_traverse_both_live_episodes_without_upgrades.greplay`. The pure simulation case is separate evidence and does not claim to be recorded ECS gameplay.

Independent visual inspection covered `stage-2` and `stage-6` at344×882,1280×720 and2520×1080, and native1/4/5, under `.gameengine/t1/compact_room_prototypes_show_complete_parcel_and_garden_architecture_with_approved_native_benchmarks/`.

| Criterion | Parcel Panic | Dewdrop Steps |
| --- | --- | --- |
| Complete architecture | Single substantial oak piers, intact collars/feet and joined floor | Stone greenhouse piers, bronze ribs, intact feet and joined corbel floor |
| Materials and lighting | Coherent continuous wood grain, restrained brass fittings, separate side lighting | Stone joints, restrained moss/ivy/root asymmetry, matching metal and warm light |
| Room composition | Two lower sorting lanes and shared middle landing form a compact encounter | Center tier connects both upper terraces without a wide empty side lane |
| Floor joins | Stone cap runs cleanly into oak bases; fascia shares source proportions | Cap and corbels join both stone feet; root mass remains outside playable volume |
| Responsive result | All shelves and movement cues visible; footer text readable | All four shelves and movement cues visible; footer text readable |

**Visual verdict: accepted as two prototypes for user review.** Both meet the approved house/pump/boat benchmark for coherent, connected architectural finish. The rejected stretched generic wood/vegetation modules are absent from these two rooms. This is independent qualitative judgment, not user approval of a wider rollout, a95% similarity score or pixel identity with another theme.

Native and ultrawide views show complete exterior feet/returns. Portrait deliberately crops exterior decoration under the existing framing policy, retaining the inner blocking cues and the whole room/platform layout. Architecture continues above the viewport rather than ending at an arbitrary cap. Parcel's134-source-pixel fascia is124.05 canonical world units deep; Garden's114-source-pixel fascia is103.93. Their decorative lower edges exceed the40-world-unit reserve and lie behind the native footer band, but inspected lives/remaining labels and actor icons remain readable. No footer reservation change is needed for these prototype images. Portrait's narrower room makes actors small, as in the existing accepted presentation; this is disclosed rather than hidden by a camera zoom that would crop platforms.

## Source and asset review

Independently decoded both1672×941 transparent source masters and all final runtime PNGs. The six final profile/full-floor pieces match their source crops exactly in RGBA. Every reviewed runtime SHA256 matches its manifest. Each shaft stores eight identical repetitions of its plain top32 source rows, with source-exact alpha. CoreGraphics premultiply/unpremultiply PNG roundtrip changes RGB by at most1 channel value for Parcel and2 for Garden; the importer/README disclose this and do not claim byte-exact source RGB for shafts. No geometric source resampling or hand-painted masks are used. Exterior profile alpha margins are at least8source pixels for Garden and19 for Parcel; internal floor overlaps intentionally touch crop edges.

Unused floor-left/center/right pieces were removed from both active kits. Each episode now loads five family PNGs plus its pre-existing background, with dedicated `compact-room-parcel` / `compact-room-garden` atlases. Exact group inclusion assertions prevent old generic kits being pinned by the active prototype group. Uniform profile scale and unmirrored side art are asserted in actual captures.

## Performance and limitations

Actual mobile-tier / phone-low residency captures sampled12 draws for both prototypes and14 at the boat benchmark, below the unchanged50-call limit. These are host structural observations, not physical-phone GPU or thermal measurements.

| Actual captured metric | Bytes | MiB |
| --- | ---: | ---: |
| Shared courtyard textures |49,736,856|47.433|
| Active Parcel episode, including background |4,180,760|3.987|
| Active Garden episode, including background |4,093,864|3.904|
| Initial Parcel total resident |152,477,854|145.414|
| Largest total in nine-shot sequence |155,007,490|147.827|
| Parcel source RGBA estimate, five active PNGs |3,787,840|3.612|
| Garden source RGBA estimate, five active PNGs |3,700,944|3.529|

**Memory targets remain unmet:** shared textures exceed40MiB by7.433MiB and observed total residency exceeds48MiB. Existing released-group caches and other game content contribute to the total; this different capture sequence is not a controlled before/after attribution. Separate family atlases prevent loading both new border families through one named atlas. Source RGBA estimates are not substitutes for the runtime figures above. `overBudget` was null, while `overCount` rose from zero to five across this sequence. Those status fields do not establish compliance with project40/48MiB targets.

The coordinator's recorded typecheck has the same four pre-existing unrelated errors: `tests/adventure-compact.test.ts`200/208 safe-area tuple types and `tests/overworld-weather.test.ts`90 tuple /92 nullable string. Prototype scope defers full suites, cooks, broad replay sweeps, Hermes parity and physical-device GPU/thermal measurements. No gameplay/desktop automation was used.

The coordinator also verified four existing compact-layout T0 cases and both existing story-boundary T0 cases. The existing fifteen-shot story-border T1 case passes after inspection and selective approval of only the four intentional stage2/6 baseline changes. Its other eleven reference captures already matched main unchanged. Combined selected coverage is eight logic cases and twenty-four screenshot comparisons across the two T1 cases; this is not a full-suite claim. Final legacy output is `.cache/compact-room-prototypes-current-main-story.json`.

The recorded live-control replay separately verifies 1,258 engine steps with no divergence (`.cache/compact-room-prototypes-current-main-replay.json`, `ok:true`).

One legacy alpha-clearance assertion assumed every isolated pillar rectangle had transparent padding on both horizontal edges for its entire height. These complete U-frame profiles deliberately include the matching floor handoff: the painted cap touches the inner crop edge two to five source pixels above the physical walking-plane anchor. Above that join the profiles have 8–35 pixels of horizontal clearance, so no column shoulder is cut off. The updated test allows at most six cap-crest pixels, requires outer margin throughout and at least two pixels of both-side clearance above the join, and checks recorded first-contact/join rows. PNGs and source geometry were not changed to satisfy this assertion.

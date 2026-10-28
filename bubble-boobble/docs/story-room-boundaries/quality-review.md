# Story boundary visual and performance review

## Scope and acceptance

Review the borders in the approved lighthouse, pump-station and tugboat
illustrations against actual Game Engine captures. The target is at least
95/100 on the border-only visual rubric below. This is a documented design
assessment, not a claim of 95% pixel similarity or whole-scene SSIM. The
illustrations and game have different actor positions, platform layouts and
viewport framing; those are outside the similarity score.

Timber and vegetation have no original approved border mockup. Review them for
consistent finish, readable limits, preserved gameplay and proper screen fit;
do not invent a reference-similarity score for those families.

The existing timber/vegetation kit is intentionally broadened rather than
uniformly scaled: 96×512 shafts draw at 192×768, 192×224 bases at 256×224,
and 192×64 collars at 224×64 world units. This changes horizontal aspect by
33.3%, 33.3% and 16.7% respectively. Source art and the current stage 2/stage 6
ultrawide captures were inspected: wood grain, organic vine wrapping and metal
studs remain credible, with no reference-fidelity claim. These transforms are
not used for the original lighthouse, pump or boat profiles, whose architectural
and emitter proportions are checked independently at uniform local scale.

## Rubric, 20 points per category

| Category | Evidence needed for full credit | What loses credit |
|---|---|---|
| Silhouette | All major shoulders, returns, pipe runs, plinths or membrane curves survive; alpha bounds leave the full outside outline intact. | Missing or squared-off contours, unintended horizontal crop, obvious duplicated ornaments. |
| Proportions and landmarks | After body-plane/floor registration, independent held-out landmarks agree within 5 native pixels; local texture scale remains consistent in wider family variants. | Wrong block/valve/emitter scale, stretched profiles, displaced bands or unbounded scaling with room width. |
| Materials | Original foreground RGB provenance, with source hashes and exact crop/translation records; recognizable grain, masonry, metal and soap film. | Repainted or flattened materials, blur, background baked into the cutout. |
| Lighting | Original left/right highlights and shadows remain distinct and agree with the setting; alpha joins avoid halos. | Mirrored lighting, artificial edge brightness, dark seams, obvious new glows or tonal mismatch. |
| Joins | Floor cap/fascia and column or emitter bases connect with no unintended gaps or duplicated caps; original floor details survive. | Floating feet, abrupt floor transitions, lost source fascia or decorative intersections that obscure gameplay/HUD. |

A category can score 19 for a small visible deviation that retains the reference
identity and satisfies its geometric constraints. A visible missing landmark or
failed 5-pixel check scores at most 18 and requires another pass before the
near-match target can be accepted. Scores must cite the inspected capture and
concrete retained features and deviations.

The original pump illustration places its standing pipe bodies around source
x435/1237, while its gameplay floor extends from x344 to1327. Reproducing both
sets of positions literally would either let actors enter the pipe art or make
the local pipe details substantially oversized. The implementation may preserve
the original local pipe scale and register each visible body to the existing
collision face, with matching floor endcaps following it. Any such change must
lose proportion/layout credit and be quantified explicitly. Held-out local
landmarks are assessed after this declared per-body registration; they must not
be presented as a successful 5-pixel match of the whole-room spacing. A correctly
documented spacing adaptation is not a missing local landmark, but it prevents
full proportion credit even if every extracted profile pixel is original.

Pump source columns are partly hidden by foreground posts, a character, side
platforms and HUD lettering. The authorized reconstruction of those occlusions
must be counted separately from copied source RGB. Boat film and the glass in
its brass emitters require background decontamination; generated or unmatted
RGB there is likewise not copied source RGB. The source fractions, declared
repair/glass regions and pixel equality outside those regions must be recorded.
An overall source-RGB fraction must not be substituted for that outside-region
check, and a low copied fraction must not be described as pixel-identical art.

## Independent source-RGB check

The final decoded PNGs were compared directly with their approved source crops,
independently of the importer counters. For pump profiles, the allowed region
is the recorded repair-weight mask plus the exact declared side-platform
inpaint rectangle. For emitters it is the declared original-source glass
predicate `G+B>2*R+40`. Outside those regions, every RGB channel is unchanged:

| Asset | Independently checked outside-region pixels | Changed RGB pixels outside region | Original visible-solid RGB fraction |
|---|---:|---:|---:|
| Left pump profile |232,324|0|79.2745%|
| Right pump profile |261,061|0|91.3474%|
| Left boat emitter |6,473|0|78.3982%|
| Right boat emitter |6,404|0|78.5991%|

The pump profiles have 49,868 and 22,326 changed RGB pixels respectively, confined
to source rows 632–897 and 636–897. Their shafts and complete original floor have
zero changed RGB pixels. The complete original boat floor likewise has zero
changed RGB pixels. The emitter differences are glass decontamination; the
original brass remains exact outside that predicate. Boat film is generated,
decontaminated RGBA registered to the original double-outline geometry; its RGB
is not claimed to be copied original material.

The independent outside-region counts use the stored, quantized weight PNG and
the full declared inpaint rectangle, so they need not equal the importer's
floating-weight counts. Both checks find zero outside-region changes.

The focused tests enforce at most 25% reconstructed visible-solid pump pixels,
at most 25% changed pixels in each full profile rectangle, exact source frames
and inpaint rectangles, recorded mask provenance, and exact outside-region RGB.
This replaces the earlier whole-profile 90% guard after inspection established
that the source foreground post/HUD/player occludes more of the left base. The
bound was changed explicitly with coordinator authorization and decoded-pixel
evidence; the lower copied fraction is disclosed rather than called 95% exact.

## Final verification coverage

- Inspected all 15 actual engine captures: lighthouse/pump/boat at344×882,
  1280×720 and2520×1080; timber/vegetation at344×882 and2520×1080; full-width
  foundry21 and springs16 at1280×720.
- Two focused V8 T0 cases passed: all25 movement clamps, body registration,
  full crown/flyer headroom for reference families, unchanged game state,
  reduced-effects stability and Arcade/Party exclusion.
- The complete 15-shot render case passed its state, asset-loading and
  draw-call assertions. Each active episode group was loaded with no failed
  members. After this review, the coordinator selectively approved only these
  15 inspected visual baselines and reran the focused selection: both T0 cases
  and the complete T1 case passed, with no structural failures or mismatches.
  Final machine output: `.cache/story-boundary-final-verified.json`, `ok:true`.
- Checked imported alpha clearance, source provenance, outside-repair RGB and
  independent actual-pixel registration. No chopped cornice, missing original
  floor, actor/platform remnant, hard repair rectangle or wavy membrane remains.

## Independent actual-pixel registration

In addition to the semantic source-landmark tests, inspect the rendered PNGs
independently of the drawing code. Detect SIFT features inside each source
profile's alpha>240 mask, eroded with a3×3 kernel. Match to the actual1280×720
engine capture with SIFT contrast threshold0.02, up to6000 features and a0.70
nearest-descriptor ratio. A deterministic seed73 partitions
matches 80/20. Fit a partial affine transform to the training matches with a
2.5 pixel RANSAC tolerance, then check the held-out matches and compare 10
spatial control points omitted from fitting against the independently logged
native draw transform. This detects actual renderer translation, scale or
aspect errors; it does not measure whole-scene similarity or certify a mask's
semantic correctness. Source contour/landmark tests and visual inspection still
have to establish complete silhouettes.

The final atlas-scoped run gave:

| Profile | Training inliers | Held-out matches within 2.5px | Maximum native control-point error |
|---|---:|---:|---:|
| Lighthouse upper left |254|64/65|0.119px|
| Lighthouse lower left |66|15/18|0.136px|
| Lighthouse right |389|100/100|0.087px|
| Pump left |674|171/172|0.088px|
| Pump right |752|188/190|0.094px|
| Boat left emitter |8|3/3|0.331px|
| Boat right emitter |9|3/3|0.246px|
| Foundry left pipe |306|75/79|0.158px|
| Foundry right pipe |321|80/83|0.158px|
| Springs left emitter |7|2/2|0.233px|
| Springs right emitter |10|3/3|0.154px|

Descriptor ambiguities produce a few held-out matching outliers; they are
disclosed in the counts. All independently fitted native control-point errors
remain below0.34px, well inside the5px allowance. The wider rooms preserve the
same canonical local art scale rather than enlarging valves or emitters with
the room span.

The film was also checked independently against the original image's actual
white double-outline pixels at source rows100,200,300,400,500,600 and700 on each
side. After the declared film registration, maximum native center error was
0.872px left/0.607px right in the boat, and1.212px left/0.657px right in the
springs. Maximum outline-spacing error across those checks was0.781px. This
checks actual rendered pixels, not only the importer's fitted-curve report.

## Final visual score

| Reference encounter | Silhouette | Proportions/landmarks | Materials | Lighting | Joins | Total |
|---|---:|---:|---:|---:|---:|---:|
| Lantern Landing |19|20|20|20|19|98/100|
| Pressure Trouble |20|17|19|20|20|96/100|
| Tugboat Tussle |19|19|19|19|20|96/100|

These are border-only design-review scores after inspecting actual native,
narrow and ultrawide captures. They meet the95/100 visual target; they are not
claims of95% copied RGB or95% whole-scene image similarity.

- **Lighthouse:** full upper cornices, outer/lower returns, mature stone block
  scale, original asymmetric lighting and the complete corbelled floor remain.
  Deductions acknowledge reconstructed crate-occluded lower-left outline/joins.
- **Pump:** original coupling/valve scale, complete pipe/plinth silhouettes,
  asymmetric copper highlights and original cap/fascia/end joins remain.
  Profiles move outward by91 and90 source pixels to align visible body planes
  with unchanged physics: the original802-pixel body gap becomes983 source
  units at canonical scale, a22.6% spacing adaptation. This costs three
  proportion points. The formerly occluded lower-base repairs remain slightly
  softer/darker than exposed original metal, costing one material point.
- **Boat:** original curved double outline, brass emitter size, deck cap and
  ring hardware survive; film meets both brass caps without gaps. Deductions
  cover the additional faint straight inner movement cue, vertical film extent
  adaptation for tall views, generated/decontaminated film/glass material and
  small glow-compositing differences. No whole-scene or copied-film RGB claim
  is made.
- **Timber/vegetation:** accepted for consistent finish and clear boundaries,
  without a reference score. No blank boxes, halos, missing bases or misleading
  low rails appeared. Their broadening is declared above.
- **Screen/variant review:** native reference silhouettes are complete;
  ultrawide rooms retain their identity. Portrait views intentionally crop
  exterior decoration while retaining continuous body cues, all playable
  platforms and a clear HUD. Full-width foundry/springs preserve canonical local
  material density and join their longer floors with balanced center modules.

## Performance and remaining memory finding

The selected mobile-tier/phone-low case measured a peak of14 draw calls against
the existing50-call Adventure limit, on an Apple M2 Max/Metal release host.
This is structural host evidence, not physical-phone GPU or thermal evidence.

The review found avoidable preloading of all border families in the shared
gameplay group and named atlas. The slice now loads the selected border family
through its existing episode group and gives each family its own named atlas.
This preserves the existing load/transition lifecycle and all bitmap geometry.

| Runtime residency metric | Matched main413dda3a baseline | Final slice |
|---|---:|---:|
| Shared courtyard textures |50,744,472B /48.394MiB|49,736,856B /47.433MiB|
| First story capture total |138,274,178B|140,589,274B|
| Entire review-journey peak total |139,836,946B /133.359MiB|150,549,746B /143.575MiB|

The shared group decreases by1,007,616B. First-capture total increases by
2,315,096B; the previously observed eager-family loading was reduced by about
7MiB. The seven-episode review journey still retains released content in caches,
so its cumulative peak increases by10,712,800B. The largest active adventure
group measured4,447,504B, including its existing background and selected border
family; this is not a border-only byte count.

**Open memory-budget finding:** the shared courtyard still exceeds the40MiB
project target by7.433MiB, although it is below the matched main baseline.
The cumulative journey total also exceeds the project's48MiB peak target. No
project memory-budget pass is claimed. Runtime `overBudget` was null; `overCount` rose from zero in the first
setting to six later in the journey. Those status fields do not establish
compliance with the explicit project budgets. The engine reports its larger192MiB total/128MiB texture policy, and
the loose-run counters also require separate interpretation from the earlier
cooked Android reports. Neither raw source-pixel estimates nor the old cooked
38.2MiB courtyard report prove this current runtime budget passes.

The focused geometry/assets/render-cost and visual review is accepted for the
requested prototype slice. Memory debt and cumulative cache growth remain
explicitly open; budgets were not raised or rewritten to hide them.

Project-wide TypeScript checking still reports exactly four pre-existing
errors outside this slice: tuple arguments in `tests/adventure-compact.test.ts`
at200/208 and `tests/overworld-weather.test.ts` at90, plus a nullable string in
the latter at92. No error in a changed slice file was reported. These are
disclosed separately from the passing focused Game Engine checks.

Physical-phone GPU timings, thermals, cooked content, cross-runtime parity and
full-suite coverage remain deferred under the project's prototype policy.

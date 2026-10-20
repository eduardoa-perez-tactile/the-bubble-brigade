# Technical feasibility: a 1930s cartoon reskin

Investigation date: 20 October 2026. This is a source review and a proposal, not an implemented renderer or a performance certification. No gameplay code or source art was changed. Existing test results below are historical evidence explicitly identified as such.

## Verdict

I can implement a convincing playable cartoon vertical slice using this game's current simulation, local co-op, enemies, bubbles, rescue rules and arena. The difficult parts are producing consistent animation and keeping ten characters readable; replacing a texture is the small part. A polished Cuphead-scale animation library is a substantial art production task and cannot honestly be promised from one image-generation pass.

Use higher-resolution source frames with the existing world coordinates and hitboxes first. Source resolution, drawn world size and camera framing are independent choices. A 256-pixel drawing rendered in the current 48-world-unit box improves edges; it does not make the character occupy more of the screen. Enlarging the visible body much beyond its collision box would make narrow passages, enemy contact and bubble origins misleading.

## What multiplayer actually means here

- The party defines ten fixed identities, with one human and nine bots by default; slots can be human, AI or empty (`src/arcade/party-config.ts:2–11`). Classic retains one/two-player behavior (`docs/ten-dragon-prototype.md:3–7`).
- Input is local keyboard plus raw engine gamepad events, reduced independently for indices 0–9 (`src/arcade/party-input.ts:6–26`, `45–76`). Recorded input state survives replay/rollback in a sim document (`:84–91`). A source search of `src`, package/config found no network transport, matchmaking or online session implementation. The rollback reference in a comment is not evidence of an online game.
- The controller report explicitly says ten physical controllers, disconnect neutralization and reconnect order are unverified. There is no recorded controller connected/disconnected event; stale held input can require pause and slot reset (`docs/controller-input.md:41–54`). Art changes neither fix nor worsen that contract inherently.
- Current player damage uses specific contact rectangles, e.g. 34×36 for dragon/enemy contact (`src/arcade/player.ts:93–109`); rescue uses axis distances below 52 world units (`src/arcade/party.ts:84–89`). Keep these authoritative rules during the first visual experiment.

An online version would be a separate engineering project: transport, authoritative ownership or synchronization, joining/leaving, latency, reconnection and multi-machine testing. Existing deterministic input/replay architecture is useful groundwork; it is not a completed networking layer.

## The real rendering change

Production gameplay does not currently draw its character art as conventional filtered sprites. It builds an ordered draw plan and renders pooled imported static quad instances (`src/arcade/presentation.ts:42–63`, `392–419`). An integer `textureLoad` shader intentionally preserves original texels and uses a mask blend with 0.999 alpha cutoff (`assets/materials/pixel-ordered.material.ts:35–49`). Partial-alpha texels are composed against earlier draws on the CPU, then emitted as opaque pixel runs (`src/arcade/pixel-renderer/ordered.ts:15–33`, `70–99`; `docs/rendering.md:19–43`).

That is an excellent solution to the existing pixel-parity requirement, but a poor default destination for smooth antialiased cartoon art. More partial-alpha edges increase capacity/work in that compositor; its atlas dimensions and palette encoding also appear directly in shader math. HD art must not simply replace the current atlas PNG and assume the old pipeline scales.

Recommended architecture:

1. Retain the deterministic simulation, recorded input and current Classic renderer.
2. Add an opt-in cartoon presentation theme that reads the same match state and emits filtered atlas sprites with normal GPU alpha blending. Prove the built-in sprite path first; the historical reason it was unsuitable was interpolation of pixel art, which is desirable for smooth drawings. If it cannot supply the required sorting/clipping/batching, use a dedicated filtered quad material.
3. Create a small art manifest with clip name, frame duration, image, grounded pivot, visual bounds and muzzle anchor. Current animation selects one frame per ten 60-Hz ticks, about 6 drawings per second (`src/arcade/presentation.ts:48–63`). A proposed 12-drawings/second cartoon cadence needs explicit clip timing rather than silently inheriting this global divisor.
4. Ground every frame to the same anchor. Keep squash, stretch, anticipation and landing recovery cosmetic. Do not delay the shot, jump or hurt response merely to finish a drawing; a muzzle flash/exhalation pose can follow the actual shot event.
5. Atlas characters and effects by shared scene use, trim transparent margins, and produce `.gmeta` import sidecars through the engine workflow. The engine atlasing skill supports shared pages and recommends 2048-page maximum on mobile and 4096 on desktop. Validate batching and transparent borders in cooked as well as live content.

This is a moderate engineering change with a narrow prototype route. The animation/art normalization and ten-player polish are harder than the renderer adapter. The existing cold viewport regression also matters: static imported quad instances work where dynamic meshes previously needed an offscreen render to initialize (`docs/rendering.md:124–145`). Any new route must be checked in a cold engine viewport, not only screenshot tests.

## Camera and why ten players need a different composition

`gameengine camera list --json` was run read-only during this investigation. It reported one `flat2d` orthographic camera, WorldView-driven position/size/fit, with a shake rig. The live edit-world values were center `[0,0]`, orthoSize `5`, aspect `9/16`; these are pre-game values and must not be confused with the gameplay boot, which explicitly writes center `[384,360]`, orthoSize `360`, aspect `768/720`, Contain (`src/arcade/presentation.ts:376–389`).

The ten-player courtyard is 44×30 tiles, 1056×720 world units (`src/arcade/party-arena.ts:2–16`; `src/arcade/types.ts:3–9`). `arenaLayout` scales the board inside HUD bands, with 96 units of jump headroom; wide layouts use horizontal gutters (`src/arcade/arena-layout.ts:1–20`; `src/arcade/presentation.ts:443–448`). Current documentation estimates drawn bodies at only 34 pixels wide in the 768×720 reference view (`docs/ten-dragon-prototype.md:85–92`). The small-screen silhouette is the acceptance target, not the character close-up.

Approximate source-to-screen example with a 48-world-unit sprite envelope: the current native layout uses scale `min(752/1056, 624/816) ≈ 0.712`, giving a **34.2-pixel** envelope; wide 1680×720 uses the height limit, about **36.7 pixels**. Standard Contain fitting at 640×960 additionally maps 768 logical horizontal units to 640 physical pixels, giving about **28.5 pixels**. These are layout-derived estimates without safe-area insets or pose stretch, not new screenshot measurements. A 256-pixel source therefore shrinks roughly 7.5× at native and 9× in the tall case. Pie-cut eyes, fingers and ink texture must survive that reduction; portrait/tall framing remains a strong constraint even with high-resolution sources.

| Arrangement | Recommendation | Technical/readability consequence |
|---|---|---|
| 1–2 players | Richer large drawings, current board first; evaluate bounded group framing later | Easy to appreciate expressions; any tighter shot must preserve incoming enemies and rescue targets. |
| 3–4 players | Shared whole-arena view initially | A practical primary visual target: show the animation without excessive crowding. |
| 6–10 players | Fixed shared wide stage, strong silhouette/identity rules | Keep the whole board visible. Zooming to one cluster hides teammates at opposite edges; larger source frames alone cannot solve this. |
| Ten-way split screen | Do not make this the initial reskin approach | Tiny panes defeat the art goal and duplicate rendering. Engine camera skill also notes 2D draws occur in every camera; isolated views need proof. |

My recommendation is to support the existing ten-slot mode, but approve the new look using both a 2–4-player beauty scene and a deliberately crowded ten-player stress scene. A close-up hero illustration cannot establish party readability. A wide 16:9 presentation redesign could make better use of desktop space, but it requires HUD/layout work and new aspect-ratio validation rather than an arbitrary camera zoom.

For ten players, use bold exterior contours, light face/belly patches, flat ownership colors, different horn/crest/ear or accessory silhouettes, and a common compact body envelope. Keep platform tops unambiguous and background contrast below actor contrast. Avoid giving each character radically different collision-implying proportions. Use large expressive poses when celebrating or in the lobby; favor compact combat silhouettes while everyone shoots.

Bubble ownership should read through a colored rim or short tail while captured, elemental, danger and rescue states retain distinct shapes and behavior. Do not color the entire screen with opaque bubbles. Current bubbles already store cosmetic `Shooter` ownership separately from simulation effect semantics (`src/arcade/types.ts:96–110`). Existing names appear during preparation and rescue, and otherwise disappear in combat (`src/arcade/juice.ts:58–77`). Add permanent symbols or selective human markers only after reviewing crowding; changing label policy is a deliberate UX decision, not an incidental consequence of the reskin.

## Cost and performance: known numbers and unknowns

The project's existing structural presentation ceiling is **14 draw calls** (`tests/budgets/presentation.json:1–6`), stricter than generic skill guidance. Preserve it as the initial target and investigate any increase; do not silently relax it. More atlas pages can break batches when interleaved by draw order, so page packing must be evaluated in the ten-player scene.

Historical courtyard probe, documented 19 October, used a release V8/Metal desktop host with mobile rendering tier: ten-player simulation p95 **1.697 ms**, sampled presentation p95 **1.614 ms**, process memory **273.25 MiB**, peak **6 draws** (`docs/ten-dragon-prototype.md:162–177`). A separate sustained ten-shooter scenario observed 36 simultaneous bubbles and eight desktop/six mobile draws (`:179–184`). These are reported existing results; I did not rerun them. They do not establish new-art performance, physical phone GPU timing or thermals.

Computed source-frame storage examples, RGBA8 without compression/mips/padding/copies:

| Illustrative content | Texture bytes |
|---|---:|
| One 48-frame character, 128×128/frame | 3 MiB |
| Ten independent 48-frame characters, 128×128/frame | 30 MiB |
| One 48-frame character, 256×256/frame | 12 MiB |
| Ten independent 48-frame characters, 256×256/frame | 120 MiB |

These are arithmetic scenarios, not an asset inventory or measured final budget. They show why ten fully separate 256-pixel frame libraries can become expensive before enemies, bosses, backgrounds or engine copies. Shared animation geometry/palette regions and fewer unique combat frames can reduce cost; accessories and alternate outlines still need authoring. Source resolution should be chosen from target screen footprint, not merely from how attractive a large concept sheet looks.

A full 2048×2048 RGBA8 atlas page is **16 MiB**. At 256×256 per frame it holds 64 frames with zero gutters; practical padding/extrusion reduces this, so allow roughly one page for a 48-frame character only after measuring the pack. Ten unique character pages can allocate **160 MiB** of page storage even when the raw useful frames total 120 MiB. One shared master animation set plus shader recoloring can approach one master page, whereas two independent master body sets plus compact accessories costs closer to two pages plus accessory storage. These are distinct authoring choices: recoloring is inexpensive, ten independently acted body shapes multiply drawing and cleanup work. Do not apply a whole-sprite tint that also recolors black ink, pale eyes and highlights; use explicit palette/mask regions or authored variants.

Keep MSAA 1/HDR off on mobile/compat as already configured (`project.gameengine.json:23–34`). Prefer baked paint/paper texture to multiple full-screen transparent film layers. Mobile guidance targets 30 fps for phone-low, roughly 8 ms per 60-Hz simulation step and a 33.3 ms frame containing two steps; its default texture guidance is 120 MB and low-tier RSS 350 MB (`.agents/skills/mobile-performance-review/budgets.md:18–28`, `78–84`). These are starting guidance, not measured game guarantees. Full-screen grain, heavy bloom, huge translucent bubbles and dense dust are potential fill-rate costs even with few draw calls.

Existing verification is not uniformly green across GPU tiers: the latest project report records 38/44 phone-low mobile render cases passing, with six general render cases failing exact color or draw-count checks (`docs/ten-dragon-prototype.md:186–195`). Keep that known baseline visible when judging new failures.

## A concrete vertical slice I can deliver

| Phase | Output | Difficulty for me | Acceptance gate |
|---|---|---|---|
| Art direction proof | Original character key poses, one stage treatment, 2–4-player scene and ten-player stress mockup | Low–moderate | Coherent shape language; distinguish all ten players at final displayed size. Static art is only a direction proof. |
| Renderer spike | Feature-flagged cartoon theme; one dragon walk/jump/shoot/land/hurt plus bubble/pop; current collisions | Moderate | Correct anchors/mirroring; smooth filtered edges; cold viewport visibility; game-state/hash equivalence for the same inputs. |
| Playable party slice | Two polished protagonists, eight readable derivative identities, one enemy family and one themed courtyard | Moderate–high | Real ten-slot recorded firing/rescue scenario, readable enemy and bubble states, framing at 768×720, 1680×720, 640×960 and 2560×1080. |
| Production art pass | Remaining enemy families, boss phases, all pickups/effects, lobby/HUD/results, content loading | High; content volume dominates | Reviewed animation motion, consistent line weight/pivots, atlas/memory/draw budgets, cooked rendering and replay coverage. |
| Hardware/group validation | Real controllers, group readability, low-phone sustained measurement if phones remain a goal | Requires hardware and people | No disappearing players/targets, identify own character quickly, controlled device frame time/thermals. |

I can independently implement the engine integration, asset normalization tools, manifest, frame timing, testing and iteration. Image generation is useful for designs and first-pass frames, but cannot guarantee consistent proportions, clean in-betweens, stable ink or animation acting without frame-by-frame review and cleanup. I would not promise feature-film drawing quality or Cuphead's animation density from a fully automatic pipeline.

No precise calendar estimate is justified before the renderer spike and one approved animation cycle. Use the vertical-slice gate to measure actual iteration speed before committing the full reskin. The first scope should stay one stage/one enemy/two polished dragons plus ten identity treatments, rather than require an entire finished cast before seeing movement.

## How implementation must be verified later

Record baseline hashes before changing presentation, then compare identical sim traces. Run focused engine logic/render cases and replays for jumping, firing, capture, rescue, boss and results. Capture the full arena at the listed aspect ratios, plus a cold live engine viewport. Profile the same crowded replay before/after with `perf.stats`, `render.stats`, `profile.markers`, atlas and memory reports; recook and run the project check when implementation exists. Measure steady and first-load cost separately. Follow PROJECT.md: use Game Engine tests/replays/viewports, and do not substitute OS/browser automation or a standalone desktop play session.

This investigation ran only source reads and `gameengine camera list --json`. No new gameplay behavior, new texture budget, animation quality, controller hardware, group readability, web build, device GPU time or thermals was established. The game lists desktop/web platforms; project guidance still flags browser-only builds as incomplete. A reskin does not by itself resolve web deployment.

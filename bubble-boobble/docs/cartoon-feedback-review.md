# Cartoon feedback adaptation review

This is a source audit of the current hand-drawn presentation, not a new measurement. The prior native animation scenario reported a peak of 14 draw calls (`docs/animation-study/2026-10-22/implementation-results.md`); the implementation needs fresh native tests under the phone-low profile.

## What transfers from the pixel-art version

| Original improvement | Decision for this presentation | Reason and current evidence |
| --- | --- | --- |
| Expressive bubbles | Adapt | Keep the existing small-to-full release, transparent owner-colored shell and foreground mouth order. Use restrained oval deformation, rounded glints and a short colored bead trail. Use a separate capture ring; retain fixed shell and captive drawing sizes. Avoid pixel squares. |
| Pops and scoring | Adapt effects; retain text | Use smooth expanding rings and a few rounded droplets. `arcadeDrawPlan` already supplies stronger >=400 reward text and CHAIN announcements, and modern presentation retains those texts. Do not duplicate awards or change scoring. |
| Dragon feedback | Adapt conservatively | Foot-anchored airborne stretch, landing compression and short turn squeeze can reinforce drawings. Do not put another periodic scale pulse on the newly drawn walk loop. Preserve the registered first shot muzzle and shared torso/leg seam. |
| Grounding | Adapt | Current native shadows have a constant size and opacity. A projected supporting-platform shadow should narrow and fade with height. Dust should be sparse, rounded and optional. |
| Identity | Adapt missing parts | Native numbered diamonds and HELP plaques are present. Legacy preparation names are marked `pixelOnly` and skipped by the modern path. Restore short, colored introduction names with overlap separation; preserve critical HELP legibility. |
| Richer arena | Keep the painted treatment | The courtyard already contains distant arches, subdued masonry and highlighted platform edges. Legacy palettes, masonry primitives and moving motes are bypassed by native art. A new tinted overlay would obscure painted contrast and change art direction. Defer palette rotation and extra ambient motion. |
| Rescue celebration | Adapt | Native currently draws a single enlarged pop; legacy SAVED text and dedicated sound already survive. Add a small rising rounded ring and a few sparkles; keep SAVED placement and priority. |
| Boss feedback | Adapt | Native selects attack/captured/move drawings and flashes invulnerability, but bypasses the legacy windup compression and hit recoil. Add restrained anchored deformation and a presentation-only impact cue; never freeze boss simulation. |
| Camera feedback | Retain existing bounded rig | `scenes/cartoon.scene.json` already has CameraShake (decay 3, maxOffset [8,6,0], maxAngle 0). `ArcadeFeelSystem` already triggers boss capture/victory (.32), boss hit/wave clear (.22) and clears trauma on pause/reduced effects. Do not add another shake layer or dynamic zoom. |
| Transitions/results | Retain existing; fill selective omissions | Results already use UI documents and victory particles. Native world effects bypass legacy cue confetti; any added world celebration must be short, bounded and disabled for reduced effects. Keep the arena stable. |
| Audio/mixing | Retain infrastructure; connect actual omissions | `ArcadeFeelSystem` already emits rescue, boss-hit, wave-clear and victory cues. Audit classic/native event coverage and voice priority rather than play a second cue for the same event. |
| Reduced effects | Complete native integration | The setting exists and cancels shake, but native `cartoonDrawPlan` does not yet receive it. Decorative bubble wobble/trails, secondary actor deformation, moving knock stars, dust and confetti must respect it. Keep essential bubble growth, capture state, readable knock indicator and labels. |
| Result input safety | Retain and verify | `src/desktop/state.ts` contains RESULT_INPUT_DELAY = 45 (0.75 s at 60 Hz), result readiness and confirmation-release gating. This is useful regardless of art style. Do not implement a parallel timer. |

## Integration checks

- Native effects belong in `src/cartoon/plan.ts` and share the existing sprite pool. Legacy `cueQuads`, `bubblePose`, `dragonPose`, `dragonShadow`, `popQuads` and `arenaBackdrop` are not automatically used by the modern sprite path.
- `advanceFeel` stores cues at legacy pixel coordinates: jump/land feet at `p.Y+92`, rescue center at `p.Y+72`. Native feet are `p.Y+44`. Convert the source coordinate convention once (usually subtract 48), then project with the same native projection. Do not reinterpret legacy cue Y directly as native feet.
- Existing legacy text is transformed by `sceneDraws` through `layoutDraw`, which subtracts the legacy 48-pixel offset, and is then projected by `ArcadePresentation`. Numeric score, CHAIN and SAVED text survive that path. Identity names are deliberately `pixelOnly` and need a native replacement.
- Group solid accents rather than inserting a solid/glint draw between every pair of bubble sprites. Each sprite/solid alternation can split a batch; a ten-player firing stress case matters more than one decorative screenshot.
- Ring and particle counts, frame lifetime, simultaneous events and total pool usage need explicit caps. Preserve important capture/rescue information under overload before decorative trails/confetti.
- Check both party and classic play, pause/resume, restart/reload, reduced effects, point-blank capture, moving and airborne shots, early and final animation frames, ten co-located identities, highest-platform jumps, and narrow/wide safe-area layouts.
- The native replay/hash comparison is required to establish that collision, combat, damage, rescue distance, scoring and movement remain unchanged. Draw-call checks are structural host evidence; real GPU/thermal performance still needs a phone.


## Implemented adaptation and verification

The native cartoon path now uses restrained release stretch, floating drift, brief glints and owner-colored trails; expanding painted pop/capture rims and sparse droplets; foot-anchored air/landing/turn feedback and recovery recoil; fading support-projected shadows and small dust whisks; colored preparation names and HELP ink; separated HELP plaques, badges and knock stars; rescue rings/sparkles plus an outlined readable SAVED label; and modest boss anticipation/recoil and impact rims. Existing numeric reward emphasis, chain text, bounded camera rig, victory UI, audio priorities and 0.75-second release-before-confirm guard remain in use.

The presentation observer also supports cartoon adventure, enabling landing/rescue feedback without accessing optional party state. Cartoon adventure now uses the bounded shot/pop/capture mix; the preserved pixel campaign retains its prior audio path. Reduced effects is passed into native drawing and the UI reduced-motion API: it removes decorative breathing, wobble, trails, moving stars, dust, deformation and confetti while retaining essential growth, capture/rescue feedback, static knock indicators, labels and sound.

Deliberate omissions: no new painted-arena tint cycles or pixel masonry/motes, no camera zoom or extra shake, no global hitstop or held boss animation snapshot, and no additional results-panel/banners choreography. The current painted background and stable UI remain appropriate; bounded world celebration supplements the existing victory particles. Core captive scale and release mouth registration are preserved.

Verification uses the Game Engine workflow only, with phone-low memory coverage: 346 V8 logic tests pass; the 385-step control replay hash trace is identical to its pre-change baseline (`2eb03350686a5b7d`). The dedicated native scenario exercises ten simultaneous jumping shots, landing, capture, pop chains, an actual input-driven rescue and ascending cue, readable SAVED text, four viewport aspects, boss windup, preparation names, nine overlapping HELP calls and reduced effects. Its peak is fourteen draw calls, inside the existing budget. Native captures were inspected; engine typecheck, validation, desktop cook and cooked smoke pass. Existing camera/tile warnings and the obsolete pipeline-record warning remain. Hermes and physical-phone GPU/thermal measurements are unavailable here; no new cross-runtime or hardware claims are made. The full historical render suite was not blanket regenerated.

These changes remain local and uncommitted. Unrelated UI proposal files and source migration evidence were preserved.

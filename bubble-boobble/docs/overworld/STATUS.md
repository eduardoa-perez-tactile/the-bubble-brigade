# Original Adventure overworld status

Integration update, 26 October 2026: the user explicitly authorized merging the complete feature into `main` so the combined features can be playtested there. This supersedes earlier pre-merge playtest restrictions; it does not assert final artistic approval. Current-main music, boss/results and combat/spawn changes have been reconciled and validated for the authorized merge.

26 October 2026: **five-map painting pass completed and engineering checks passed; user art review and playtest pending**. The user has explicitly authorized PR #10 integration into main for combined-feature testing; user artistic approval remains separate. Automated tests do not certify artistic compliance.

Worktree: `/Users/eduardoleale/.codex/worktrees/walkable-overworld/the-bubble-brigade`
Project: `bubble-boobble/`
Branch: `codex/walkable-overworld`
PR: https://github.com/eduardoa-perez-tactile/the-bubble-brigade/pull/10

## Current painting revision

The user rejected the previous compliance claim. All five original maps have received a material/detail/depth pass using the established original courtyard and Theatrical Cel Adventure guide: quieter ground washes, grouped foliage, fewer bright fittings/glass glints and more selective atmospheric edge loss. Each district retains its local colors. The accepted geography, building silhouettes, dragon sheet and all gameplay source remain unchanged.

The harbor received three reviewed iterations before its treatment was propagated. A foundry candidate that shifted lower structures by 10-25 pixels was rejected; its replacement restores the original registration, then receives a localized glass/paving cleanup. Independent geometry review and actual landscape/portrait captures are recorded in `STYLE-PASS-REVIEW.md` and `evidence/style-pass-alignment.json`.

The result is a completed, reviewable repaint, not a claim of exact courtyard matching or final guideline approval. Rounded architecture, some roof modeling/small highlights and mottled paint texture remain. Cloudtop's coin text has weaker contrast on pale clouds, though its existing outline remains readable. See the visual review for specifics.

## Fresh engineering verification

- All ten final captures reviewed with the actual dragon: `.gameengine/style-pass-final/map-{1..5}-{landscape,slim}.png`. Portable contact sheets are in `evidence/style-pass-landscape-review.png` and `style-pass-slim-review.png`.
- Four focused render tests pass: responsive map/card/guide (310 steps), journal/shop (111), real menu-to-encounter-to-return journey (681) and encounter flow (250). Seven affected map-background goldens were intentionally refreshed and reviewed; menu/intro/result goldens were preserved.
- Cooked campaign: **4/4 passed**, including the full 25-encounter campaign and actual button journey.
- Existing replay: **681 steps verified unchanged**; no re-recording or divergence allowances.
- Focused campaign logic: three tests passed on both **V8 and Hermes**, with no runtime mismatches. This is not a full dual-runtime suite or Web/device parity claim.
- `gameengine check` passes typecheck, validation with existing warnings, pipeline validation, desktop cook and 600-frame cooked smoke. The previous pipeline metadata warning is absent in the current check.
- Phone-low declared asset residency remains **37.18 MiB / 48 MiB**; shared characters remain **1.81 MiB / 2 MiB**. All existing gates pass without budget changes. This is a cooked asset estimate, not application RAM or physical-phone performance.

Current portable reports: `evidence/style-pass-final-qa.json`, `style-pass-engine-check.json` and `style-pass-campaign-runtimes.json`. The prior 452/452 V8 full-logic result is retained as history; the full suite was not rerun for this asset-only repaint. Source, UI and geometry hashes did not change. The prior broad render comparison's 17 inherited failures remain historical evidence, not a fresh whole-suite render verdict.

## Provenance and retained gameplay

All 25 encounters, 55 interactions, progression IDs, saves, rewards, gates, retries and return anchors are unchanged. The original eight-direction dragon still supplies planted idle and alternating walk contacts across ten skins. Map and shared sprites continue to use explicit asset groups and the bounded presentation pool.

No Cuphead raster was supplied to generation. All 17 copied prototype PNG identities remain absent from the current assets tree; the external library, baseline UI and archived migration evidence are untouched. Before paintings, current sources, exact hashes and prompts are recorded under `tools/overworld/`, including `style-pass-manifest.json`, `style-pass-prompts.json` and `original-art-manifest.json`.

No fresh CPU/RSS soak or physical-phone measurements were performed for this paint-only pass. Prior JS heap headroom concerns remain; GPU/thermal behavior, hardware controllers, OS focus, browser storage and Web runtime parity still require their environments. See `PERFORMANCE.md`.

## Handoff

All work is committed and pushed. Thirty-minute progress updates pause at this completed handoff. The user has now explicitly authorized merging for combined-feature testing. Merge after integration checks pass, preserve existing local generated/untracked files, and continue user art review/playtesting on main. See `PLAYTEST.md`.

## Combined main integration validation

The branch incorporates main `9341924` (music handoff, boss/results, combat feedback and staged arrivals) through resolution merge `5b4782d`. All three desktop conflicts preserve both Adventure and the newer full-run behavior; document registration remains centralized.

- Full logic: 473/473 on each of V8 and Hermes, then two additional recorded music/B/Escape regression cases pass on each runtime (475 verified cases per runtime). No production edit was required by the added tests.
- Nine focused render cases and four cooked Adventure campaign checks pass. Ten stale boss-finale screenshots already present on main were selectively refreshed for its newer pickup labels/art after visual comparison; thresholds and budgets are unchanged.
- Four scenario recordings were regenerated for the integrated authoritative state and verify on both runtimes: Adventure 681, boss 297, victory 175 and staged spawning 364 steps. Old divergence information is preserved; no hash allowances were added, and old recordings lack per-system checkpoints for precise first-system attribution.
- `gameengine check` passes, including pipeline validation, typecheck, desktop cook and 600-frame cooked smoke. Existing validation warnings remain.
- Combined declared phone-low asset peak 40.18 MiB / 48 MiB, courtyard 38.20 MiB / 40 MiB; all shared/district gates pass. No source artwork, import setting or budget changes were needed for memory. This remains an estimate, not physical-device performance.

Current portable evidence: `evidence/combined-integration-summary.json`, `combined-render-qa.json`, `combined-boss-reference-proof.json` and `combined-main-check.json`. Playtest the primary main checkout described in `PLAYTEST.md`; the user authorized this merge expressly to test all features together.

# Overworld performance review

Measured 2026-10-23. Scope: `src/overworld`, desktop documents/controller/state/model/save, Arcade encounter integration, schema and district asset groups. The runtime sample used the release V8 host on an Apple M2 Max, Metal, mobile render tier, paused headless mode with UI layout. CPU timings are comparative desktop measurements, not phone performance guarantees.

| Measurement | Observed | Budget / interpretation |
|---|---:|---|
| Cooked phone-low asset-group transition peak, with courtyard pinned | 36.03 MiB | 48 MiB project peak; 128 MiB engine texture limit |
| Pinned courtyard group | 35.21 MiB | 40 MiB project group limit |
| District groups 1 / 2 / 3 / 4 / 5 | 0.75 / 0.26 / 0.21 / 0.82 / 0.49 MiB | 2 MiB per district |
| Stationary, 600 sim steps: step p95 | 0.121 ms | Desktop reference; phone-low guidance is approximately 8 ms per sim step |
| Walking, 125 sim steps: step p95 | 0.177 ms | Desktop reference |
| Walking, 60 separately sampled steps with render probes: step p95 | 0.431 ms | Includes different sampling overhead; do not treat as a regression against the batched capture |
| OverworldSystem, separately sampled walking: p95 | 0.113 ms | Desktop reference |
| Sixty mobile-tier render probes: peak draw calls | 12 | 50 in `tests/budgets/overworld.json` |
| New pipelines in those render probes | 0 | None expected during steady play |
| GC pauses over 4 ms / maximum pause | 0 / 1.281 ms | Zero over 4 ms; maximum 8 ms guidance |
| Walking JS heap used | 27.4 MiB | 32 MiB low-end guidance; approximately 86% occupied |
| Runtime RSS capture peak | 288.1 MiB | 350 MiB low-end guidance; desktop process only |

## Interpretation

The measured scenario has no budget blocker. The controller keeps `courtyard-gameplay` pinned throughout the cartoon session, so the memory report explicitly used `--always courtyard-gameplay`. Omitting that option understates map residency. District travel releases the previous map group before loading the next behind a loading cover; release makes content eligible for eviction rather than guaranteeing immediate deallocation.

The cooked phone-low report estimates declared asset-group residency. It is not total application RAM and does not include every ungrouped UI/audio allocation or renderer cache. Runtime RSS was sampled separately. Original map PNG bytes are preserved; phone-low texture reduction is configured through import metadata.

JS heap headroom needs a repeated district/combat transition soak. A single walking capture does not establish bounded long-session growth. Compare settled heap after repeated identical cycles, allowing first-use caches to warm before choosing the baseline.

## Measurement caveats

- `stepTimeMs` reports individual simulation steps. In a capture driven by one `step 600` RPC, per-system `systemTimeMs` can represent the whole RPC batch: the initial roughly 11 ms OverworldSystem value is **not** 11 ms per step. The separate one-step capture avoids that ambiguity.
- Paused headless `frameTimeMs` mixes protocol-driven work and idle host frames. Do not use its frame percentiles or hitch-frame counts as a gameplay frame-rate verdict.
- Headless rendering occurs when requested. The performance capture's `drawCallsMax: 0` is not a scene draw count; the explicit render probes measured the 12-draw peak.
- `idleFrames.enabled` was false, so GPU frame skipping was not established. Stationary simulation work was measured, but battery savings were not.
- No physical phone was used. Sustained GPU time, thermals, device RSS limits, cold-load duration, and the full 2.5-second low-end loading target remain unverified. Hermes and the web host were unavailable in this environment.

## Evidence and regression gates

Local measurement artifacts (under the project, normally ignored by Git):

- `.gameengine/overworld-perf-scope.json`
- `.gameengine/overworld-phone-low-memory.json`
- `.gameengine/overworld-perf-idle.json`
- `.gameengine/overworld-perf-walk.json`
- `.gameengine/overworld-perf-sampled-walk.json`
- `.gameengine/overworld-perf-sampled-renders.jsonl`
- `.gameengine/overworld-perf-sampled-memory.json`
- `.gameengine/overworld-perf-sampled-markers.json`
- `.gameengine/overworld-perf-engine.json`

Project gates are `tests/budgets/overworld.json` (50 draws and the recorded Adventure flow) and `tests/budgets/memory.json` (48 MiB peak, 40 MiB courtyard, 2 MiB per district). Run the memory report with the pinned courtyard group included. Add a physical phone-low probe run and settled-heap transition soak before making device performance claims.

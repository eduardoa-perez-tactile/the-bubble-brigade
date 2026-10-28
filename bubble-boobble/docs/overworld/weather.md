# Map weather

The five Adventure maps have passing cloud shadows, thin local ground mist and
intermittent wind gusts. Wind carries up to three leaves and gently leans the
existing foreground foliage. All movement is scenery-only, sampled from the
existing presentation step; map geometry, navigation, encounters and audio are
unchanged. Weather stays below characters and mission/shop crests. The existing
reduced-effects setting removes weather and foliage lean.

## Cost and assets

- At most three sprites per layer, nine weather sprites total; the existing
  48-slot pool is unchanged. Worst composition is 31 sprites including footsteps.
- Three small alpha textures: cloud 256×128, mist 256×64, leaf 32×32;
  196 KiB combined uncompressed RGBA. Existing district asset groups load them
  through `assets/overworld-living/common/**`.
- Reproduce textures with `python3 tools/overworld/generate-cloud-shadow.py` and
  `python3 tools/overworld/build-mist-wind-textures.py`. Import GUIDs remain in
  the committed sidecars. The original paintings are untouched.

## Local prototype validation — 28 October 2026

`gameengine test --tier t0,t1 --js v8 --filter 'map weather' --memory-class phone-low`
passes the focused logic and render checks on the release V8 host, Metal/M2 Max,
mobile rendering tier. Logic samples all five maps over multiple weather cycles,
checking bounds, deterministic sampling, reduced effects, quiet wind intervals,
foliage rotation limits, pool capacity and unchanged game/map data.

The render case checks stationary-avatar weather motion at 360×880 and
2520×1080. Observed peak: 14 draw calls and 94 instances, within the existing
50-draw map budget. No goldens or replay baselines were rewritten.

Engine screenshots were inspected at narrow and ultrawide sizes on all five
maps, including calm and gust frames. Runtime captures and test JSON stay in
ignored `.gameengine/` output rather than the source or migration archives.

A short paused headless sample measured presentation p95 at 0.52 ms after the
change (0.65 ms before) and sim-step p95 at 0.14 ms (0.18 ms before), with zero
hitch steps. These short desktop samples are sanity checks, not evidence of a
speedup or of device GPU/thermal performance.

Full suites, Hermes parity, cooked smoke, pipeline recording and physical-phone
GPU/thermal validation remain deferred under the project's prototype policy.

## Visibility tuning

Following visual feedback, cloud opacity increased to 0.34–0.40 with about 1.5×
faster travel. Mist now starts visibly on arrival, with peak opacity 0.56,
35% thicker wisps and quicker drift. Leaves are 60% larger and higher contrast;
gusts repeat every 11 seconds, with a quiet interval between them. Foreground
lean is capped at 0.048 radians. Sprite count and texture memory are unchanged.

The same focused T0/T1 selection passes after tuning (peak 14 draw calls,
93 instances). Fresh narrow and wide engine captures were reviewed on the
bright harbor and darker final district, including the arrival frames where
the original mist faded almost completely out.

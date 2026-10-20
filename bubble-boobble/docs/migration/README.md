# The Bubble Brigade migration baseline

20 October 2026. Migration only; no reskin, gameplay changes, new multiplayer features or deployment.

## Source and destination

- Source repository: `eduardoa-perez-tactile/poc-bubble-boobble`, commit `6eb03c3d72a8a7f7bf12bf335e222f466278c05e`.
- Destination repository: `eduardoa-perez-tactile/the-bubble-brigade`, retaining its existing initial commit and `origin`.
- Source working tree included the uncommitted art-reskin investigation, which is preserved here.
- The original engine project directory name `bubble-boobble/` is intentionally retained. This avoids breaking relative imports, CLI roots, tools and workflow assumptions. Displayed game names, assets, bundle IDs and saved-game identity remain the pre-reskin baseline; isolate those identities when preparing a separately installed/published game later.
- The source project was read only. All bootstrapping, test output, cache creation and build checks ran in this new repository or an isolated copy beneath its ignored cache.

## What was preserved

All tracked files and nonignored additions, plus the source's ignored `.agents/`, `.claude/` and `.codex/` AI guidance/configuration. This includes gameplay, assets and import metadata; all harness scripts/commands; comparator tests; the pinned Go oracle and adapters; scenario inputs and expected fixtures; replay recordings and render goldens; presentation pipelines and budgets; desktop/web helpers and workflows; provenance manifests; reference capture/source art; and project documentation/concepts.

The [source manifest](source-manifest.json) records 2,112 copied files with SHA-256 and byte lengths, including 652 archived evidence files. Archived evidence contains the source's non-distribution `artifacts/` outputs, top-level cache/engine diagnostics and scripts, old golden comparisons and existing hash baselines. Historical names and machine paths inside these reports are evidence, not active configuration. The archived diagnostic scene has a `.txt` suffix to prevent the engine from importing it as a live scene; its bytes are unchanged.

The [history bundle](source-history.bundle) preserves all reachable source branches, remote-tracking refs and tags. It is separate from this repository's own Git metadata. Verify or recover it without contacting the original repository:

```sh
git bundle verify docs/migration/source-history.bundle
git bundle list-heads docs/migration/source-history.bundle
# Optional: create an independent historical checkout outside this project:
git clone docs/migration/source-history.bundle /path/to/historical-bubbleboobble
```

Root README, project `.gitignore` and active web publisher have migration-specific changes. Their original bytes are retained as [source-readme.md](source-readme.md), [source-project.gitignore](source-project.gitignore) and [source-web-publish.mjs](source-web-publish.mjs). The publisher targets the new GitHub repository; its existing artifact names remain compatible with the migrated workflow. It was syntax-checked, never executed. Added root guidance points future agents at the correct project and existing testing boundaries.

## What was intentionally excluded

The original `.git` directory was not copied over the destination's Git metadata. Reachable history is preserved by the bundle instead. Disposable compiler caches, temporary project/engine checkouts, installed Node/Go dependencies, engine-generated bundles/cooks, active session endpoints, local saves and compiled app/web distributions are not committed. The manifest lists omitted historical distribution files and explains directory exclusions. Generated dependencies are reproducible from the pinned manifests/setup commands; no active symlink points to the original game project.

AI guidance and archived evidence are explicitly tracked here. The project `.gitignore` now anchors runtime directory exclusions to the project root, so a nested historical `evidence/artifacts/` directory does not disappear from version control.

## Bootstrap and integrity check

From the repository root, enter `bubble-boobble/` before running:

```sh
gameengine skills update --auto
npm ci
node tools/harness/verify-migration.mjs
npm run harness:selftest
npm run harness:setup
npm run harness:reference-check
npm run harness:verify-full
```

An installed Tactile Game Engine and Node.js 22+ are external prerequisites. The skills command recreates `.gameengine/engine` against the installed engine, independent of the original game checkout. Skills/agent instructions are also committed for preservation. Automatic Go setup is pinned to macOS arm64, verifies its archive checksum and installs locally; other hosts need the documented `HARNESS_GO` toolchain. Engine SDK, native targets and browser tooling are not vendored.

`verify-migration.mjs` checks all preserved snapshot bytes and the history bundle against this committed manifest without needing the source checkout. This is a baseline integrity tool: after future intentional edits, some live project files will naturally differ. Do not change the frozen migration manifest merely to make later reskin edits match it.

The web source, tests, publishing workflow and setup guide are preserved. WebAssembly exports and browser playtests were not run during migration; the machine-local web toolchain must be configured for this new project using [the existing web guide](../web.md). The archived old configuration contains source paths and must not be copied into active configuration unchanged. No standalone app, browser automation or OS playtest was launched.

## Fresh verification results

| Check | Result |
|---|---|
| Snapshot integrity, including complete Git-history bundle | 2,113 files match SHA-256/length; no missing files |
| Harness comparator/provenance self-test | 9 passing cases |
| Pinned Go oracle | Two independent reference runs exactly match the committed fixture; upstream Go tests pass |
| Desktop bridge regression | 1 passing case |
| Cold live engine viewport | Pass: foreground tiles and player visible before offscreen initialization, 5 draws |
| V8 game logic | 269 cases pass |
| Desktop render goldens | 48 cases pass; no baselines regenerated |
| Presentation structural coverage | 262 explicit frames, peak 11 draws, all required pages/effects observed |
| Engine check | Typecheck, validation, desktop cook and 600-frame cooked smoke pass |
| Audio provenance/aliases | Pass |
| Web helper unit tests | 10 cases pass; active publisher syntax passes |
| Archived Git history | Complete self-contained bundle verified |
| Full stored-replay verification | Stops at an existing replay divergence; see below |
| Cross-runtime `--js both` | Cannot run: Hermes host is not installed |

Logs: [full harness attempt](verification-full.log), [engine check](engine-check.json), [oracle](reference-check.log), [copy integrity](copy-integrity.json), [audio](audio-provenance.log), [web helpers](web-helper-tests.log), [cross-runtime limitation](cross-runtime-tests.json).

## Preserved baseline limitations

`harness:verify-full` is not completely green: `party_boss_ten_dragons_fire_identifiable_lightning_bubbles.greplay` diverges at step 3, expected `cf74f27782821c93`, actual `977f78ddd9bd39f5`. The same original source files were copied into an isolated baseline under the destination's cache, bundled against the installed engine and replayed. That source baseline produces **the identical divergence**, establishing that the failure is not introduced by the migration. See [source baseline replay output](source-baseline-replay.json). The cause has not been fully diagnosed; no claim is made that engine version alone explains it. Original replays are preserved unchanged. The harness stops at that first replay, so it does not establish the status of all remaining recordings in this attempt.

The installed engine lacks the Hermes test host. Existing tile/camera validation warnings and one obsolete material-program entry in `pipelines.json` are reported by the passing engine check; the latter remains a release-build warning. These migration baseline limitations are recorded rather than hidden through replay/golden regeneration or gameplay changes.

Commit this migration before any art or gameplay work. A later task can diagnose/refresh stale replay baselines with explicit evidence, or begin the approved reskin; neither has been performed here.

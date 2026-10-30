# Story Mode mission briefing

30 October 2026. Implements the user-approved [mission postcard concept](approved-mockup.png).

The landscape card uses a large location painting beside a short objective, tactical
hint, act/enemy chips and first-clear reward. The footer keeps Start Mission prominent
and Back to map secondary. Portrait windows stack the same content; short landscape
phones get taller touch controls. Labels, counts, restrictions and buttons remain live
UI document content. The map behind the modal and the current district name are real
campaign data, so they vary from the concept's illustrative backdrop and eyebrow.

Tugboat Tussle uses the matching new illustration. Other missions keep their authored
location paintings. New, locked, cleared/replay, optional one-life trial and load-error
states share the composition. Existing encounter launch gates, reward grants, saves,
recorded intents and gameplay remain unchanged. See [asset provenance](assets.md) for
image sources, generation prompts, editable icon sources and import limits.

## Local verification

- `npm run harness:quick -- 'mission briefing'`: one selected V8 T0 case passes. It
  compares briefing counts with all 25 authored missions and five trials, and checks
  lock, reward, replay, error and trial metadata without mutating progress.
- `gameengine test --tier t1 --js v8 --filter 'mission briefing' --json`: one selected
  mobile-tier/phone-low T1 case passes on the release host, Metal, Apple M2 Max. It
  checks the actual card at 1280×720, 344×882 and 882×344, with safe areas and at least
  44-point controls, then presses Back and Start through the real input path and
  confirms encounter 5 launches. Peak: **28 / 50 draw calls**.
- The three new Tugboat render baselines were inspected before selective approval.
  No historical baseline was automatically regenerated.
- Fourteen settled view captures were inspected across ready, two/three-act, locked,
  replay, trial and error states, at desktop, ultrawide, narrow phone, short phone,
  tablet and short landscape sizes. All captures report zero layout warnings.
- Scoped UI document checks pass without issues for `overworld-encounter`,
  `mission-primary` and `mission-back`; `git diff --check` passes.
- Architecture/event review found no blocking issues. Asset review estimates about
  0.477 MiB of new compressed image payload on phone-low, excluding atlas padding and
  mipmaps; this is not a physical-device memory or GPU measurement.

The project-wide TypeScript check reports **10 identical diagnostics** on this branch
and an isolated copy of `main` at `a106778d`, using the same installed SDK. The existing
errors are in `src/cartoon/menu.view.tsx`, `tests/overworld-pinwheel-paths.test.ts`,
`tests/overworld-weather.test.ts` and `tests/story-foreground-pilots.test.ts`.
No new TypeScript diagnostic is introduced by this slice.

Under the project's prototype policy, full suites, Hermes parity, legacy golden and
replay sweeps, pipeline recordings, cooks/cooked smoke, oracle audits and physical
device profiling remain deferred and are not claimed passing. All testing used Game
Engine APIs; no standalone build or computer/browser automation was used.

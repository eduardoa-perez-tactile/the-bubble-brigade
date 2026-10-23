# Mobile and architecture review

23 October 2026. Read-only review of the desktop flow controller/state, arcade input boundary, native iris, document views and pause layout. Engine scope was collected with `gameengine scope`; no review session or standalone player was launched.

## Evidence and limits

- Saved `t0-regressions.json`: 387/387 V8 logic tests passed.
- The previously completed focused run passed 14/14 V8 tests on the mobile Metal tier with phone-low memory limits. Those results precede the subsequently requested slower iris and introduction sequencing; the revised timing requires its own fresh run.
- `pipeline-record.json`: all seven structural replay budgets passed. The new UI journey reached 14 draws against its limit of 14; other scenarios peaked at 12–13 against 14.
- That broad T1 invocation passed 56/90 tests. Its 34 screenshot/exact-colour failures include intentionally changed screens and other discrepancies that have not all been classified. This is not a green full-render-suite result.
- The saved engine check passed typecheck, validation, desktop cook and 600 cooked smoke frames. Its snapshot also reported an obsolete material-program pipeline entry; use the coordinator's final pipeline/check evidence to determine whether that warning is resolved.

## Findings

**Medium — no draw-call headroom in the UI journey.** The measured peak is 14/14, or 100% of the project's structural allowance (`tests/budgets/cuphead-ui.json`). This meets the current budget but leaves no room for another overlapping texture batch. Keep the existing atlas and native single-ring approach; require a new structural measurement before adding more simultaneous effect layers. A desktop structural count does not establish phone GPU time or fill cost.

**Verification required — broad render discrepancies remain.** Classify the 34 failures before calling all render regressions resolved. Preserve archived migration evidence and avoid accepting unrelated old goldens merely to obtain a green run.

## Architecture and input assessment

Flow ownership follows recorded input → deterministic document state → presentation. Transition boundaries use simulation steps and a shared timing module, rather than animation completion callbacks. Views remain document-based; the iris code area is justified by procedural circular geometry and viewport-dependent sizing that the document format cannot express. It adds no bitmap mask or new material.

The review found a recorded pause flag bypassing the cover's keyboard guard, and a held resume-confirm reaching gameplay after the sheet exit. The coordinator corrected those paths and added targeted tests. The slower flow now freezes the run during cover/reveal and the classic Ready lead-in; existing preparation clocks start afterward rather than being shortened by the iris. New input does not advance invisible gameplay.

The retry/cut opaque hold is five steps, matching the configured `sim.maxStepsPerFrame: 5`; this supplies an opaque presentation opportunity before reset under the configured catch-up bound. Launch billing provides a longer opaque hold. Future changes to that cap must preserve the relationship.

The initial claim that the tall party pause overflowed by 70 pixels was an arithmetic error and is withdrawn. Five 96-pixel rows plus headings, rule, gaps and padding total 770 reference pixels with the old 22-pixel hint, or 778 with a 30-pixel hint. The coordinator's 900-pixel panel has room; its final five-action phone capture was reported warning-free and visually inspected. Actual input targets, rather than stylesheet declarations alone, are covered by the phone pause test.

Menus are capped at 30 fps. The new title/menu surfaces do not introduce perpetual animation loops. The transient iris measurement hook is removed on unmount. Idle-frame skipping was not profiled, so no battery or idle-CPU claim is made.

## Device work still needed

No real low-end phone measurements were collected. Before mobile release, measure sustained GPU/frame time, two-step CPU cost, memory peaks and thermal behaviour on the supported low-end device; the guidance target is roughly 8 ms per simulation step within a 33.3 ms frame at 30 fps. Verify idle-frame skipping in menus. Hermes parity remains unavailable without its host binary. The current engine-only workflow proves input/state/render behaviour without substituting desktop or browser automation.

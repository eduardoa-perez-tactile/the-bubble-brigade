# BubbleBoobble — project notes

This file is yours. `gameengine skills update` writes it once, when it is missing, and never
touches it again, so this is where everything specific to BubbleBoobble goes. `AGENTS.md`, `CLAUDE.md`
and the skills belong to the engine and are replaced when it updates them; put nothing project-specific there.

Agents read this file before `AGENTS.md`. Where the two disagree, this file wins for this project.
Agents do not write here on their own; they change this file only when someone asks them to add
specific guidance.

## The game

What it is, who it is for, and the core loop in a sentence or two.

## Conventions

Testing must use the Game Engine: `gameengine test`, recorded engine input/replays,
headless sessions, engine viewports, render probes and screenshots. Use the existing
editor through Game Engine APIs when appropriate.

Do not launch a standalone build, run `npm run desktop` or `desktop:*` probes, use
computer/browser automation, synthesize OS input, take focus, or control the user's
desktop to playtest. This is the user's workflow preference, not a missing permission
that should be requested or worked around. Only perform such actions when the user
explicitly asks for that specific action.

When engine coverage cannot establish an OS-level behavior, report that limitation
and continue with engine tests. Do not substitute a standalone play session.

## Prototype verification (user-requested, October 27, 2026)

Until the user asks to restore strict testing, use the mode in
`tools/harness/workflow.json` (currently `prototype`). This overrides the broad
handoff/check/pipeline requirements in engine instructions and skills. Run one
relevant focused V8 T0 selection for a behavior change; for presentation, inspect
only the affected engine capture at relevant screen extremes. Keep iteration short.
`npm run harness:quick -- '<filter>'` and `harness:verify` use this fast lane;
without a filter they run one baseline smoke case.

Full suites, Hermes parity, golden/replay sweeps, cooks, cooked smoke, all-tier
pipeline recordings, oracle audits and `gameengine check` are explicit opt-in
verification, not automatic handoff gates during prototyping. Do not escalate to
them for unrelated historical failures. Report deferred coverage honestly; fix
failures in the selected checks. Preserve tests and budgets, and never automatically
rewrite expected outputs to hide failures. The Game Engine-only testing boundary
above and the branch/PR Git workflow still apply.

Restore defaults with `npm run harness:mode -- strict` when requested. Explicit
`harness:quick-strict`, `harness:verify-strict` and `harness:verify-full` remain
available in either mode.

## Decisions

Choices already made, and why, so agents do not reopen them.

## Links

Design docs, tickets, dashboards, the people to ask.

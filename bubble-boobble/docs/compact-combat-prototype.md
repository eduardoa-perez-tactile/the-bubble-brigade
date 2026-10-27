# Compact enemy-combat prototype

27 October 2026. First playable slice of the level-design plan: Adventure stages
1, 4 and 5. Environmental steam hazards are removed from stages 4, 14, 19 and 24.
Clear conditions remain enemy-only. No new objectives, enemy AI, movement rules,
multiplayer features, artwork or progression changes are included.

## Playable changes

| Stage | Before | Prototype | Encounter |
|---|---|---|---|
| 1 — Lantern Landing | 72 columns, five shelves | 40 columns, three overlapping climbing shelves | Two rollers occupy successive landings; a bat contests the upper approach. Open sides provide a return to the floor. |
| 4 — Pressure Trouble | 72 columns | 44 columns, two low balconies with a central crossover | The five existing enemies form a central blaster, two lower rollers, and two flyers. |
| 5 — Tugboat Tussle | 72 columns | 44 columns, two decks | The opening has a left roller, right blaster, and central bat. The second act moves the blaster left, the bat right, and adds a floor hopper on the right. |

All three rooms retain 23 collision rows and their existing enemy rosters. The
other 22 Adventure layouts, original and cartoon Classic, and Bubble Madness
retain their existing dimensions. Stage identities, save progress, retry behavior
and encounter rewards retain their existing contracts.

Content lives in `src/adventure/episodes.ts`: optional room widths and authored
enemy/pickup/reinforcement anchors use the existing defaults for other stages.
`src/cartoon/arena-framing.ts` derives presentation bounds for differently sized
Adventure rooms. Layout and projection fit those bounds without changing the
camera, jump physics, muzzle positions or capture geometry. The canonical
72-by-23 presentation path remains unchanged. Stage 5's second-act feedback uses
the actual room center rather than its previous courtyard position.

## Focused prototype verification

The repository is in prototype mode. The local focused V8 T0 selection
`npm run harness:quick -- 'Adventure compact*'` passed all four cases. After
strengthening the same selection's edge bounds, the final run was:

```sh
gameengine test --tier t0 --js v8 --filter 'Adventure compact*' --json
```

All four cases passed. They cover content identity and bounds, safe opening and
boarding arrivals with players on either flank or center, reachable platforms
with real unupgraded movement, and fixed framing at the highest player jump,
legal flyer ceiling and both walls. Projection round trips, visible actor alpha
bounds, platform tails, and HUD reserves are checked at 344-by-882 with a top safe
inset, 1280-by-720, and 2520-by-1080.

| Controlled measure | Before | Prototype | Change |
|---|---:|---:|---:|
| Stage 1 floor crossing | 352 ticks / 5.87 s | 182 ticks / 3.03 s | 48% less travel |
| Stage 4 floor crossing | 352 ticks / 5.87 s | 203 ticks / 3.38 s | 42% less travel |
| Stage 5 floor crossing | 352 ticks / 5.87 s | 203 ticks / 3.38 s | 42% less travel |

These comparisons freeze enemy movement and use identical player speed, start
and opposite-wall targets. They isolate traversal distance rather than combat
completion time. A controlled stage-1 approach captures a stationary enemy in
25 simulation ticks; this is evidence of an available opening, not live difficulty.
The three original room definitions are preserved in the new test fixture
`tests/fixtures/adventure-compact-baseline.json`, sourced from prerequisite commit
`4130395`; historical migration and oracle fixtures are untouched.

One affected V8/mobile/phone-low render case captured stages 1, 4 and 5's openings
plus stage 5's boarding formation at all three screen shapes: 12 new, individually
reviewed engine goldens. It passed with a peak of 10 draw calls against its
existing 50-draw Adventure ceiling. No existing goldens were rewritten.

The content and framing agents independently reviewed the implementation and
all 12 captures. Their scoped architecture/visual reviews found no blocking
issues. `gameengine camera list` confirmed the existing WorldView-driven flat
2D camera with no warnings; no camera resource or rig was modified.

Runtime captures and diagnostic JSON remain in the ignored `.cache/compact-combat/`
directory. The recorded goldens and test fixture are reviewable source evidence.

## Limits and next decision

Human pacing, live time between captures, final-enemy chase duration, deaths,
and completion time remain playtest questions. Flyers retain their existing
physical ceiling and can temporarily travel above the low balconies. Framing
reserves that legal airspace, leaving scenic overhead; the prototype does not
claim to have solved every aerial chase.

Full suites, Hermes parity, existing golden/replay sweeps, cooks, cooked smoke,
pipeline recordings and physical-device performance were deferred under the
user-requested prototype policy. Local structural draws do not establish phone
GPU time, memory, sustained frame rate or thermal behavior.

Compare these three encounters with the retained baseline, tune width and
formations from human feedback, then adapt stages 2 and 3 to finish the harbor.
Roll out one district at a time after that scale is accepted. Mastery trials and
restoring individual Classic geometry remain later slices.

# Courtyard enemy spawning — 26 October 2026

The cartoon courtyard uses the full arena width for six- and ten-slot teams. Initial groups contain `min(wave budget, 3 + ceil(occupied slots / 4))` enemies: four for one occupied slot, five for six, six for ten. Remaining members keep their authored enemy kind and are queued in groups of four, three seconds apart. The total wave budget and unlocked families are unchanged.

Each group has its own formation. Ground enemies get supported platforms; flyers get clear unsupported air positions. Authored 136×116 spawn envelopes reserve room for cartoon silhouettes, with a larger 148×140 clearance around current players and their return positions. Collision bodies remain 44×44. Later groups can reuse an area after previous actors have left it.

Only the next four warnings are visible. Warnings last 60 simulation ticks and use existing shadow/ink primitives with amber exclamation markers. Locations are checked when the warning opens and again before spawning. A blocked location is replaced when a safe alternative exists, then receives a fresh full warning; otherwise it waits without spawning into an actor. Freeze and pause stop the countdown. Pending groups block wave clear and the final-enemy/last-kill state until they have arrived. The original arcade/campaign arena and its whole-formation party mode are preserved.

Validation: all 448 logic tests pass on both V8 and Hermes (896 runtime cases), and `gameengine check` passes typecheck, validation, pipelines, desktop cook and cooked smoke.

No artwork was generated or redrawn. `cartoon.spawn-staging` provides recorded checkpoints of actual formations and incoming groups. Tests cover six/ten slots, early/late wave totals, feet support, airborne flyers, silhouette spacing, delayed releases, camping a warning, freeze, queue-copy determinism, actual engine steps and four view shapes. The new 364-step engine scenario finishes with the same hash on V8 and Hermes (`30a0aee5423bb8e3`).

Phone-low render checks peak at 15 draw calls (test ceiling 17). A 1,500-step steady headless desktop probe measured simulation p95 0.70 ms, max 2.64 ms, zero hitch steps and zero pipelines compiled during capture. This is a CPU simulation check, not physical-phone GPU/thermal evidence. The headless host reported a 53.6 MiB JS heap; no claim of a memory reduction is made. Engine diagnostics remain in ignored caches rather than versioned evidence.

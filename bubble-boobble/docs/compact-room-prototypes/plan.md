# Compact garden and post-office room proposals

## Direction and scope

The user approves the existing lighthouse, pump-station and tugboat compositions.
Those three actual screenshots, preserved in `references/`, define the finish,
readable actor scale, connected room architecture and focused encounter size.
The garden and post-office screenshots in the same folder document the rejected
modular assembly. They are source references, not new engine verification.

This branch proposes two complete in-game rooms before rolling the treatment
across the remaining levels: Parcel Panic (2, post-office) and Dewdrop Steps
(6, garden-1). Both use 44 columns and 960 world units between collision faces,
the same width as the approved pump and tugboat encounters. Their platforms are
recomposed for that space rather than horizontally compressing old coordinates.
All other 23 encounters retain their layouts and identities.

## Room design

Parcel Panic keeps two lower sorting shelves and a shared upper sorting shelf.
The route should support either flank, a clean central crossing, comfortable
landings and independent enemy positions. Original enemy kinds/counts remain;
all spawns and pickups are authored inside the compact room.

Dewdrop Steps keeps a climbing route through four terraces. Left/lower, central
and two upper landings overlap enough for the unupgraded player's normal jump.
The center and upper-left shelf overlap by 120 world units, comfortably wider
than the 44-unit player body. Distinct upper routes maintain the garden's
climbing identity without recreating the former wide room's empty footprint.

## Art and integration

Build two complete transparent architectural frames. Parcel uses substantial
oak piers, coherent joinery, restrained brass/iron fittings and a matching floor.
Garden uses greenhouse stone piers, moss, roots and selective foliage with
readable structure beneath it. Do not repeat ornate vine/strap modules through
the full height, stretch grain or mirror the opposite side's lighting.

Preserve complete shoulders, mouldings, feet and per-side source proportions.
Record measured source anchors and crop rectangles. Draw profiles at one local
pixel density, align their inner body planes with real collision faces, and use
matching floor/end pieces from the same composition. Plain continuation alone
may repeat above the main architecture on tall viewports.

The new profiles apply only to post-office and garden-1. Other timber/garden
levels stay out of this prototype slice until its composition has been reviewed.
Approved lighthouse/pump/boat rendering remains the regression reference.
Use the existing episode preload lifecycle with separate prototype family
atlases. No budget changes, schema changes or new gameplay mechanics are needed.

## Coordination and verification

The coordinator owns the plan, source screenshots, existing-test adaptations,
serialized engine checks and Git actions. The implementation subagent owns the
two layouts and renderer integration; the art subagent owns new masters,
importers, manifests, PNGs and metadata; the independent reviewer owns focused
prototype tests and `review.md`.

Prove platform reachability through actual `stepGame` input and recorded engine
input, not only coordinate comparisons. Check opening spawn safety, all pickup
positions, floor travel, useful landing widths, full jump crowns and HUD clearance.
Pin complete level hashes for the other 23 encounters to the main baseline.

Inspect actual Game Engine captures of both proposals at native 1280x720,
narrow 344x882 and ultrawide 2520x1080, plus the three approved native rooms.
Readability and connected architecture are the acceptance criteria; geometry
passes alone cannot certify the art. These new themes have no approved exact
mockup, so do not manufacture percentage-similarity scores.

Run focused V8 checks under `PROJECT.md`'s prototype policy and inspect only the
affected captures. Measure mobile-tier/phone-low draw calls and actual resident
bytes. Existing memory-target misses and unrelated TypeScript errors must be
reported honestly rather than relabeled as passing. Full suites, cooks, Hermes
parity and physical-phone timings remain deferred unless requested.

## Git workflow

Reuse the isolated managed checkout on `codex/compact-room-prototypes`, based on
current main. Commit implementation, source provenance, tests and deliberately
reviewed visual baselines together. Push one coherent proposal PR and attach it
to this chat. The two room proposals are the review point before wider rollout
or merge; the previous border pass's merge authorization does not itself approve
these new layouts.

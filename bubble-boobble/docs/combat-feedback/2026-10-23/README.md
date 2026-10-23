# Combat feedback fixes

The fruit floor clamp and shared dragon/enemy jump curve apply to the cartoon courtyard. Pinned arcade reference movement and reward fixtures remain unchanged. Enemy takeoff/landing history lives in the bounded sim:false ArcadeFeel resource, with separate enemy cue kinds; it never feeds simulation or player landing sounds.

Powerups use full effect descriptions, rising glints and an overhead indicator. Thunder potions have new bottle art without the old baked-in bubble. Lightning uses 21 connected rotated segments rather than the rectangular bars. The approved limbless bellows boss master is normalized into eight sharper 384px poses, and its fireballs cycle four authored frames with a stable reduced-effects variant. World HELP is outlined character-colored text; roster rescue states have a stronger red border and a foreground HELP strip.

Art follows docs/art-reskin-investigation/style-research.md and art/enemy-simplification/boss-prompt.txt: crisp cel actors, flat matte fills, restrained shading and strong ink outlines; painted scenery stays separate. No regular enemy art was redrawn.

Art sources and exact built-in ImageGen prompts: ../../../art/combat-feedback/. Rebuild normalized assets with `python3 tools/cartoon/build-combat-feedback.py`; source alpha is preserved. Historical art masters and migration evidence were not changed.

Validation: 439 V8 T0 tests passed; eight focused logic/render tests passed on phone-low. Four view sizes cover native, wide, tall and ultrawide. Combined boss/pickup/lightning/rescue render: 18 draw calls (22 test ceiling); boss attack/capture suite: peak 16 (17 existing ceiling). Original frozen boss baseline: 16 draw calls. Enemy jump/landing render ceiling: 20. `gameengine check` passed, including typecheck, validation, pipelines, views, desktop cook and cooked smoke. Existing camera/opaque reference tile warnings remain.

Measurements are engine/headless render checks, not physical-device GPU or thermal measurements. Dual-runtime testing was attempted; this installation lacks the Hermes test host, so V8 is the verified lane. No desktop automation or standalone play session was used.

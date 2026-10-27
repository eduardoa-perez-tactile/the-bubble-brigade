# Map and menu feedback — 27 October 2026

This revision follows the user's playtest feedback on the five-map rollout. The shipped game art is the visual authority; the older PDF guide is explicitly superseded. See [the capture review](review.html) and [reference notes](reference-notes.md).

## Opening and menu

The opening shows only a closed red curtain: no title, dragon, or prompt is printed in front. Enter or tap raises only the cloth over approximately 0.9 seconds and reveals the prepared harbor main menu underneath. The input that opens the curtain cannot also activate a menu action; controls arm after the reveal and neutral release.

The cloth has a transparent cutout below its scalloped gold hem, with its original painted RGB preserved. The image importer normalizes the Imagegen alpha matte, removing the black tail. A 104% top-anchored height and lift keep the window covered while closed and clear it completely at the end. Render probes and actual narrow/ultrawide captures verify no black strip or menu peeking at rest.

The menu dragon uses the accepted existing greeting/04 drawing in a planted held pose. The previous multi-pose greeting loop is removed.

## Map corrections

- Residents keep their existing accepted artwork and use a stable neutral idle drawing. There is no proximity greeting, body bob, or gesture loop.
- The spool character is a street resident. The existing shop exterior retains SHOP lettering, with no merchant inside the counter, pasted stock icons, or added counter occlusion. Products and prices remain in the purchasing screen. The local Cuphead reference was studied for this separation; no copied art was imported.
- All fifteen resident placements are authored on paving and inspected visually. Four guide interaction anchors move with their residents; those precise exceptions are recorded separately from the frozen map baseline. Existing mission, shop, travel and collectible positions remain fixed.
- The added lighthouse animation and door-leaf overlays are removed. The original painted lighthouse and doors remain intact.
- All twenty-five mission entrances use fixed illustrated state marks: available, locked and cleared. The user approved the shipped-art direction after an actual in-map sample. Their lettering, brass shading and green ink come from the existing logo, clock, candy and dragon artwork. Earlier generic icon studies were rejected and are not used.

Existing map paintings, geography, source transforms, spawn and camera settings are preserved. Existing collision fixes, powerup economy and shoreline drawings remain in place.

## Evidence and reproduction

`title-validation.json` records the final cloth-only/transparent-hem test and replay proof. `generated-art.json` records selected prompts, source references, import settings, and output hashes. The curtain source and cutout are in `tools/menu-feedback/`; its importer changes alpha only. An exact copy of the existing NPC foot shadow shares the resident atlas with the approved markers, reducing map draws from 16 to 13 while preserving artwork, opacity, anchors and depth. The original 14-draw handoff budget remains unchanged.

Run from the engine project:

```sh
node tools/overworld/approval/verify-map-preservation.mjs
python3 tools/overworld/verify-living-art.py
gameengine test --tier t0 --js both --json
gameengine test --tier t1 --filter '*overworld*' --json
gameengine test --tier t0,t1 --filter 'title curtain*' --js both --json
gameengine check --json
```

All gameplay verification uses Game Engine APIs. Portable final counts, memory figures and limitations are recorded in `validation.json` beside this file. Full T0 passes 515 cases on each of V8 and Hermes; the fresh curtain and full harbor recordings verify 122 and 1,440 steps on both runtimes. The original harbor replay budget now measures 13 draws against its unchanged limit of 14. No physical handset performance claim is made. The broader render run and three-tier pipeline recording completed. After focused corrections, 38 pre-existing render cases remain, with the same four legacy structural failures documented under `../living-map-harbor/production/`. Unrelated goldens and thresholds were not changed.

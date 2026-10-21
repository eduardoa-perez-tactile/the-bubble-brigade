# Final gate commands

Run only after the renderer releases the coordinated engine slot, from `bubble-boobble/`.

```sh
gameengine test --js v8 --hash-trace .gameengine/concept-reconstruction-final --checkpoint-every 1 --json > docs/concept-reconstruction/logic-tests.json
gameengine trace diff .gameengine/cartoon-overhaul-baseline/v8 .gameengine/concept-reconstruction-original-only/v8 --json > docs/concept-reconstruction/original-trace-diff.json
gameengine trace diff .gameengine/concept-reconstruction-baseline/v8 .gameengine/concept-reconstruction-final/v8 --json > docs/concept-reconstruction/immediate-baseline-trace-diff.json
gameengine test --js v8 --tier t1 --gpu-tier desktop --json > docs/concept-reconstruction/render-verification.json
node tools/harness/reconstruction-recordings.mjs .gameengine/test-bundle.js
```

Before the original trace comparison, copy only the final `.hashtrace` filenames present in `.gameengine/cartoon-overhaul-baseline/v8` into the ignored original-only directory. Assert exactly 280 files and no missing filename. The original comparison has zero allowances and must report 280 identical. A raw directory diff including new test files is insufficient proof.

The immediate 305-case baseline is classified separately: explicitly recorded cartoon starts intentionally construct the redesigned opted-in arena. New projection tests are additions. No original route is allowed to diverge.

Refresh only cartoon/concept/refinement/reconstruction desktop goldens after actual assertions pass. Keep all 313 protected original golden files and all 45 previous recordings unchanged. Newly named reconstruction streams replace active budget references only after explicit cartoon-scene playback verification. Each structural budget remains capped at 14 draws. The script does not write prior recordings.

Current focused evidence: 22 logic cases pass; native phone-low device fit passes after the shared safe-header fix. The first four-aspect reference run found a genuine native 15-draw failure against 14; renderer reports that final grouping now measures 12, pending this strict test rerun. Full suite, final streams and final cold probes are pending; this document is an execution plan, not a result claim.

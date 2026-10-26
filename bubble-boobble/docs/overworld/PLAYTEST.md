# Adventure map playtest

**Current build:** the five-map painting pass is complete and engineering checks pass. User visual review and playtest remain pending; tests do not certify art-direction compliance. Compare the revised paintings with the preserved BEFORE plates and `STYLE-PASS-REVIEW.md`.

After the authorized merge, open `/Users/eduardoleale/workspace/tactile-game-engine/the-bubble-brigade/bubble-boobble` on `main` in Game Engine and press Play. This combines the overworld with the newer music, boss/results and combat/spawning features. Existing local generated files and untracked work are preserved. From the main menu choose **START GAME → BEGIN ADVENTURE**. Later, **CONTINUE ADVENTURE** restores the selected profile’s saved map position and progress. **ARCADE MODES** retains Classic and Bubble Madness.

## Controls

- Walk freely: **WASD / arrow keys**, or the first controller’s **left stick / D-pad**.
- Inspect a nearby entrance or character: **Enter / Space / controller A** when the prompt appears.
- Map menu: **Esc / controller Start**. **B** backs out of panels.
- Encounter controls keep their existing bindings. Release confirmation after entering or leaving a screen.

## Suggested checks

1. Walk around Bubblebrook Quay, across the canal bridges and along the stairs and paved waterfront. Try all eight walking directions, then stop and check the held facing and planted idle. Test shore boundaries, building obstacles and narrow passages. The camera should follow without exposing a hard map edge or losing the dragon.
2. Approach an entrance, walk away, then return. Its prompt should appear only nearby. Inspect a locked entrance and verify its prerequisite explanation.
3. Play an available encounter. Lose and retry, then win and return. Retry should keep the same encounter; return should place you at that entrance with a completion flag. Replaying a clear must not repeat its first-clear coin reward.
4. Clear three encounters and claim the guide’s 15 coins. Find the hidden five-coin cache, discover the shortcut, buy a keepsake and inspect the journal. Repeat claims and purchases to check that rewards and costs occur once.
5. Inspect the gate before and after all five local clears. Continue through all five distinct scenic districts. Optional one-life mastery trials should not gate the 25-encounter campaign. The journal can revisit unlocked districts.
6. Open Options from the map and return. Leave to the main menu, Continue, then close and reopen the game: verify coins, clears, keepsakes and the saved entrance. If you close during an unfinished encounter, Continue should return to its entrance without granting a clear.
7. Try another profile, Classic and Bubble Madness. Adventure progress must remain separate. Resize the window between small, tall and ultrawide shapes; check text, buttons, avatar visibility and combat framing.

Please report the district/landmark, input device and steps for any problem, with a screenshot when useful. The user authorized merging before this combined-feature playtest on 26 October 2026. Visual approval and playtest feedback remain pending.

## Verification limits

Automated gameplay checks use Game Engine recorded input, headless sessions and render tests. Native controller hardware, OS focus, browser storage durability and actual phone GPU/thermal behavior still require hands-on verification. The current app toolchain has no Hermes host and no built Web/WASM host, so automated cross-runtime parity remains unverified. See `PERFORMANCE.md` for phone-memory limitations and `RENDER-REVIEW.md` for the baseline render failures.

# The Bubble Brigade

The Bubble Brigade is a visual revamp of Bubble Madness / BubbleBoobble, with its complete AI harness preserved. The first playable cartoon slice is the default scene; existing gameplay and local multiplayer remain unchanged.

The engine project remains in `bubble-boobble/` to preserve relative paths used by tests, tools, workflows and documentation. Run Git from this repository and engine/harness commands from that subdirectory.

```sh
cd bubble-boobble
gameengine skills update --auto
npm ci
npm run harness:selftest
npm run harness:verify-full
```

The installed Tactile Game Engine and Node.js 22+ are required. To provision the pinned Go oracle on macOS arm64, run `npm run harness:setup`, then `npm run harness:reference-check`. External engine/Go/browser toolchains are dependencies, not vendored binaries; the web toolchain needs its own machine-local configuration as explained in the web guide.

- [Migration record, integrity verification and evidence](bubble-boobble/docs/migration/README.md)
- [AI harness guide](bubble-boobble/docs/harness.md)
- [Strict-port contract and limitations](bubble-boobble/docs/port-harness.md)
- [Art investigation and future reskin concepts](bubble-boobble/docs/art-reskin-investigation/README.md)
- [Playable cartoon slice, captures, verification and remaining work](bubble-boobble/docs/cartoon-slice/README.md)
- [Existing web build workflow](bubble-boobble/docs/web.md)

Open `bubble-boobble/` in the Game Engine editor and play `scenes/cartoon.scene.json` for the slice, or `scenes/arcade.scene.json` for the original pixel comparison. Title → START GAME retains the existing Classic and ten-slot party flows.

Historical documents/evidence retain original names, URLs and machine paths. The active web publisher targets this repository. The migration archive remains immutable. No gameplay or multiplayer features were added, and no web build or application release was published.

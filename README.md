# The Bubble Brigade

Independent migration of Bubble Madness / BubbleBoobble, including its complete AI harness. This is the pre-reskin baseline: existing game art, gameplay and local multiplayer are preserved.

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
- [Existing web build workflow](bubble-boobble/docs/web.md)

Historical documents/evidence retain original names, URLs and machine paths. The active web publisher now targets this repository. No publication is performed by migration or verification. Visual rebranding, gameplay changes and multiplayer feature development have not started.

Dragon motion masters, October 2026

walk-source.png: eight poses, 4 columns x 2 rows, generated in one edit from the shipped green run/idle sprites.
shoot-source.png: six poses, 3 columns x 2 rows, generated in one edit from the shipped green release/idle sprites.
release-anchors.png: exact shipped release pose for all ten colors in party color order.
release-anchor.png: green release reference used during authoring.

Rebuild with: python3 tools/cartoon/build-dragon-animation.py
This only exports dragon run/shoot clips and metadata; historical art and migration evidence remain untouched. The full base asset builder invokes this afterward.

Each strip uses one scale, 128x128 canvases and feet at [64,120]. Linear filtering and trimmed transparent texels preserve sprite bounds while limiting atlas growth. The six-frame shoot retains the original first release drawing and muzzle [100,80], then adds recoil and recovery. Walk uses 32 ticks (four ticks per frame, 25% slower playback); shooting remains 12 ticks, with no added input delay or simulation changes. Walking uses only the drawn body motion, without a procedural scale pulse.

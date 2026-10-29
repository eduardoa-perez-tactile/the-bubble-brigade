#!/usr/bin/env python3
"""Read-only alpha profiles used by foreground placement; never modifies source art."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets/adventure/foreground"
KEYS = ["sailcloth", "garden-2", "foundry-4", "parcels", "carnival", "springs", "glassworks"]

def measure(key):
    with Image.open(ART / f"{key}.png") as image:
        alpha = image.convert("RGBA").getchannel("A")
        width, height = image.size
        def bounds(threshold):
            box = alpha.point(lambda a: 255 if a >= threshold else 0).getbbox()
            if box is None:
                raise ValueError(f"{key} has no paint at alpha {threshold}")
            return dict(zip(["left", "top", "right", "bottom"], box))
        def rows(threshold):
            mask = alpha.point(lambda a: 255 if a >= threshold else 0)
            return [(box[1] if (box := mask.crop((x, 0, min(width, x+32), height)).getbbox()) else None)
                    for x in range(0, width, 32)]
        return {"width":width, "height":height, "alphaBounds":bounds(1),
                "paintAlphaThreshold":4, "paintAlphaBounds":bounds(4),
                "meaningfulAlphaBounds":bounds(16), "profileBinWidth":32,
                "paintMinRows":rows(4), "meaningfulMinRows":rows(16)}

if __name__ == "__main__":
    data = {key: measure(key) for key in KEYS}
    (ART / "alpha-bounds.json").write_text(json.dumps(data, indent=2) + "\n")
    print(json.dumps({key: {"size":[value["width"], value["height"]], "paint":value["paintAlphaBounds"]} for key,value in data.items()}))

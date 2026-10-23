"""Reapply native map import compatibility after copying source artwork.

Keep Android/iOS ASTC6x6; desktop uses RGBA because the current cooked host
rejects the compressed standalone terrain texture binding under phone-low T1.
This changes import metadata only, never source pixels or asset GUIDs.
"""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
folders = ['overworld-reference'] + [f'overworld-district-{i}' for i in range(2, 6)]
for folder in folders:
    for path in sorted((root / 'assets' / folder).rglob('*.gmeta')):
        content = path.read_text()
        section = '[settings.platform.desktop]\ncompression = "none"'
        if '[settings.platform.desktop]' in content:
            content = re.sub(r'\[settings\.platform\.desktop\]\ncompression = "[^"]+"', section, content)
        else:
            content = content.rstrip() + '\n\n' + section + '\n'
        path.write_text(content)

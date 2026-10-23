"""Fetch the pinned author-published sample bank into ignored authoring cache."""
import hashlib
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
PIN = '684543d5e5efaef08d02be50dcda8d552478fa60'
BASE = f'https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/{PIN}'
BANK_HASH = '9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe'
LICENSE_HASH = '7b32efefdf95ce38a043799f0659853ddc00fbaa14d8c50f0aca16b9b8b405be'
LICENSE_LF_HASH = '88726e4b018fb66050054b6633a2996335b0f8fd4186251c20d0546fa0ab44fc'


def fetch(url, path, digest, normalize=False):
    output_digest = LICENSE_LF_HASH if normalize else digest
    if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() == output_digest:
        return
    with urllib.request.urlopen(url, timeout=90) as response:
        data = response.read()
    if hashlib.sha256(data).hexdigest() != digest:
        raise ValueError(f'Pinned source checksum mismatch: {url}')
    if normalize:
        data = data.replace(b'\r\n', b'\n')
    assert hashlib.sha256(data).hexdigest() == output_digest
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.part')
    temporary.write_bytes(data)
    temporary.replace(path)


def main():
    fetch(BASE + '/GeneralUser-GS.sf2', ROOT / '.cache/audio-production/GeneralUser-GS.sf2', BANK_HASH)
    fetch(BASE + '/documentation/LICENSE.txt', ROOT / 'art/audio-period-band/LICENSE-GeneralUser-GS.txt', LICENSE_HASH, normalize=True)
    print('Pinned GeneralUser GS 2.0.3 bank and license verified; bank stays in ignored .cache/')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Generate the small neutral alpha mask used by passing map cloud shadows.

This is a procedural lighting mask, not a replacement for painted map art.
Run from any directory; no Pillow or other external dependencies are needed.
"""
from math import exp, sin, pi
from pathlib import Path
import struct
import zlib

WIDTH, HEIGHT = 256, 128
# Overlapping irregular lobes avoid an obvious moving oval or hard cloud outline.
LOBES = ((.23,.58,.14,.19,.62), (.39,.43,.17,.24,.80),
         (.58,.52,.20,.24,.75), (.73,.41,.13,.17,.60),
         (.76,.63,.12,.15,.42))

def chunk(kind, data):
    return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)

def main():
    rows=bytearray()
    for y in range(HEIGHT):
        rows.append(0)
        v=(y+.5)/HEIGHT
        for x in range(WIDTH):
            u=(x+.5)/WIDTH
            density=sum(weight*exp(-2*((u-cx)/rx)**2-2*((v-cy)/ry)**2)
                        for cx,cy,rx,ry,weight in LOBES)
            edge=sin(pi*u)**2*sin(pi*v)**2
            grain=1+.035*sin(u*39+v*17)+.025*sin(u*21-v*29)
            alpha=round(255*min(1,density)*edge*grain)
            rows.extend((255,255,255,max(0,min(255,alpha))))
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',WIDTH,HEIGHT,8,6,0,0,0))
    png+=chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b'')
    target=Path(__file__).resolve().parents[2]/'assets/overworld-living/common/weather/cloud-shadow.png'
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(png)

if __name__=='__main__':
    main()

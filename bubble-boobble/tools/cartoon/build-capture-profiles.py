#!/usr/bin/env python3
"""Bake fixed collision hulls from the shipped cartoon alpha silhouettes.
Runtime selects them from authoritative enemy age; no renderer/camera is queried.
"""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[2]
def hull(points):
    points=sorted(set(points))
    def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lower=[];upper=[]
    for p in points:
        while len(lower)>=2 and cross(lower[-2],lower[-1],p)<=0:lower.pop()
        lower.append(p)
    for p in reversed(points):
        while len(upper)>=2 and cross(upper[-2],upper[-1],p)<=0:upper.pop()
        upper.append(p)
    return lower[:-1]+upper[:-1]
def profile(path):
    im=Image.open(path).convert('RGBA');alpha=im.getchannel('A');data=alpha.load()
    points=[(x,y) for y in range(im.height) for x in range(im.width) if data[x,y]>=64]
    outline=hull(points)
    return {'bounds':[min(p[0] for p in outline),min(p[1] for p in outline),max(p[0] for p in outline),max(p[1] for p in outline)],'points':outline}
def build():
    animation=json.loads((ROOT/'assets/cartoon/animation.json').read_text());profiles={}
    for kind,clip in animation['enemies'].items():
        base=ROOT/'assets/cartoon/frames/enemy'/kind
        walk=[profile(base/f'walk-{i}.png') for i in range(clip['frames'])]
        profiles[kind]={'ticksPerFrame':clip['ticksPerFrame'],'walk':walk}
        if kind=='mighta':profiles[kind]['shoot']=profile(base/'shoot-0.png')
    dest=ROOT/'data/cartoon-capture-profiles.json'
    dest.write_text(json.dumps({'alphaThreshold':64,'anchor':[64,120],'canvas':128,'enemies':profiles},separators=(',',':'))+'\n')
    print('Capture profiles:',sum(len(p['walk']) for p in profiles.values()),'frames, max hull vertices:',max(len(f['points']) for p in profiles.values() for f in p['walk']))
if __name__=='__main__':build()

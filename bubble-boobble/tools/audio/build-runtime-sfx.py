#!/usr/bin/env python3
"""Original deterministic cartoon Foley/percussion SFX; Python standard library.

Run from project root: python3 tools/audio/build-runtime-sfx.py
No input audio, original-game samples, third-party samples or external tools.
Shipping WAVs/bank under assets/audio/brigade/sfx; review-only reel and metrics
under ignored .cache/audio-production/runtime-sfx. Existing GUIDs survive rebuilds.
"""
from array import array
import hashlib
import json
import math
from pathlib import Path
import random
import sys
import uuid
import wave

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'assets/audio/brigade/sfx'
CACHE = ROOT/'.cache/audio-production/runtime-sfx'
RATE = 48_000
SEED = 19371023
# seconds, target unweighted RMS dBFS, peak ceiling, material/gesture.
CUES = {
 'bubble-shot':(.14,-24,.36,'Soft breath puff and rising rubber pressure'),
 'bubble-pop':(.13,-23,.42,'Wet pressure collapse with a dry snap and airy fizz'),
 'capture':(.42,-19,.55,'Double elastic squeeze with a woody resolving accent'),
 'jump':(.16,-26,.30,'Light spring squeak with a tiny felted contact'),
 'bubble-bounce':(.17,-24,.38,'Round two-stage rubber rebound'),
 'land':(.11,-28,.28,'Cushioned shoe thump and wooden floor contact'),
 'player-downed':(.55,-18,.62,'Descending rubber tumble and padded impact'),
 'rescue':(.58,-17.5,.64,'Three ascending wooden-bell accents and air release'),
 'food-pickup':(.14,-25,.36,'Compact ascending two-note wooden plink'),
 'power-up':(.43,-20,.55,'Bright ascending percussion roll with an elastic lift'),
 'fire':(.28,-22,.48,'Short brushed flame rush with soft crackling embers'),
 'water':(.31,-23,.47,'Liquid splash, droplet rebounds and low bubbly body'),
 'thunder':(.34,-19.5,.62,'Brisk electrical paper snap with low rolling body'),
 'explosion':(.46,-20,.62,'Cushioned cartoon boom, noisy crack and falling debris'),
 'boss-hit':(.20,-18.5,.64,'Solid hollow impact and short rubber grunt'),
 'boss-windup':(.49,-18,.60,'Three escalating wooden knocks with rising pressure'),
 'boss-capture':(.65,-17,.67,'Large elastic contraction followed by a percussion resolution'),
 'countdown-tick':(.10,-23,.43,'Single clear woodblock tick'),
 'go':(.35,-18.5,.60,'Two bright rising struck-bar accents with a brush punctuation'),
 'wave-clear':(.52,-19,.59,'Short ascending wooden-bell reward flourish'),
 'victory':(.87,-18,.65,'Original four-hit C-minor-seventh percussion flourish'),
 'defeat':(.74,-20,.57,'Sympathetic three-step descending wooden stumble'),
 'ui-navigate':(.065,-30,.22,'Small dry wooden contact'),
 'ui-confirm':(.14,-27,.29,'Quick ascending felted two-note confirmation'),
 'ui-back':(.13,-28,.27,'Descending rounded wooden click pair'),
 'ui-unavailable':(.16,-28,.27,'Soft double rattle against a muted wooden stop'),
}


def empty(seconds):
    return [0.] * round(seconds*RATE)


def mix(dst, src, at=0., gain=1.):
    offset = round(at*RATE)
    assert offset >= 0
    for i in range(min(len(src),len(dst)-offset)):
        dst[offset+i] += src[i]*gain


def brush(seconds, rng, amplitude=1., cutoff=.2, decay=7, flutter=0):
    values = empty(seconds)
    slow = fast = 0.
    for i in range(len(values)):
        t = i/RATE
        u = t/seconds
        white = rng.uniform(-1,1)
        slow += cutoff*(white-slow)
        fast += min(.9,cutoff*3)*(white-fast)
        body = .78*slow+.22*(fast-slow)
        envelope = min(1.,t/.0015)*math.exp(-decay*u)*(1-u)
        modulation = 1-flutter*.5+flutter*.5*math.sin(2*math.pi*43*t)**2
        values[i] = amplitude*body*envelope*modulation
    return values


def pressure(seconds, first, last, amplitude=1., wobble=.0):
    values = empty(seconds)
    phase = 0.
    for i in range(len(values)):
        t = i/RATE
        u = t/seconds
        frequency = first*(last/first)**u*(1+wobble*math.sin(2*math.pi*17*t)*math.exp(-8*u))
        phase += 2*math.pi*frequency/RATE
        # Harmonic rubber membrane, short breath envelope; never a square wave.
        value = math.sin(phase)+.21*math.sin(2*phase+.2)+.075*math.sin(3*phase)
        values[i] = amplitude*value*min(1.,t/.002)*(1-u)**2
    return values


def struck(seconds, frequency, rng, amplitude=1., material='wood'):
    modes, damp = {'wood':([1,2.74,4.12],20), 'bell':([1,2.76,5.40],12),
                   'felt':([1,2.02,3.95],32), 'hollow':([1,1.68,2.51],24)}[material]
    phases = [rng.uniform(-.15,.15) for _ in modes]
    values = empty(seconds)
    contact = brush(min(.027,seconds),rng,.18,.42)
    for i in range(len(values)):
        t = i/RATE
        modesum = sum(math.sin(2*math.pi*frequency*ratio*t+phases[k])*
                      math.exp(-t*damp*(1+k*.65))/(1+k*2.1) for k,ratio in enumerate(modes))
        values[i] = amplitude*modesum*min(1,t/.0018)*min(1,(seconds-t)/.018)
    mix(values,contact,gain=amplitude)
    return values


def synth(cue,rng):
    dst = empty(CUES[cue][0])
    def air(d,at=0,g=.6,cut=.2,dec=7,flutter=0):
        mix(dst,brush(d,rng,g,cut,dec,flutter),at)
    def bend(d,f0,f1,at=0,g=.5,w=.03):
        mix(dst,pressure(d,f0,f1,g,w),at)
    def hit(d,f,at=0,g=.5,mat='wood'):
        mix(dst,struck(d,f,rng,g,mat),at)
    def notes(sequence,spacing=.10,start=0,d=.22,g=.4,mat='bell'):
        for i,f in enumerate(sequence): hit(d,f,start+i*spacing,g,mat)
    if cue=='bubble-shot':
        air(.055,g=.8,cut=.13); bend(.13,240,680,g=.5); hit(.09,570,.04,.08,'hollow')
    elif cue=='bubble-pop':
        air(.045,.002,1,.65); bend(.065,880,115,g=.8); air(.08,.035,.3,.32)
    elif cue=='capture':
        bend(.16,410,170,g=.65); bend(.17,240,570,.10,.45)
        notes([523.25,783.99],.045,.18,.19,.27,'wood'); air(.08,g=.35,cut=.15)
    elif cue=='jump':
        bend(.15,155,510,g=.45,w=.08); hit(.05,190,g=.2,mat='felt'); air(.032,g=.24,cut=.14)
    elif cue=='bubble-bounce':
        bend(.08,310,150,g=.6,w=.1); bend(.095,230,440,.065,.3,w=.08); air(.04,g=.3)
    elif cue=='land':
        air(.10,g=1,cut=.055); hit(.10,155,g=.65,mat='hollow'); hit(.055,480,.004,.12,'felt')
    elif cue=='player-downed':
        bend(.32,390,88,g=.65,w=.11); bend(.15,155,62,.26,.35)
        air(.16,.33,.8,.075); hit(.15,115,.35,.4,'hollow')
    elif cue=='rescue':
        bend(.12,250,660,g=.17); notes([523.25,622.25,783.99],.115,.025,.27,.42)
        hit(.25,1046.5,.31,.27,'bell'); air(.075,.28,.17,.14)
    elif cue=='food-pickup':
        notes([622.25,783.99],.045,0,.09,.45,'wood'); air(.02,g=.13)
    elif cue=='power-up':
        notes([523.25,622.25,783.99,1046.5],.075,0,.20,.38)
        bend(.20,260,650,.07,.16); air(.08,.15,.2,.25)
    elif cue=='fire':
        air(.27,g=1.5,cut=.23,dec=3,flutter=.75); air(.07,g=.6,cut=.6)
        bend(.20,125,70,g=.14); air(.06,.11,.32,.55)
    elif cue=='water':
        air(.15,g=1.2,cut=.21,dec=4); bend(.13,220,80,g=.45)
        for i,(f,g) in enumerate([(680,.3),(510,.22),(860,.15)]):
            bend(.085,f,f*.52,.09+i*.055,g)
    elif cue=='thunder':
        air(.07,g=1.8,cut=.7); air(.31,.018,.9,.055,dec=4,flutter=.5)
        hit(.23,78,.015,.65,'hollow'); air(.05,.10,.35,.6)
    elif cue=='explosion':
        air(.085,g=1.5,cut=.43); air(.43,.015,1.1,.048,dec=4)
        bend(.27,120,38,g=.8); hit(.26,65,.025,.6,'hollow')
        for i in range(3): hit(.06,340+i*105,.15+i*.065,.16/(i+1),'wood')
    elif cue=='boss-hit':
        hit(.18,125,g=.9,mat='hollow'); air(.07,g=1,cut=.22)
        bend(.13,210,95,.02,.25,w=.12)
    elif cue=='boss-windup':
        notes([196,233.08,293.66],.14,0,.20,.65,'hollow')
        bend(.38,95,370,.06,.21,w=.06); air(.07,.28,.25,.18)
    elif cue=='boss-capture':
        bend(.23,530,110,g=.8,w=.12); bend(.20,160,620,.15,.45)
        notes([391.99,523.25,622.25],.065,.28,.23,.39,'wood'); air(.09,g=.5,cut=.22)
    elif cue=='countdown-tick': hit(.10,820,g=.8,mat='wood')
    elif cue=='go':
        notes([523.25,1046.5],.09,0,.24,.52,'wood'); air(.075,.095,.33,.28)
    elif cue=='wave-clear':
        notes([523.25,622.25,783.99],.115,0,.27,.42)
        hit(.21,1046.5,.30,.20,'wood')
    elif cue=='victory':
        notes([523.25,622.25,783.99,932.33],.13,0,.34,.45,'wood')
        for f in [523.25,622.25,932.33]: hit(.28,f,.54,.21,'bell')
        air(.08,.53,.25,.19)
    elif cue=='defeat':
        notes([391.99,311.13,261.63],.16,0,.30,.43,'hollow')
        bend(.21,160,70,.43,.22,w=.08); air(.09,.43,.25,.09)
    elif cue=='ui-navigate': hit(.06,630,g=.6,mat='felt'); air(.015,g=.16)
    elif cue=='ui-confirm': notes([622.25,783.99],.045,0,.09,.4,'felt')
    elif cue=='ui-back': notes([622.25,391.99],.04,0,.085,.4,'felt')
    elif cue=='ui-unavailable':
        hit(.10,230,g=.5,mat='hollow'); air(.035,g=.4,cut=.3)
        hit(.085,210,.062,.35,'felt'); air(.025,.065,.25,.25)
    else: raise ValueError(cue)
    # Shared warm rolloff and click-free tapered endpoints, with exact DC removal.
    low=0.; alpha=1-math.exp(-2*math.pi*9000/RATE)
    for i,x in enumerate(dst):
        low += alpha*(x-low)
        dst[i]=low
    edge=round(.002*RATE)
    window=[min(1.,i/edge,(len(dst)-1-i)/edge) for i in range(len(dst))]
    dst=[x*w for x,w in zip(dst,window)]
    dc=sum(dst)/sum(window)
    dst=[x-dc*w for x,w in zip(dst,window)]
    rms=math.sqrt(sum(x*x for x in dst)/len(dst))
    peak=max(abs(x) for x in dst)
    gain=min(10**(CUES[cue][1]/20)/rms,CUES[cue][2]/peak)
    return [x*gain for x in dst]


def write(path,samples):
    pcm=array('h',(round(x*32767) for x in samples))
    assert len(pcm)>0 and pcm[0]==pcm[-1]==0
    peak=max(abs(x) for x in pcm)/32768
    rms=math.sqrt(sum(x*x for x in pcm)/len(pcm))/32768
    dc=sum(pcm)/len(pcm)/32768
    assert 0<peak<.85 and rms>.0001 and abs(dc)<.0001
    little=array('h',pcm)
    if sys.byteorder!='little': little.byteswap()
    with wave.open(str(path),'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(RATE);wav.writeframes(little.tobytes())
    with wave.open(str(path),'rb') as wav:
        assert (wav.getnchannels(),wav.getsampwidth(),wav.getframerate(),wav.getnframes())==(1,2,RATE,len(pcm))
        assert wav.readframes(len(pcm))==little.tobytes()
    return dict(file=str(path.relative_to(ROOT)),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                frames=len(pcm),duration_seconds=len(pcm)/RATE,decoded_pcm_bytes=len(pcm)*2,
                peak_dbfs=20*math.log10(peak),rms_dbfs=20*math.log10(rms),dc_offset_full_scale=dc,
                sample_rate=RATE,channels=1,bits_per_sample=16,endpoints_zero=True)


def sidecar(path,importer,settings=''):
    meta=Path(str(path)+'.gmeta')
    if not meta.exists():
        meta.write_text(f'guid = "{uuid.uuid4()}"\nimporter = "{importer}"\n'+settings)


def main():
    OUT.mkdir(parents=True,exist_ok=True);CACHE.mkdir(parents=True,exist_ok=True)
    records=[];reel=empty(.4);timeline=[]
    for cue,definition in CUES.items():
        seed=SEED+int.from_bytes(hashlib.sha256(cue.encode()).digest()[:8],'big')
        samples=synth(cue,random.Random(seed))
        record=write(OUT/f'{cue}.wav',samples)
        cooldown=.06 if cue in ('bubble-shot','bubble-pop') or cue.startswith('ui-') else .08 if cue=='jump' else .1
        if cue in ('food-pickup','land','bubble-bounce'):cooldown=.06
        sidecar(OUT/f'{cue}.wav','audio',f'\n[settings]\nmono = true\nnormalize = false\ncodec = "adpcm"\ncooldown = {cooldown}\n')
        record.update(cue=cue,seed=seed,description=definition[3],cooldown_seconds=cooldown,codec='adpcm')
        timeline.append(dict(cue=cue,start_seconds=len(reel)/RATE,duration_seconds=len(samples)/RATE))
        reel.extend(samples);reel.extend(empty(.45));records.append(record)
    assert len(records)==26 and len({r['sha256'] for r in records})==26
    total=sum(r['decoded_pcm_bytes'] for r in records)
    assert total<1_500_000 and all(r['duration_seconds']<1.2 for r in records)
    bank=OUT/'core.bank.json'
    bank.write_text(json.dumps(dict(sounds=[f'audio/brigade/sfx/{cue}' for cue in CUES]),indent=2)+'\n')
    sidecar(bank,'bank')
    reel_record=write(CACHE/'audition-reel.wav',reel)
    manifest=dict(seed=SEED,provenance='Original mathematical filtered-noise, pressure-membrane glides and damped wooden/felt/bell resonators; no input recordings or samples.',
                  generator='tools/audio/build-runtime-sfx.py',generator_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  codec_note='ADPCM for short textured impacts; tonal accents use damped multi-mode percussion rather than pure sustained tones. normalize=false preserves authored hierarchy.',
                  loudness_note='Unweighted RMS targets plus individual peak ceilings; no LUFS claim or device/listening verification.',
                  total_decoded_pcm_bytes=total,decoded_memory_formula='48,000Hz × mono × 16bit × duration; review reel excluded',
                  bank_key='audio/brigade/sfx/core.bank',cues=records,audition_reel=reel_record,audition_timeline=timeline)
    (CACHE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(dict(cues=len(records),decoded_pcm_bytes=total,duration_seconds=sum(r['duration_seconds'] for r in records),manifest=str(CACHE/'manifest.json')),indent=2))


if __name__=='__main__':main()

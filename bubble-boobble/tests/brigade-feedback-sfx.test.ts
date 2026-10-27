import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {createBoss} from '../src/arcade/boss';
import {advanceFeel,emptyFeel,packFeel,unpackFeel,deriveFeelAudio} from '../src/arcade/juice';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState,TITLE_REVEAL_STEPS} from '../src/desktop/state';

const scene='scenes/cartoon.scene.json';
const party=()=>createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon');
worldTest('brigade feedback countdown boundaries survive packing and pause without visual cues',()=>{
 const g=party();g.Countdown=181;g.Party!.Timer=181;
 let feel=advanceFeel(emptyFeel(),g,0);
 const emitted:string[]=[];
 for(const [tick,countdown] of [[1,180],[2,179],[3,120],[4,119],[5,60],[6,59],[7,0]]){
  g.Tick=tick!;g.Countdown=countdown!;g.Party!.Timer=countdown!;
  if(countdown===0)g.Party!.Phase='combat';
  emitted.push(...deriveFeelAudio(unpackFeel(packFeel(feel)),g).map(c=>c.kind));
  const next=advanceFeel(unpackFeel(packFeel(feel)),g,tick!);
  feel=next;
 }
 expect(emitted.filter(k=>k==='countdown-tick').length).toBe(3);
 expect(emitted.filter(k=>k==='go').length).toBe(1);
 expect(unpackFeel(packFeel(feel))).toEqual(feel);
 expect(feel.cues.length).toBe(0);
 const before=JSON.stringify(g);g.Paused=true;
 const paused=advanceFeel(feel,g,100);
 expect(paused.clock).toBe(feel.clock);expect(paused.cues).toEqual(feel.cues);
 expect(JSON.stringify({...g,Paused:false})).toBe(before);
});

worldTest('brigade feedback boss warning capture and defeat are ephemeral and preserve visual capacity',()=>{
 const g=party();g.Party!.Phase='boss';g.Party!.Boss=createBoss(6,g.Level);
 let feel=advanceFeel(emptyFeel(),g,0);
 feel.cues=Array.from({length:32},(_,slot)=>({kind:'land',x:10,y:10,at:0,slot,strength:1}));
 const visual=feel.cues;
 g.Tick++;g.Party!.Boss!.Mode='windup';
 expect(deriveFeelAudio(feel,g)).toEqual([{kind:'boss-windup'}]);
 feel=advanceFeel(feel,g,1);
 expect(feel.cues).toEqual(visual);expect(feel.cues.length).toBe(32);
 expect(deriveFeelAudio(feel,g)).toEqual([]);
 g.Tick++;g.Party!.Boss!.Mode='captured';
 expect(deriveFeelAudio(feel,g)).toEqual([{kind:'boss-capture'}]);
 feel=advanceFeel(feel,g,2);
 expect(feel.cues.filter(c=>c.kind==='capture').length).toBe(1);
 g.Tick++;g.State=3;
 expect(deriveFeelAudio(feel,g)).toEqual([{kind:'defeat'}]);
 feel=advanceFeel(feel,g,3);
 expect(unpackFeel(packFeel(feel))).toEqual(feel);
 expect(deriveFeelAudio(feel,g)).toEqual([]);
});

worldTest('brigade feedback countdown reset drops stale stages and never emits stale GO',()=>{
 const g=party();g.Tick=100;g.Party!.Timer=120;g.Countdown=120;
 const old=advanceFeel(emptyFeel(),g,100);
 g.Tick=0;g.Party!.Timer=180;g.Countdown=180;
 expect(deriveFeelAudio(old,g)).toEqual([{kind:'countdown-tick'}]);
 g.Paused=true;
 const resetPaused=advanceFeel(old,g,101);
 expect(resetPaused.previous!.countdown).toBe(-1);
 g.Paused=false;expect(deriveFeelAudio(resetPaused,g)).toEqual([{kind:'countdown-tick'}]);
 g.Party!.Phase='combat';
 expect(deriveFeelAudio(old,g)).toEqual([]);
 g.Tick=101;g.Party!.Wave=0;
 expect(deriveFeelAudio(old,g)).toEqual([]);
});

worldTest('brigade feedback illustrated UI navigates confirms backs and rejects once and respects mute',async({step,input,audio})=>{
 await step(8);
 let cursor=0;
 const mark=()=>{cursor=audio.sounds().length;};
 const cues=()=>audio.sounds().slice(cursor).filter(s=>s.sound.startsWith('audio/brigade/sfx/ui-'));
 expect(cues().length).toBe(0);mark();
 input.emit(DesktopIntent,{action:'select',index:1});await step(1);
 expect(cues().map(s=>s.sound)).toEqual(['audio/brigade/sfx/ui-navigate']);
 expect(cues()[0]!.bus).toBe('UI');mark();
 await step(5);expect(cues().length).toBe(0);mark();
 input.emit(DesktopIntent,{action:'ui-activate',value:'settings'});await step(1);
 expect(cues().map(s=>s.sound)).toEqual(['audio/brigade/sfx/ui-confirm']);mark();
 input.emit(DesktopIntent,{action:'menu'});await step(1);
 expect(cues().map(s=>s.sound)).toEqual(['audio/brigade/sfx/ui-back']);
 input.emit(DesktopIntent,{action:'new-profile'});await step(1);mark();
 input.emit(DesktopIntent,{action:'create-profile'});await step(1);
 expect(cues().map(s=>s.sound)).toEqual(['audio/brigade/sfx/ui-unavailable']);mark();
 await step(5);expect(cues().length).toBe(0);
 input.emit(DesktopIntent,{action:'menu'});await step(1);
 input.action('mute',1);await step(1);input.action('mute',0);await step(1);mark();
 input.emit(DesktopIntent,{action:'select',index:1});await step(1);expect(cues().length).toBe(0);
},{scene});

import {CartoonOverhaul} from '../src/cartoon/overhaul.cheats';
import {BrigadeSfxProbe} from '../src/arcade/sfx.cheats';
import {PlaySound} from '@gameengine/runtime';
worldTest('brigade feedback actual windup landing wave and outcomes use new cues once without duplicate semantic capture',async({step,cheat,input,audio,world})=>{
 await step(8);await cheat(CartoonOverhaul,{scenario:'boss'});
 let cursor=audio.sounds().length;
 const mark=()=>{cursor=audio.sounds().length;};
 const sounds=(name:string)=>audio.sounds().slice(cursor).filter(s=>s.sound===`audio/brigade/sfx/${name}`);
 await cheat(BrigadeSfxProbe,{scenario:'boss-windup'});
 expect(sounds('boss-windup').length).toBe(1);mark();
 await step(1);expect(sounds('boss-windup').length).toBe(0);mark();
 await cheat(BrigadeSfxProbe,{scenario:'boss-capture'});
 expect(world.events(PlaySound).filter(s=>s.sound==='audio/brigade/sfx/boss-capture').length).toBe(1);
 expect(sounds('boss-capture').length).toBe(0);
 input.emit(DesktopIntent,{action:'effects'});await step(1);
 await cheat(BrigadeSfxProbe,{scenario:'airborne'});mark();
 await cheat(BrigadeSfxProbe,{scenario:'landing'});
 expect(sounds('land').length).toBe(1);mark();
 await cheat(BrigadeSfxProbe,{scenario:'wave-clear'});
 expect(sounds('wave-clear').length).toBe(1);mark();
 await cheat(BrigadeSfxProbe,{scenario:'defeat'});
 expect(sounds('defeat').length).toBe(1);mark();
 await step(2);expect(sounds('defeat').length).toBe(0);
},{scene});

worldTest('brigade feedback countdown emits actual ticks and go only at boundaries and stays muted',async({step,cheat,input,audio})=>{
 await step(8);await cheat(CartoonOverhaul,{scenario:'combat'});
 await cheat(BrigadeSfxProbe,{scenario:'countdown'});
 const sounds:string[]=[];
 let cursor=audio.sounds().length;
 for(let tick=0;tick<182;tick++){
  await step(1);
  sounds.push(...audio.sounds().slice(cursor).filter(s=>s.sound==='audio/brigade/sfx/countdown-tick'||s.sound==='audio/brigade/sfx/go').map(s=>s.sound));
  cursor=audio.sounds().length;
 }
 expect(sounds.filter(s=>s.endsWith('/countdown-tick')).length).toBe(3);
 expect(sounds.filter(s=>s.endsWith('/go')).length).toBe(1);
 input.action('mute',1);await step(1);input.action('mute',0);await step(1);
 cursor=audio.sounds().length;
 await cheat(BrigadeSfxProbe,{scenario:'countdown'});
 await step(1);
 expect(audio.sounds().slice(cursor).filter(s=>s.sound==='audio/brigade/sfx/countdown-tick').length).toBe(0);
},{scene});

import {classicIntroAudioStage,uiAudioSnapshot,uiAudioCue} from '../src/desktop/ui-audio';
import {initialDesktopSave} from '../src/desktop/save';
import {initialDesktopState} from '../src/desktop/state';
import {createGame} from '../src/arcade/game';
import {createCartoonArena} from '../src/cartoon/arena';
import {cartoonFlowTiming} from '../src/cartoon/flow-timing';
worldTest('brigade feedback classic ready countdown follows visible cover timeline and freezes during pause',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42);
 const state={...initialDesktopState,cartoon:true,screen:'play' as const,transitionAction:'start',transitionHasTitle:true,transitionStartedStep:10};
 const timing=cartoonFlowTiming(true,'start',false);
 expect(classicIntroAudioStage(state,g,10+timing.revealEndAt-1)).toBe('off');
 expect(classicIntroAudioStage(state,g,10+timing.revealEndAt)).toBe('ready-3');
 expect(classicIntroAudioStage(state,g,10+timing.revealEndAt+30)).toBe('ready-2');
 expect(classicIntroAudioStage(state,g,10+timing.revealEndAt+60)).toBe('ready-1');
 g.Paused=true;expect(classicIntroAudioStage({...state,screen:'pause'},g,999)).toBe(null);
 g.Paused=false;g.Countdown=60;
 expect(classicIntroAudioStage({...state,transitionAction:''},g,0)).toBe('go');
});

worldTest('brigade feedback keyboard selection and zero sound settings do not produce idle or muted UI noise',async({step,input,audio})=>{
 await step(8);
 input.key(38,true);input.key(38,false);await step(1);
 // Keyboard navigation belongs to the revealed menu, after its opening input is consumed.
 for(let frame=0;frame<TITLE_REVEAL_STEPS+3&&desktopState.get().titleRevealActive;frame++)await step(1);
 await step(1);expect(desktopState.get().titleRevealActive).toBe(false);expect(desktopState.get().menuInputArmed).toBe(true);
 let cursor=audio.sounds().length;
 input.key(53,true);await step(1);
 expect(audio.sounds().slice(cursor).filter(s=>s.sound==='audio/brigade/sfx/ui-navigate').length).toBe(1);
 input.key(53,false);await step(1);
 input.emit(DesktopIntent,{action:'ui-activate',value:'settings'});await step(1);
 for(let n=0;n<3;n++){input.emit(DesktopIntent,{action:'sound',index:-1});await step(1);}
 cursor=audio.sounds().length;
 input.emit(DesktopIntent,{action:'select',index:2});await step(1);
 expect(audio.sounds().slice(cursor).filter(s=>s.sound.startsWith('audio/brigade/sfx/ui-')).length).toBe(0);
 cursor=audio.sounds().length;
 await step(10);expect(audio.sounds().slice(cursor).filter(s=>s.sound.startsWith('audio/brigade/sfx/ui-')).length).toBe(0);
},{scene});

worldTest('brigade feedback result selection navigates deliberately without an automatic entry cue',()=>{
 const play=uiAudioSnapshot({...initialDesktopState,cartoon:true,screen:'play'},initialDesktopSave);
 const result=uiAudioSnapshot({...initialDesktopState,cartoon:true,screen:'result',selected:0,resultReady:true},initialDesktopSave);
 expect(uiAudioCue(play,result)).toBe(null);
 expect(uiAudioCue(result,{...result,selected:1})).toBe('ui-navigate');
});

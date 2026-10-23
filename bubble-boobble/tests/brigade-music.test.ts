import {expect,worldTest} from '@gameengine/test';
import {PlayMusic,StopMusic} from '@gameengine/runtime';
import {ArcadeAudio,DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {ResetArcade} from '../src/arcade/arcade.cheats';
import {CartoonOverhaul} from '../src/cartoon/overhaul.cheats';
import {MusicPlaybackProbe} from '../src/arcade/music.cheats';
import {nativeBridgeMusicState,selectArcadeMusic} from '../src/arcade/music-policy';

const scene='scenes/cartoon.scene.json';
worldTest('brigade music default illustrated menu and team setup play the approved ballroom track',async({step,input,audio,world})=>{
 await step(8);
 expect(desktopState.get().cartoon).toBe(true);
 expect(world.resource(ArcadeAudio).track).toBe('brigade-menu');
 expect(audio.status().music).toBe('audio/brigade/menu');
 for(const page of ['menu','modes','party','settings']){
  input.emit(DesktopIntent,{action:'navigate',value:page});await step(1);
  expect(desktopState.get().screen).toBe(page);
  expect(audio.status().music).toBe('audio/brigade/menu');
  expect(world.events(PlayMusic).length).toBe(0);
 }
},{scene});

worldTest('brigade music illustrated gameplay stays audible across native readiness ACKs without restarts',async({step,input,cheat,audio,world})=>{
 await step(8);await cheat(CartoonOverhaul,{scenario:'boss'});
 expect(world.resource(ArcadeAudio).track).toBe('brigade-gameplay');
 expect(audio.status().music).toBe('audio/brigade/gameplay');
 for(const value of ['1','1','0','1']){
  input.emit(DesktopIntent,{action:'native-audio',value});await step(1);
  expect(world.resource(ArcadeAudio).native).toBe(value==='1');
  expect(audio.status().music).toBe('audio/brigade/gameplay');
  expect(audio.status().buses.Music).toBe(.5);
  expect(world.events(PlayMusic).length).toBe(0);
  expect(world.events(StopMusic).length).toBe(0);
 }
},{scene});

worldTest('brigade music illustrated win and defeat stop music without inherited outcome requests',async({step,input,cheat,world,audio})=>{
 await step(8);
 for(const outcome of ['win','lose']){
  await cheat(ResetArcade,{ready:false});
  await cheat(MusicPlaybackProbe,{cartoon:true,outcome});
  expect(world.resource(ArcadeAudio).track).toBe('brigade-silent');
  expect(world.events(PlayMusic).length).toBe(0);
  expect(world.events(StopMusic).length).toBe(1);
  expect(audio.status().music).toBe(null);
  await step(1);expect(world.events(StopMusic).length).toBe(0);
  const assertSilent=()=>{
   expect(world.resource(ArcadeAudio).track).toBe('brigade-silent');
   expect(audio.status().music).toBe(null);
   expect(world.events(PlayMusic).length).toBe(0);
   expect(world.events(StopMusic).length).toBe(0);
  };
  for(const value of ['1','0']){
   input.emit(DesktopIntent,{action:'native-audio',value});await step(1);assertSilent();
  }
  input.action('mute',1);await step(1);assertSilent();
  input.action('mute',0);await step(1);assertSilent();
  input.action('mute',1);await step(1);assertSilent();
  input.action('mute',0);await step(1);assertSilent();
 }
},{scene});

worldTest('brigade music entering and leaving classic restores engine ownership with unchanged native availability',async({step,input,cheat,audio,world})=>{
 await step(8);
 input.emit(DesktopIntent,{action:'native-audio',value:'1'});await step(1);
 expect(audio.status().music).toBe('audio/brigade/menu');
 await cheat(MusicPlaybackProbe,{cartoon:false});
 expect(world.resource(ArcadeAudio).track).toBe('menu');
 expect(audio.status().music).toBe(null);
 expect(audio.status().buses.Music).toBe(0);
 input.emit(DesktopIntent,{action:'cartoon-mode'});await step(1);
 expect(world.resource(ArcadeAudio).native).toBe(true);
 expect(audio.status().music).toBe('audio/brigade/menu');
 expect(audio.status().buses.Music).toBe(.5);
 expect(world.events(PlayMusic).map(e=>e.track)).toEqual(['audio/brigade/menu']);
 await cheat(MusicPlaybackProbe,{cartoon:false});
 input.emit(DesktopIntent,{action:'native-audio',value:'0'});await step(1);
 expect(audio.status().music).toBe('reference/audio/music-bubble-2');
 expect(audio.status().buses.Music).toBe(.5);
},{scene});

worldTest('brigade music mute pause and slider change gain without restarting approved gameplay',async({step,input,cheat,audio,world})=>{
 await step(8);await cheat(ResetArcade,{ready:false});
 input.emit(DesktopIntent,{action:'native-audio',value:'1'});await step(1);
 const assertGain=(volume:number)=>{
  expect(audio.status().music).toBe('audio/brigade/gameplay');
  expect(audio.status().buses.Music).toBe(volume);
  expect(world.events(PlayMusic).length).toBe(0);
 };
 input.emit(DesktopIntent,{action:'music',index:-1});await step(1);assertGain(.25);
 input.action('mute',1);await step(1);assertGain(0);
 input.action('mute',0);await step(1);
 input.action('mute',1);await step(1);assertGain(.25);
 input.action('mute',0);input.emit(DesktopIntent,{action:'pause'});await step(1);assertGain(0);
 input.emit(DesktopIntent,{action:'resume'});await step(12);assertGain(.25);
},{scene});

worldTest('brigade music native bridge silences inherited YM even with a stale classic track',()=>{
 for(const classicTrack of ['bubble-1','bubble-2','bubble-3','bubble-4','bubble-5']){
  expect(nativeBridgeMusicState({cartoon:true},classicTrack,false)).toEqual({track:'',muted:true});
  expect(nativeBridgeMusicState({cartoon:true},classicTrack,true)).toEqual({track:'',muted:true});
  expect(nativeBridgeMusicState({cartoon:false},classicTrack,false)).toEqual({track:classicTrack,muted:false});
  expect(nativeBridgeMusicState({},classicTrack,true)).toEqual({track:classicTrack,muted:true});
 }
 for(const State of [0,1,2])for(const Hurry of [false,true])
  expect(selectArcadeMusic({cartoon:true},{State,Hurry})).toEqual({track:'brigade-gameplay',asset:'audio/brigade/gameplay'});
 for(const State of [3,4])expect(selectArcadeMusic({cartoon:true},{State,Hurry:true})).toEqual({track:'brigade-silent',asset:null});
 expect(selectArcadeMusic({},null)).toEqual({track:'menu',asset:'reference/audio/music-bubble-2'});
 expect(selectArcadeMusic({}, {State:1,Hurry:false})).toEqual({track:'theme',asset:'reference/audio/music-bubble-1'});
 expect(selectArcadeMusic({}, {State:1,Hurry:true})).toEqual({track:'hurry',asset:'reference/audio/music-bubble-3'});
 expect(selectArcadeMusic({}, {State:3,Hurry:true})).toEqual({track:'gameover',asset:'reference/audio/music-bubble-4'});
 expect(selectArcadeMusic({}, {State:4,Hurry:true})).toEqual({track:'win',asset:'reference/audio/music-bubble-5'});
},{scene});

worldTest('brigade music bridge posting policy uses the latest theme after health discovery',async()=>{
 let flow:{cartoon?:boolean}={cartoon:false};
 const beforeHealth=nativeBridgeMusicState(flow,'bubble-2',false);
 expect(beforeHealth).toEqual({track:'bubble-2',muted:false});
 await Promise.resolve();
 flow={cartoon:true};
 // /state builds its policy after /health, using the current document and
 // audio resource even if the logical track has not switched this step yet.
 expect(nativeBridgeMusicState(flow,'bubble-2',false)).toEqual({track:'',muted:true});
},{scene});

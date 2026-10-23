import {worldTest,expect} from '@gameengine/test';
import {PlaySound,StopMusic,LoadSoundBank,UnloadSoundBank} from '@gameengine/runtime';
import {ArcadeAudio,DesktopIntent} from '../src/schema.gen';
import {ResetArcade,PopBurst} from '../src/arcade/arcade.cheats';
import {CartoonOverhaul} from '../src/cartoon/overhaul.cheats';
import {BrigadeSfxProbe} from '../src/arcade/sfx.cheats';
import {session} from '../src/arcade/session';
import {desktopSaveState} from '../src/desktop/save';
import {MusicPlaybackProbe} from '../src/arcade/music.cheats';
import {brigadeTokenSound} from '../src/arcade/sfx-policy';

const scene='scenes/cartoon.scene.json',prefix='audio/brigade/sfx/';
worldTest('brigade SFX token policy maps every inherited family with bounded deterministic variation',()=>{
 const mappings={shoot:'bubble-shot',pop:'bubble-pop',jump:'jump',death:'player-downed',food:'food-pickup',item:'power-up',fire:'fire',water:'water',laser:'thunder',explosion:'explosion',rescue:'rescue','boss-capture':'boss-capture'};
 for(const [token,name] of Object.entries(mappings)){
  const cue=brigadeTokenSound(token,7,3)!;
  expect(cue.sound).toBe(prefix+name);
  expect(cue.maxVoices>=2&&cue.maxVoices<=3).toBe(true);
  expect(cue).toEqual(brigadeTokenSound(token,7,3));
 }
 expect(brigadeTokenSound('opening',7)).toBe(null);
 expect(brigadeTokenSound('unknown',7)).toBe(null);
 expect(brigadeTokenSound('shoot',7)!.pitch).toBe(1.05);
 expect(brigadeTokenSound('pop',7,99)!.pitch).toBe(1.27);
},{scene});

worldTest('brigade SFX mixed normal jump and bubble bounce retain one genuine jump cue',async({step,cheat,world})=>{
 await step(8);await cheat(ResetArcade,{ready:false,players:2});
 await cheat(BrigadeSfxProbe,{scenario:'bubble-bounce'});
 expect(session.get().game!.Sounds.filter(s=>s==='jump').length).toBe(1);
 expect(world.events(PlaySound).filter(e=>e.sound===prefix+'jump').length).toBe(0);
 await cheat(BrigadeSfxProbe,{scenario:'mixed-jump-bounce'});
 expect(session.get().game!.Sounds.filter(s=>s==='jump').length).toBe(2);
 expect(world.events(PlaySound).filter(e=>e.sound===prefix+'jump').length).toBe(1);
},{scene});

worldTest('brigade SFX palette exit stops residual new voices before the classic mute epoch',async({step,cheat,input,audio,world})=>{
 await step(8);await cheat(ResetArcade,{ready:false});
 // Isolate SFX voice ownership from the separate engine music player.
 input.emit(StopMusic,{fade:0});
 input.emit(PlaySound,{sound:prefix+'rescue',loop:true,maxVoices:2});await step(1);
 expect(audio.status().voices).toBeGreaterThan(0);
 await cheat(MusicPlaybackProbe,{cartoon:false});
 expect(world.events(UnloadSoundBank).map(e=>e.bank)).toEqual(['audio/brigade/sfx/core.bank']);
 // Classic music starts on palette exit; stop it before counting SFX voices.
 input.emit(StopMusic,{fade:0});await step(1);expect(audio.status().voices).toBe(0);
 input.action('mute',1);await step(1);
 expect(world.events(UnloadSoundBank).map(e=>e.bank)).toEqual(['reference/audio/sfx.bank','audio/juice.bank']);
},{scene});
worldTest('brigade SFX actual pickups explosions damage jump and elements use the new palette',async({step,cheat,world,audio})=>{
 await step(8);
 expect(audio.status().banks['audio/brigade/sfx/core.bank']?.ready).toBe(true);
 const cases=[['food','food','food-pickup'],['power-up','item','power-up'],['explosion','explosion','explosion'],
  ['death','death','player-downed'],['jump','jump','jump'],['fire','fire','fire'],['water','water','water'],['thunder','laser','thunder'],['pop','pop','bubble-pop']] as const;
 for(const [scenario,token,cue] of cases){
  await cheat(ResetArcade,{ready:false});
  await cheat(BrigadeSfxProbe,{scenario});
  expect(session.get().game!.Sounds.includes(token!)).toBe(true);
  const sounds=world.events(PlaySound);
  expect(sounds.some(e=>e.sound===prefix+cue)).toBe(true);
  expect(sounds.every(e=>e.sound?.startsWith(prefix))).toBe(true);
  expect(sounds.find(e=>e.sound===prefix+cue)!.maxVoices).toBeLessThanOrEqual(3);
  if(scenario==='food')expect(session.get().game!.Items.length).toBe(0);
  if(scenario==='power-up')expect(session.get().game!.Players[0]!.Power.Pink).toBe(true);
  if(scenario==='death'){
   expect(session.get().game!.Players[0]!.Dead).toBeGreaterThan(0);
   expect(sounds.find(e=>e.sound===prefix+cue)!.priority).toBeGreaterThanOrEqual(90);
   expect(sounds.find(e=>e.sound===prefix+cue)!.maxVoices).toBe(2);
  }
 }
},{scene});

worldTest('brigade SFX ten dragons coalesce shot and pop families without reduced effects silencing feedback',async({step,cheat,input,world})=>{
 await step(8);await cheat(CartoonOverhaul,{scenario:'combat',team:10,humans:10});
 const priority=world.resource(ArcadeAudio).sfxPriority;
 for(let i=1;i<=10;i++)input.action(`partyFire${i}`,1);
 await step(1);
 expect(session.get().game!.Sounds.filter(s=>s==='shoot').length).toBe(10);
 const shots=world.events(PlaySound).filter(e=>e.sound===prefix+'bubble-shot');
 expect(shots.length).toBe(1);expect(shots[0]!.maxVoices).toBe(3);
 expect(world.resource(ArcadeAudio).sfxPriority).toBe(priority);
 for(let i=1;i<=10;i++)input.action(`partyFire${i}`,0);
 await step(1);await cheat(PopBurst,{});
 expect(world.events(PlaySound).filter(e=>e.sound===prefix+'bubble-pop').length).toBe(1);
 input.emit(DesktopIntent,{action:'effects'});await step(1);
 expect(desktopSaveState.get().settings.reducedEffects).toBe(true);
 await step(25);input.action('partyFire1',1);await step(1);
 expect(world.events(PlaySound).filter(e=>e.sound===prefix+'bubble-shot').length).toBe(1);
},{scene});

worldTest('brigade SFX mute reload volume zero and pause preserve feedback controls',async({step,cheat,input,world,audio})=>{
 await step(8);await cheat(ResetArcade,{ready:false});
 input.action('fire',1);await step(1);
 expect(world.events(PlaySound).find(e=>e.sound===prefix+'bubble-shot')!.volume).toBeCloseTo(.75*.48,6);
 input.action('fire',0);input.action('mute',1);await step(1);
 expect(world.events(UnloadSoundBank).map(e=>e.bank)).toEqual(['reference/audio/sfx.bank','audio/juice.bank','audio/brigade/sfx/core.bank']);
 expect(audio.status().voices).toBe(0);
 input.action('mute',0);await step(1);await cheat(ResetArcade,{ready:false});
 input.action('fire',1);await step(1);expect(world.events(PlaySound).length).toBe(0);
 input.action('fire',0);input.action('mute',1);await step(1);
 expect(world.events(LoadSoundBank).map(e=>e.bank)).toEqual(['reference/audio/sfx.bank','audio/juice.bank','audio/brigade/sfx/core.bank']);
 input.action('mute',0);await step(1);
 for(let i=0;i<3;i++){input.emit(DesktopIntent,{action:'sound',index:-1});await step(1);}
 expect(desktopSaveState.get().settings.sound).toBe(0);
 await cheat(ResetArcade,{ready:false});input.action('fire',1);await step(1);
 expect(world.events(PlaySound).length).toBe(0);
 input.action('fire',0);input.emit(DesktopIntent,{action:'sound',index:1});await step(1);
 input.emit(DesktopIntent,{action:'pause'});await step(1);
 input.action('fire',1);await step(1);expect(world.events(PlaySound).length).toBe(0);
},{scene});

worldTest('brigade SFX rescue and boss capture use distinct producer tokens instead of generic powerups',async({step,cheat,world})=>{
 await step(8);await cheat(CartoonOverhaul,{scenario:'rescue'});
 await cheat(BrigadeSfxProbe,{scenario:'rescue'});
 expect(session.get().game!.Sounds.includes('rescue')).toBe(true);
 expect(world.events(PlaySound).map(e=>e.sound)).toEqual([prefix+'rescue']);
 await cheat(CartoonOverhaul,{scenario:'rescue'});
 await cheat(BrigadeSfxProbe,{scenario:'rescue-pickup'});
 expect(session.get().game!.Sounds.includes('rescue')).toBe(true);
 expect(session.get().game!.Sounds.includes('item')).toBe(true);
 expect(world.events(PlaySound).filter(e=>e.sound===prefix+'rescue').length).toBe(1);
 expect(world.events(PlaySound).filter(e=>e.sound===prefix+'power-up').length).toBe(1);
 await cheat(CartoonOverhaul,{scenario:'boss'});
 await cheat(BrigadeSfxProbe,{scenario:'boss-capture'});
 expect(session.get().game!.Sounds.includes('boss-capture')).toBe(true);
 expect(world.events(PlaySound).map(e=>e.sound)).toEqual([prefix+'boss-capture']);
},{scene});

worldTest('brigade SFX illustrated bank reloads after mute switches through the classic palette',async({step,cheat,input,world,audio})=>{
 await step(8);await cheat(ResetArcade,{ready:false});
 input.action('mute',1);await step(1);
 expect(world.events(UnloadSoundBank).some(e=>e.bank==='audio/brigade/sfx/core.bank')).toBe(true);
 input.action('mute',0);await step(1);
 await cheat(MusicPlaybackProbe,{cartoon:false});
 input.action('mute',1);await step(1);
 expect(world.events(LoadSoundBank).map(e=>e.bank)).toEqual(['reference/audio/sfx.bank','audio/juice.bank']);
 input.action('mute',0);await step(1);
 await cheat(MusicPlaybackProbe,{cartoon:true});
 expect(world.events(LoadSoundBank).some(e=>e.bank==='audio/brigade/sfx/core.bank')).toBe(true);
 expect(audio.status().banks['audio/brigade/sfx/core.bank']?.ready).toBe(true);
 await cheat(ResetArcade,{ready:false});input.action('fire',1);await step(1);
 expect(world.events(PlaySound).some(e=>e.sound===prefix+'bubble-shot')).toBe(true);
},{scene});

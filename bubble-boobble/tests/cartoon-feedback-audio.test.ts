import { expect, worldTest } from '@gameengine/test';
import { PlaySound } from '@gameengine/runtime';
import { DesktopIntent } from '../src/schema.gen';
import { session } from '../src/arcade/session';
import { PopBurst } from '../src/arcade/arcade.cheats';
import { desktopSaveState } from '../src/desktop/save';

worldTest('cartoon feedback adventure uses bounded shot and pop cues and keeps essential sound in reduced effects',async({step,input,world,cheat,audio})=>{
 await step(8);
 input.emit(DesktopIntent,{action:'start'});await step(185);
 expect(session.get().game!.Party).toBe(undefined);
 expect(session.get().game!.Level.arena).toBe('cartoon-courtyard');
 input.action('fire',1);await step(1);
 const shots=world.events(PlaySound).filter(s=>s.sound==='audio/bubble-shot');
 expect(shots.length).toBe(1);expect(shots[0]!.maxVoices).toBe(3);
 expect(world.events(PlaySound).some(s=>s.sound==='reference/audio/shoot')).toBe(false);
 expect(audio.status().banks['audio/juice.bank']?.ready).toBe(true);
 input.action('fire',0);await step(1);
 await cheat(PopBurst,{});
 const pops=world.events(PlaySound).filter(s=>s.sound==='audio/bubble-pop');
 expect(pops.length).toBe(1);expect(pops[0]!.priority).toBeGreaterThan(shots[0]!.priority);expect(pops[0]!.maxVoices).toBe(2);
 input.emit(DesktopIntent,{action:'effects'});await step(1);
 expect(desktopSaveState.get().settings.reducedEffects).toBe(true);
 await step(25);input.action('fire',1);await step(1);
 expect(world.events(PlaySound).filter(s=>s.sound==='audio/bubble-shot').length).toBe(1);
 input.action('fire',0);input.action('mute',1);await step(1);
 input.action('mute',0);await step(25);input.action('fire',1);await step(1);
 expect(world.events(PlaySound).length).toBe(0);
},{scene:'scenes/cartoon.scene.json'});

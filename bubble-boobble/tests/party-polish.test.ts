import { expect, worldTest } from '@gameengine/test';
import { PlaySound } from '@gameengine/runtime';
import campaign from '../data/levels.json';
import { createPartyGame, preparePartyWave } from '../src/arcade/party';
import { stepGame } from '../src/arcade/game';
import { arcadeDrawPlan } from '../src/arcade/presentation';
import { item } from '../src/arcade/items';
import { hudModel } from '../src/desktop/hud.view';
import { initialDesktopSave } from '../src/desktop/save';
import { PartyReset } from '../src/arcade/party.cheats';
import { PopBurst, ResetArcade } from '../src/arcade/arcade.cheats';
import { session } from '../src/arcade/session';
const scene='scenes/arcade.scene.json',idle={Move:0,Jump:false,Fire:false};

worldTest('party polish flyers descend and idle without moving their simulation formation',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:6},()=> 'human'));
 const formation=g.Enemies.map(e=>[e.X,e.Y,e.Age]),e=g.Enemies.find(e=>e.Kind==='monsta')!;
 const dragonDraws=arcadeDrawPlan(g).filter(d=>d.image.includes('/bubble/'));
 expect(dragonDraws.length).toBe(0);
 const first=()=>arcadeDrawPlan(g).find(d=>d.x===e.X&&d.image.includes(`/${e.Kind}/`))!;
 expect(first().y).toBe(-72);
 for(let tick=0;tick<30;tick++)stepGame(g,idle);
 expect(first().y).toBeGreaterThan(-72);expect(first().y).toBeLessThan(e.Y+48);
 for(let tick=0,n=g.Party!.Timer-12;tick<n;tick++)stepGame(g,idle);
 expect(first().y).toBe(e.Y+48);const frame=first().image;
 for(let tick=0;tick<10;tick++)stepGame(g,idle);
 expect(first().image).not.toBe(frame);expect(first().y).toBe(e.Y+48);
 expect(g.Enemies.map(e=>[e.X,e.Y,e.Age])).toEqual(formation);
});

worldTest('party polish benefit descriptions use three letters or fewer',()=>{
 const g=createPartyGame(campaign,42);
 for(const [power,tag] of Object.entries({pink_candy:'RNG',blue_candy:'SPD',yellow_candy:'RAP',shoes:'RUN',clock:'TIM',dynamite:'BOM',orange_parasol:'DEF',red_parasol:'DEF',purple_parasol:'DEF',crystal_ring:'PTS',amethyst_ring:'PTS',ruby_ring:'PTS'})) {
  g.Items=[{...item(300,200),Power:power}];const label=arcadeDrawPlan(g).find(d=>d.y===234)!;
  expect(label.text).toBe(tag);expect(label.text.length).toBeLessThanOrEqual(3);
 }
});

worldTest('party polish HUD explains arrival settling and actual go',()=>{
 const g=createPartyGame(campaign,42);g.Party!.Phase='rest';g.Party!.Timer=300;g.State=2;
 let hud=hudModel(g,initialDesktopSave);expect(hud.banner).toBe('WAVE 2 IN 5S');expect(hud.hint).toBe('REST - COLLECT REWARDS');expect(hud.detail).toBe('MOVE, JUMP AND SHOOT');
 g.Party!.Timer=60;expect(hudModel(g,initialDesktopSave).banner).toBe('WAVE 2 IN 1S');
 g.Party!.Wave++;preparePartyWave(g);hud=hudModel(g,initialDesktopSave);expect(hud.banner).toBe('WAVE 02 - ARRIVING');expect(hud.hint).toBe('MOVE, JUMP AND SHOOT');
 for(let tick=0,n=g.Party!.Timer-6;tick<n;tick++)stepGame(g,idle);
 expect(hudModel(g,initialDesktopSave).banner).toBe('WAVE 02 - GET READY');
 for(let tick=0;tick<6;tick++)stepGame(g,idle);
 expect(hudModel(g,initialDesktopSave).banner).toBe('WAVE 02 - GO!');
 for(let tick=0;tick<120;tick++)stepGame(g,idle);
 expect(hudModel(g,initialDesktopSave).showBanner).toBe(false);
});

worldTest('party polish six real pops coalesce while classic cues retain their original mix',async({cheat,step,input,world})=>{
 await step(3);await cheat(PartyReset,{wave:1,humans:6});await step(2);await cheat(PopBurst,{});
 expect(session.get().game!.Sounds.filter(s=>s==='pop').length).toBe(6);
 expect(world.events(PlaySound).filter(s=>s.sound==='audio/bubble-pop').length).toBe(1);
 input.action('partyFire1',1);await step(1);expect(world.events(PlaySound).map(s=>s.sound)).toEqual(['audio/bubble-shot']);
 input.action('partyFire1',0);await step(1);await cheat(ResetArcade,{ready:false});await cheat(PopBurst,{});
 expect(session.get().game!.Sounds).toEqual(['pop']);expect(world.events(PlaySound).map(s=>s.sound)).toEqual(['reference/audio/pop']);
},{scene});

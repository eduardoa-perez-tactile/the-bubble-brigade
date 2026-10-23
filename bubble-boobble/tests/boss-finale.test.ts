import {worldTest,expect} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame,preparePartyWave} from '../src/arcade/party';
import {captureBoss} from '../src/arcade/boss';
import {stepGame} from '../src/arcade/game';
import {State} from '../src/arcade/types';
import {cartoonHudModel} from '../src/cartoon/hud-model';
import {initialDesktopSave} from '../src/desktop/save';
const idle={Move:0,Jump:false,Fire:false};
function encounter(){const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');g.Party!.Wave=10;preparePartyWave(g);g.Party!.Phase='boss';g.State=State.Playing;g.LevelTicks=300;for(const p of g.Players)Object.assign(p,{Invincible:10000,X:100,Y:484});return g;}
worldTest('boss finale capture gets a readable hold and the finisher celebrates before results',()=>{
 const g=encounter(),b=g.Party!.Boss!;Object.assign(b,{X:500,Y:450});captureBoss(g);
 for(const p of g.Players)Object.assign(p,{X:b.X,Y:b.Y});
 for(let t=0;t<60;t++)stepGame(g,idle);
 expect(b.Mode).toBe('captured');expect(g.State).toBe(State.Playing);
 let ticks=0;while(b.Mode==='captured'&&ticks++<600){for(const p of g.Players)Object.assign(p,{X:b.X,Y:b.Y,VY:0});stepGame(g,idle);}
 expect(b.Mode).toBe('defeated');expect(g.State).toBe(State.Playing);
 const score=g.Score,kills=g.Party!.Kills!.reduce((a,n)=>a+n,0);
 for(let t=0;t<180;t++)stepGame(g,{Move:1,Fire:true,Jump:true});
 expect(g.State).toBe(State.Playing);expect(g.Score).toBe(score);expect(g.Bubbles.length).toBe(0);
 expect(g.Party!.Kills!.reduce((a,n)=>a+n,0)).toBe(kills);
 for(let t=0;t<60;t++)stepGame(g,idle);expect(g.State).toBe(State.Won);
});
worldTest('boss guidance names the canister and teaches the lightning pop sequence',()=>{
 const g=encounter();for(const p of g.Players)p.Power.Thunder=false;
 let hud=cartoonHudModel(g,initialDesktopSave);expect(hud.freeze.includes('CANISTER')).toBe(true);
 for(const p of g.Players)p.Power.Thunder=true;
 hud=cartoonHudModel(g,initialDesktopSave);expect(hud.freeze.includes('JUMP')).toBe(true);expect(hud.freeze.includes('LIGHTNING')).toBe(true);
});

import {finishAnimations} from '@gameengine/ui';
import {renderTest} from '@gameengine/test';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {BossFinaleShowcase} from '../src/cartoon/finale.cheats';
import {session} from '../src/arcade/session';
import {desktopState} from '../src/desktop/state';
renderTest('boss finale canisters lightning capture celebration and results fit every screen',async({cheat,input,step,render,ui})=>{
 input.view(1680,720,1);await step(3);await cheat(ConceptPlaytest,{scenario:'route'});
 let peak=0;
 for(const beat of ['canisters','lightning','captured','victory']){
  await cheat(BossFinaleShowcase,{beat});
  for(const [width,height]of [[1680,720],[768,720],[640,960],[2520,1080]]){
   input.view(width!,height!,1);await step(1);finishAnimations();
   peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
   render.expectScreenshot(`${beat}_${width}x${height}`,{width:width!,height:height!});
  }
 }
 await step(172);
 for(const [width,height]of [[1680,720],[640,960],[2520,1080]]){
  const probe=render.probe({width:width!,height:height!,points:[[1,1],[width!-2,1],[1,height!-2],[width!-2,height!-2]]});
  render.expectScreenshot(`curtain_${width}x${height}`,{width:width!,height:height!});
  for(const point of probe.points)expect(point.rgba.slice(0,3).every(c=>c<30)).toBe(true);
 }
 await step(8);expect(desktopState.get().screen).toBe('result');await step(90);
 for(const [width,height]of [[1680,720],[640,960],[2520,1080]]){
  input.view(width!,height!,1);await step(1);finishAnimations();render.expectScreenshot(`results_${width}x${height}`,{width:width!,height:height!});
 }
 console.log(JSON.stringify({peakDrawCalls:peak,finalState:session.get().game!.State}));expect(peak).toBeLessThanOrEqual(17);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});

import {advanceFeel,emptyFeel,packFeel,unpackFeel} from '../src/arcade/juice';
import {selectArcadeMusic} from '../src/arcade/music-policy';
worldTest('boss finale fanfare fires on the pop once and battle music stops during the ovation',()=>{
 const g=encounter();const b=g.Party!.Boss!;captureBoss(g);
 let feel=advanceFeel(emptyFeel(),g,1);b.Mode='defeated';b.Timer=0;g.Tick++;
 feel=advanceFeel(feel,g,2);expect(feel.cues.filter(c=>c.kind==='victory').length).toBe(1);
 expect(selectArcadeMusic({cartoon:true},g).asset).toBe(null);
 feel=unpackFeel(packFeel(feel));expect(feel.previous!.bossMode).toBe('defeated');
 for(let t=3;t<245;t++){g.Tick++;if(t===243)g.State=State.Won;feel=advanceFeel(feel,g,t);}
 expect(feel.cues.filter(c=>c.kind==='victory').length).toBe(0);
});

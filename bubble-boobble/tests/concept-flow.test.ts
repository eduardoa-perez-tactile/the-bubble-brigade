import { expect, renderTest } from '@gameengine/test';
import { MaterialGlobals, Text2D, VisualOffset, Sprite } from '@gameengine/runtime';
import { cartoonRescueLabels } from '../src/cartoon/labels';
import { DesktopIntent } from '../src/schema.gen';
import { desktopState, desktopGameRequest } from '../src/desktop/state';
import { session } from '../src/arcade/session';
import { arenaLayout } from '../src/arcade/arena-layout';
import { ConceptPlaytest, ConceptHit } from '../src/cartoon/concept.cheats';
import { partyPrepareTicks } from '../src/arcade/party-config';
import { cartoonHudFooterHeight } from '../src/cartoon/hud-layout';
import { cartoonHudModel } from '../src/cartoon/hud-model';
import { initialDesktopSave } from '../src/desktop/save';
import { CartoonOverhaul } from '../src/cartoon/overhaul.cheats';
import { levelWidth, levelHeight } from '../src/arcade/types';

const scene = 'scenes/cartoon.scene.json';
declare const __gameengine_host:(op:string,arg:string)=>string;
const padInput=(events:unknown[])=>__gameengine_host('test.input',JSON.stringify(events));

renderTest('concept checkpoint all menu routes remain functional and fit native wide tall and ultrawide screens', async ({ input, step, render, world }) => {
  input.view(768,720,1); await step(8);
  expect(world.resource(MaterialGlobals).v1[0]).toBe(1);
  expect(desktopState.get().cartoon).toBe(true);
  let peak = 0;
  const shot = (name: string, width = 768, height = 720) => {
    const stats = render.stats({ width, height });
    peak = Math.max(peak, stats.drawCalls);
    expect(stats.drawCalls).toBeGreaterThan(0);
    render.expectScreenshot(name, { width, height });
  };
  shot('title');
  for (const page of ['menu','modes','party','profiles','new-profile','scores','settings','help','credits','editor']) {
    input.emit(DesktopIntent, { action: 'navigate', value: page }); await step(2);
    expect(desktopState.get().screen).toBe(page);
    shot(page);
  }
  for (const page of ['menu','party','editor']) for (const [width,height] of [[1680,720],[640,960],[2520,1080]]) {
    input.emit(DesktopIntent, { action: 'navigate', value: page });
    input.view(width!,height!,1); await step(2);
    shot(`${page}_${width}x${height}`,width!,height!);
  }
  expect(peak).toBeLessThanOrEqual(14);
  console.log(`cartoon complete menu route peak draws ${peak}`);
}, { scene, memory: 'phone-low' });


renderTest('concept checkpoint real player climbs five tiers then captures pops and clears a wave',async({input,step,cheat,render})=>{
 input.view(1680,720,1);await step(8);
 await cheat(ConceptPlaytest,{scenario:'route'});
 expect(session.get().game!.Level.tiles.length).toBe(24);
 expect(session.get().game!.Level.tiles[0]!.length).toBe(60);
 for(let tick=0;Math.abs(session.get().game!.Players[0]!.X-288)>.001&&tick<300;tick++){
  const dx=288-session.get().game!.Players[0]!.X;
  padInput([{type:'gamepadAxis',pad:0,axis:0,value:Math.max(-1,Math.min(1,dx/2.5))}]);await step(1);
 }
 padInput([{type:'gamepadAxis',pad:0,axis:0,value:0}]);await step(1);
 expect(Math.abs(session.get().game!.Players[0]!.X-288)<.001).toBe(true);
 for(const row of [18,13,8,3]){
  padInput([{type:'gamepadButton',pad:0,button:0,down:true}]);await step(1);
  padInput([{type:'gamepadButton',pad:0,button:0,down:false}]);
  for(let tick=0;!session.get().game!.Players[0]!.Ground&&tick<90;tick++)await step(1);
  expect((session.get().game!.Players[0]!.Y+44)/24).toBe(row);
  expect(session.get().game!.Players[0]!.Power.Shoes).toBe(false);
  expect(render.stats({width:1680,height:720}).drawCalls).toBeLessThanOrEqual(14);
  render.expectScreenshot(`landed_tier_${row}`,{width:1680,height:720});
 }
 expect(session.get().game!.Counters.Jumps).toBe(4);
 await cheat(ConceptPlaytest,{scenario:'capture'});
 padInput([{type:'gamepadButton',pad:0,button:2,down:true}]);await step(14);
 padInput([{type:'gamepadButton',pad:0,button:2,down:false}]);await step(1);
 expect(session.get().game!.Bubbles.some(b=>b.EnemyID!==0)).toBe(true);
 render.expectScreenshot('actual_fired_capture',{width:1680,height:720});
 padInput([{type:'gamepadAxis',pad:0,axis:0,value:1}]);await step(40);
 padInput([{type:'gamepadAxis',pad:0,axis:0,value:0}]);await step(1);
 expect(session.get().game!.Counters.Popped).toBeGreaterThan(0);
 expect(session.get().game!.Party!.Phase).toBe('rest');
 const wave=session.get().game!.Party!.Wave;
 await step(Math.max(1,session.get().game!.Party!.Timer-partyPrepareTicks));
 expect(session.get().game!.Party!.Wave).toBe(wave+1);
 expect(session.get().game!.Party!.Phase).toBe('prepare');
 render.expectScreenshot('next_wave',{width:1680,height:720});
},{scene,memory:'phone-low'});

renderTest('concept checkpoint responsive actual rescue empty out roster boss victory and restart remain playable',async({input,step,cheat,render,ui,world})=>{
 input.view(768,720,1);await step(8);
 const assertActualHelp=(width:number,height:number)=>{
  const g=session.get().game!;
  const help=world.entities(Text2D).filter(entity=>{const t=world.get(entity,Text2D);return t.visible&&t.text==='HELP!';});
  expect(help.length).toBe(1);
  expect(world.entities(Text2D).filter(entity=>{const t=world.get(entity,Text2D);return t.visible&&t.text.includes('HELP');}).length).toBe(1);
  const expected=cartoonRescueLabels(g,{width:width!,height:height!,safeArea:[0,0,0,0]})[0]!;
  const position=world.get(help[0]!,VisualOffset).position;
  expect(Math.abs(position[0]!-expected.x)<.01).toBe(true);
  expect(Math.abs(position[1]!-(720-expected.y))<.01).toBe(true);
  const layout=arenaLayout(g.Level,{width:width!,height:height!,safeArea:[0,0,0,0]});
  const plaqueCenter={x:expected.x+17*layout.scale,y:expected.y};
  const cream=world.entities(Sprite).find(entity=>{const sprite=world.get(entity,Sprite);if(!sprite.visible||(sprite.image??'')!=='cartoon/white')return false;const at=world.get(entity,VisualOffset).position;return Math.abs(sprite.size[0]!-60*layout.scale)<.02&&Math.abs(sprite.size[1]!-24*layout.scale)<.02&&Math.abs(at[0]!-plaqueCenter.x)<.02&&Math.abs(720-at[1]!-plaqueCenter.y)<.02;});
  expect(!!cream).toBe(true);
  const creamSprite=world.get(cream!,Sprite),creamAt=world.get(cream!,VisualOffset).position;
  const box={x:creamAt[0]!-creamSprite.size[0]!/2,y:720-creamAt[1]!-creamSprite.size[1]!/2,w:creamSprite.size[0]!,h:creamSprite.size[1]!};
  expect(position[0]!>box.x&&position[0]!<box.x+box.w).toBe(true);
  const text=world.get(help[0]!,Text2D),glyphCenter=720-position[1]!;
  expect(glyphCenter>box.y&&glyphCenter<box.y+box.h).toBe(true);
  expect(glyphCenter-text.size/2>=box.y-.02&&glyphCenter+text.size/2<=box.y+box.h+.02).toBe(true);
  expect(box.y>=48-.02).toBe(true);expect(glyphCenter-text.size/2>=48-.02).toBe(true);
  for(const entity of world.entities(Sprite)){
   const sprite=world.get(entity,Sprite);if(!sprite.visible||!(sprite.image??'').startsWith('cartoon/frames/badge/'))continue;
   const at=world.get(entity,VisualOffset).position,rect={x:at[0]!-sprite.size[0]!/2,y:720-at[1]!-sprite.size[1]!/2,w:sprite.size[0]!,h:sprite.size[1]!};
   expect(rect.y>=48-.02).toBe(true);
   expect(rect.x<box.x+box.w&&rect.x+rect.w>box.x&&rect.y<box.y+box.h&&rect.y+rect.h>box.y).toBe(false);
  }

  return layout;
 };
 await cheat(ConceptPlaytest,{scenario:'hud'});
 let peak=0;
 for(const [width,height]of [[768,720],[1680,720],[640,960],[2520,1080]]){
  input.view(width!,height!,1);await step(1);
  const g=session.get().game!,model=cartoonHudModel(g,initialDesktopSave);
  const roster=[...model.rosterTop!,...model.rosterBottom!];
  expect(roster[1]!.condition).toBe('rescue');
  expect(roster[1]!.status).toBe('RESCUE ME!');
  expect(roster[1]!.down).toBe(true);
  expect(roster[3]!.condition).toBe('out');
  expect(roster[3]!.status).toBe('OUT');
  expect(roster[4]!.condition).toBe('open');
  expect(roster[4]!.status).toBe('OPEN SLOT');
  expect(roster[4]!.key).toBe('dragon-4');
  const stats=render.stats({width:width!,height:height!});peak=Math.max(peak,stats.drawCalls);
  for(const id of ['score-card','round-card','brand','header','footer']){
   const r=ui.rect(`cartoon-hud.${id}`)!;expect(!!r).toBe(true);
   expect(r.x>=0&&r.y>=0&&r.x+r.width<=width!+1&&r.y+r.height<=height!+1).toBe(true);
  }
  const layout=assertActualHelp(width!,height!);
  expect(layout.y>=48).toBe(true);
  const footerHeight=cartoonHudFooterHeight({width:width!,height:height!});
  expect(layout.y+(levelHeight(g.Level)+8)*layout.scale<=720-footerHeight+.001).toBe(true);
  const unit=Math.min(width!/768,height!/720),offsetY=(height!-720*unit)/2;
  const header=ui.rect('cartoon-hud.header')!,footer=ui.rect('cartoon-hud.footer')!;
  expect(Math.abs(header.height-48*unit)<1).toBe(true);
  expect(Math.abs(footer.height-footerHeight*unit)<1).toBe(true);
  expect(offsetY+(layout.y-130*layout.scale)*unit>=header.y+header.height-.01).toBe(true);
  expect(offsetY+(layout.y+(levelHeight(g.Level)+8)*layout.scale)*unit<=footer.y+.01).toBe(true);
  const visibleRows=width!/height!>=1.6?['roster-wide']:['roster-top','roster-bottom'];
  for(const id of visibleRows){const row=ui.rect(`cartoon-hud.${id}`)!;expect(!!row&&row.width>0&&row.height>0).toBe(true);expect(row.y>=footer.y-1&&row.y+row.height<=footer.y+footer.height+1).toBe(true);}

  render.expectScreenshot(`actual_hud_${width}x${height}`,{width:width!,height:height!});
 }
 expect(peak).toBeLessThanOrEqual(14);
 // Jump from the crown using actual input, then injure that exact apex pose.
 await cheat(ConceptPlaytest,{scenario:'route'});await step(2);
 const crownStart=session.get().game!.Players[1]!.Y;
 expect((crownStart+44)/24).toBe(3);
 padInput([{type:'gamepadButton',pad:1,button:0,down:true}]);await step(1);
 padInput([{type:'gamepadButton',pad:1,button:0,down:false}]);
 for(let tick=0;session.get().game!.Players[1]!.Y>crownStart-126&&tick<60;tick++)await step(1);
 expect(session.get().game!.Players[1]!.Y).toBe(crownStart-126);
 await cheat(ConceptHit,{slot:1});
 expect(session.get().game!.Players[1]!.Downed).toBe(true);
 for(const [width,height]of [[768,720],[1680,720],[640,960],[2520,1080]]){
  input.view(width!,height!,1);await step(1);
  expect(render.stats({width:width!,height:height!}).drawCalls).toBeLessThanOrEqual(14);
  assertActualHelp(width!,height!);
  render.expectScreenshot(`crown_apex_help_${width}x${height}`,{width:width!,height:height!});
 }
 await cheat(CartoonOverhaul,{scenario:'rescue'});
 expect(session.get().game!.Players[1]!.Downed).toBe(true);
 padInput([{type:'gamepadAxis',pad:0,axis:0,value:1}]);await step(30);
 padInput([{type:'gamepadAxis',pad:0,axis:0,value:0}]);await step(1);
 expect(session.get().game!.Players[1]!.Downed).toBe(false);
 expect(world.entities(Text2D).filter(entity=>{const t=world.get(entity,Text2D);return t.visible&&t.text==='HELP!';}).length).toBe(0);
 render.expectScreenshot('contact_rescue',{width:2520,height:1080});
 await cheat(CartoonOverhaul,{scenario:'boss'});
 expect(session.get().game!.Party!.Phase).toBe('boss');
 expect(render.stats({width:2520,height:1080}).drawCalls).toBeLessThanOrEqual(14);
 render.expectScreenshot('boss',{width:2520,height:1080});
 await cheat(CartoonOverhaul,{scenario:'victory'});await step(2);
 expect(desktopState.get().screen).toBe('result');
 expect(desktopState.get().won).toBe(true);
 render.expectScreenshot('victory',{width:2520,height:1080});
 await step(90);input.emit(DesktopIntent,{action:'restart'});await step(1);
 expect(session.get().game!.Party!.Wave).toBe(1);
 expect(session.get().game!.Level.arena).toBe('cartoon-courtyard');
 expect(session.get().game!.Paused).toBe(false);
 render.expectScreenshot('restarted',{width:2520,height:1080});
},{scene,memory:'phone-low'});

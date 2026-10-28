import {expect,worldTest,renderTest,type WorldTestContext,type UIRect} from '@gameengine/test';
import {views,finishAnimations} from '@gameengine/ui';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';
import {adventureForProfile} from '../src/overworld/progression';
import {session} from '../src/arcade/session';
import {State} from '../src/arcade/types';
import {storyResultModel} from '../src/adventure/ending.view';
import {storyOutcome} from '../src/adventure/ending';
import {AdventureClearAct} from '../src/adventure/endings.cheats';
import {OverworldResolveEncounter,WarpOverworld} from '../src/overworld/overworld.cheats';
import {OverworldJournalFixture} from '../src/overworld/presentation.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';
function shown(ctx:WorldTestContext,id:string){
 const rect=ctx.ui.rect(id);return !!rect&&rect.width>0&&rect.height>0;
}
async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
async function untilPlaying(ctx:WorldTestContext){
 for(let ticks=0;ticks<300&&(desktopState.get().transitionAction||session.get().game?.State!==State.Playing);ticks++)await adventureStep(ctx,1);
 expect(session.get().game!.State).toBe(State.Playing);
}
async function begin(ctx:WorldTestContext,id='encounter-1'){
 await adventureStep(ctx,8);await ctx.loaded();
 if(id!=='encounter-1')await ctx.cheat(OverworldJournalFixture,{});
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',id));await adventureStep(ctx,3);
 await act(ctx,'overworld-interact',id);await act(ctx,'adventure-play');await ctx.loaded();await untilPlaying(ctx);
}
worldTest('story endings defeat waits for its alert and a fresh released confirmation',async ctx=>{
 await begin(ctx);await ctx.cheat(OverworldResolveEncounter,{won:false});await adventureStep(ctx,2);
 await adventureStep(ctx,48);expect(desktopState.get().resultReady).toBe(false);
 await act(ctx,'restart');expect(desktopState.get().screen).toBe('result');
 ctx.input.key(38,true);await adventureStep(ctx,35);expect(desktopState.get().resultReady).toBe(false);
 ctx.input.key(38,false);await adventureStep(ctx,2);expect(desktopState.get().resultReady).toBe(true);
 expect(desktopState.get().screen).toBe('result');
 ctx.input.key(38,true);await adventureStep(ctx,2);ctx.input.key(38,false);
 expect(desktopState.get().transitionAction).toBe('restart');
},{scene});
worldTest('story endings guarded and ready summary preserve the same actions and hint',async ctx=>{
 await begin(ctx);await ctx.cheat(AdventureClearAct,{});
 for(let tick=0;desktopState.get().screen!=='result'&&tick<360;tick++)await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().resultReady).toBe(false);
 const guarded=storyResultModel(desktopState.get(),desktopSaveState.get());
 expect(guarded.buttons.map(button=>button.key)).toEqual(['leave','restart']);
 expect(guarded.buttons.map(button=>button.label)).toEqual(['RETURN TO MAP','PLAY AGAIN']);
 expect(guarded.buttons.map(button=>button.selected)).toEqual([true,false]);
 expect(guarded.hint).toBe('ENTER / A TO CONFIRM');
 expect(guarded.ready).toBe(false);
 for(let tick=0;!desktopState.get().resultReady&&tick<60;tick++)await adventureStep(ctx,1);
 expect(desktopState.get().resultReady).toBe(true);
 const ready=storyResultModel(desktopState.get(),desktopSaveState.get());
 expect(ready.buttons).toEqual(guarded.buttons);expect(ready.hint).toBe(guarded.hint);
 expect(ready.ready).toBe(true);
},{scene});
worldTest('story endings victory announces once before functional reward actions',async ctx=>{
 await begin(ctx);await ctx.cheat(AdventureClearAct,{});
 expect(storyOutcome(desktopState.get(),session.get().game,0)).toBe('victory');
 await adventureStep(ctx,72);expect(storyOutcome(desktopState.get(),session.get().game,0)).toBe(null);
 await adventureStep(ctx,278);expect(desktopState.get().won).toBe(true);
 const results=storyResultModel(desktopState.get(),desktopSaveState.get());
 expect(results.title).toBe('');expect(results.rewardLabel).toBe('FIRST-CLEAR REWARD');
 expect(results.buttons.map(button=>button.label)).toEqual(['RETURN TO MAP','PLAY AGAIN']);
},{scene});
renderTest('story endings victory bonus alert and results remain safe across supported screens',async ctx=>{
 ctx.input.view(1280,720,1);await begin(ctx);await ctx.cheat(AdventureClearAct,{});
 expect(session.get().game!.State).toBe(State.Clearing);expect(session.get().game!.Countdown).toBe(300);
 const before=session.get().game!.Players[0]!.X,scoreBefore=session.get().game!.Score;
 ctx.input.key('ArrowRight',true);await adventureStep(ctx,12);ctx.input.key('ArrowRight',false);
 expect(session.get().game!.Players[0]!.X).toBeGreaterThan(before);
 expect(session.get().game!.Score).toBeGreaterThan(scoreBefore);
 ctx.render.stats({width:1280,height:720});
 expect(!!ctx.ui.rect('story-outcome')).toBe(true);
 expect(ctx.ui.rect('story-results')).toBe(null);expect(shown(ctx,'cartoon-hud.banner')).toBe(false);
 console.log('story victory alert draw calls',ctx.render.stats({width:1280,height:720}).drawCalls);
 ctx.render.expectScreenshot('victory-alert',{width:1280,height:720});
 await adventureStep(ctx,60);ctx.render.stats({width:1280,height:720});
 expect(!!ctx.ui.rect('story-outcome')).toBe(false);expect(desktopState.get().screen).toBe('play');
 expect(shown(ctx,'cartoon-hud.banner')).toBe(false);
 await adventureStep(ctx,228);expect(desktopState.get().screen).toBe('result');
 await adventureStep(ctx,50);
 for(const [width,height,safe] of [[344,882,[0,32,0,0]],[393,852,[0,59,0,34]],[810,1080,[0,20,0,0]],[1280,720,[0,0,0,0]],[2520,1080,[72,0,0,0]]] as const){
  ctx.input.view(width,height,1,[...safe]);await adventureStep(ctx,2);ctx.render.stats({width,height});
  expect(shown(ctx,'story-results.outcome-title')).toBe(false);
  const buttons=ctx.ui.interactables().filter(b=>b.enabled&&b.hittable&&b.label&&['RETURN TO MAP','PLAY AGAIN'].includes(b.label));
  expect(buttons.length).toBe(2);
  for(const b of buttons){expect(b.rect.height).toBeGreaterThanOrEqual(44);expect(b.rect.x).toBeGreaterThanOrEqual(safe[0]);expect(b.rect.y).toBeGreaterThanOrEqual(safe[1]);expect(b.rect.x+b.rect.width).toBeLessThanOrEqual(width-safe[2]);expect(b.rect.y+b.rect.height).toBeLessThanOrEqual(height-safe[3]);}
  console.log('story results draw calls',width,ctx.render.stats({width,height}).drawCalls);
  ctx.render.expectDrawCalls('<=',50,{width,height});
  ctx.render.expectScreenshot(`victory-results-${width}`,{width,height});
 }
 const progress=adventureForProfile(desktopSaveState.get().profiles[desktopSaveState.get().active]!);
 expect(progress.cleared['encounter-1']!.clears).toBe(1);
 expect(storyResultModel(desktopState.get(),desktopSaveState.get()).rewardLabel).toBe('FIRST-CLEAR REWARD');
 const coins=progress.coins;
 const back=ctx.ui.interactables().find(b=>b.label==='RETURN TO MAP')!;
 await ctx.ui.press(back.id!);await adventureStep(ctx,100);await ctx.loaded();expect(desktopState.get().screen).toBe('overworld');
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await adventureStep(ctx,3);
 await act(ctx,'overworld-interact','encounter-1');await act(ctx,'adventure-play');await ctx.loaded();await untilPlaying(ctx);
 await ctx.cheat(AdventureClearAct,{});await adventureStep(ctx,350);
 expect(adventureForProfile(desktopSaveState.get().profiles[desktopSaveState.get().active]!).coins).toBe(coins);
 expect(storyResultModel(desktopState.get(),desktopSaveState.get()).rewardValue).toBe('REWARD CLAIMED');
 expect(storyResultModel(desktopState.get(),desktopSaveState.get()).title).toBe('');
 ctx.render.expectScreenshot('replay-results',{width:1280,height:720});
},{scene,memory:'phone-low'});
renderTest('story endings one stable summary keeps guarded actions visible until fresh input is safe',async ctx=>{
 ctx.input.view(1280,720,1);await begin(ctx);
 // A shot held through the victory must never become confirmation on the summary.
 ctx.input.key('Space',true);await ctx.cheat(AdventureClearAct,{});
 for(let tick=0;desktopState.get().screen!=='result'&&tick<360;tick++)await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().resultReady).toBe(false);
 const summaryViews=()=>views.stack().filter(view=>view.view==='StoryResults');
 expect(summaryViews().length).toBe(1);const handle=summaryViews()[0]!.id;
 const initialModel=storyResultModel(desktopState.get(),desktopSaveState.get());
 const labels=['RETURN TO MAP','PLAY AGAIN'];
 let peak=0;
 const saved=new Map<number,{panel:UIRect;buttons:{id:string;label:string;rect:UIRect;node?:number}[]}>();
 const screens=[{width:344,height:882,safe:[0,32,0,0]},{width:810,height:1080,safe:[0,20,0,0]},{width:1280,height:720,safe:[0,0,0,0]}];
 const actionButtons=()=>ctx.ui.interactables().filter(button=>labels.includes(button.label));
 for(const {width,height,safe}of screens){
  ctx.input.view(width,height,1,safe as [number,number,number,number]);await adventureStep(ctx,1);
  finishAnimations();peak=Math.max(peak,ctx.render.stats({width,height}).drawCalls);
  expect(desktopState.get().resultReady).toBe(false);
  const panel=ctx.ui.rect('story-results.summary-panel');expect(!!panel).toBe(true);
  const nativeButtons=actionButtons();
  // Native pointer-events:none omits these buttons from interactables, while their
  // retained widget IDs and layout boxes still establish that both actions exist.
  const buttons=initialModel.buttons.map(button=>{
   const id=`story-results.${button.key}`,rect=ctx.ui.rect(id);expect(!!rect).toBe(true);
   const native=nativeButtons.find(item=>item.id===id);
   if(native)expect(native.enabled&&native.hittable).toBe(false);
   return {id,label:button.label,rect:rect!,node:native?.node};
  });
  expect(buttons.length).toBe(2);
  console.log(JSON.stringify({summaryGuardWidth:width,panel,visibleButtonIds:buttons.map(button=>button.id),nativeButtons:nativeButtons.map(({id,node,enabled,hittable})=>({id,node,enabled,hittable}))}));
  expect(nativeButtons.some(button=>button.enabled&&button.hittable)).toBe(false);
  for(const button of buttons){
   expect(button.rect.width>0&&button.rect.height>0).toBe(true);
   expect(button.rect.height).toBeGreaterThanOrEqual(44);
   expect(button.rect.x).toBeGreaterThanOrEqual(safe[0]!);expect(button.rect.y).toBeGreaterThanOrEqual(safe[1]!);
   expect(button.rect.x+button.rect.width).toBeLessThanOrEqual(width-safe[2]!);
   expect(button.rect.y+button.rect.height).toBeLessThanOrEqual(height-safe[3]!);
  }
  saved.set(width,{panel:panel!,buttons});
  expect(summaryViews()).toEqual([{id:handle,view:'StoryResults'}]);
  expect(views.leaving().includes('StoryResults')).toBe(false);
  ctx.render.expectScreenshot(`stable-summary-guarded-${width}`,{width,height});
 }
 // Hit testing and the separate intent guard both reject an early activation.
 // A blocked native press may be rejected or ignored; neither can leave the summary.
 try{await ctx.ui.press('story-results.leave');}catch{/* Rejection is an allowed blocked-input outcome. */}
 expect(desktopState.get().screen).toBe('result');expect(!!desktopState.get().transitionAction).toBe(false);
 const early=saved.get(1280)!.buttons[0]!.rect,cx=early.x+early.width/2,cy=early.y+early.height/2;
 ctx.input.pointer('down',cx,cy);await adventureStep(ctx,1);
 ctx.input.pointer('up',cx,cy);await adventureStep(ctx,1);
 await act(ctx,'ui-activate','leave');
 ctx.input.key('Enter',true);await adventureStep(ctx,2);ctx.input.key('Enter',false);await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('result');expect(!!desktopState.get().transitionAction).toBe(false);
 await adventureStep(ctx,45);
 expect(desktopState.get().resultReady).toBe(false);expect(summaryViews()[0]!.id).toBe(handle);
 ctx.input.key('Space',false);await adventureStep(ctx,2);
 expect(desktopState.get().resultReady).toBe(true);expect(desktopState.get().screen).toBe('result');
 const readyModel=storyResultModel(desktopState.get(),desktopSaveState.get());
 expect(readyModel.buttons).toEqual(initialModel.buttons);expect(readyModel.hint).toBe(initialModel.hint);
 for(const {width,height,safe}of screens){
  ctx.input.view(width,height,1,safe as [number,number,number,number]);await adventureStep(ctx,1);
  finishAnimations();peak=Math.max(peak,ctx.render.stats({width,height}).drawCalls);
  const before=saved.get(width)!,buttons=actionButtons();expect(buttons.length).toBe(2);
  expect(ctx.ui.rect('story-results.summary-panel')).toEqual(before.panel);
  for(const button of buttons){
   const guarded=before.buttons.find(previous=>previous.label===button.label)!;
   expect(button.id).toBe(guarded.id);
   if(guarded.node!==undefined)expect(button.node).toBe(guarded.node);
   expect(button.rect).toEqual(guarded.rect);
   expect(button.enabled).toBe(true);expect(button.hittable).toBe(true);
  }
  expect(summaryViews()).toEqual([{id:handle,view:'StoryResults'}]);
  expect(views.leaving().includes('StoryResults')).toBe(false);
  console.log(JSON.stringify({summaryReadyWidth:width,buttons:buttons.map(({id,node,enabled,hittable})=>({id,node,enabled,hittable}))}));
  ctx.render.expectDrawCalls('<=',50,{width,height});
  ctx.render.expectScreenshot(`stable-summary-ready-${width}`,{width,height});
 }
 console.log(JSON.stringify({stableSummaryViewHandle:handle,peakDrawCalls:peak,viewCount:summaryViews().length}));
 const back=actionButtons().find(button=>button.label==='RETURN TO MAP')!;
 await ctx.ui.press(back.id!);await adventureStep(ctx,2);
 expect(desktopState.get().transitionAction).toBe('leave');
},{scene,memory:'phone-low'});
renderTest('story endings multi act finale and defeat show only the final outcome',async ctx=>{
 ctx.input.view(1280,720,1);await begin(ctx,'encounter-5');await ctx.cheat(AdventureClearAct,{});
 expect(session.get().game!.EpisodeWave).toBe(1);expect(session.get().game!.State).toBe(State.Ready);
 ctx.render.stats({width:1280,height:720});expect(!!ctx.ui.rect('story-outcome')).toBe(false);
 for(let ticks=0;session.get().game!.State===State.Ready&&ticks<180;ticks++)await adventureStep(ctx,1);
 expect(session.get().game!.State).toBe(State.Playing);
 await ctx.cheat(AdventureClearAct,{});await adventureStep(ctx,6);
 expect(session.get().game!.State).toBe(State.Clearing);ctx.render.stats({width:1280,height:720});
 expect(!!ctx.ui.rect('story-outcome')).toBe(true);
 await act(ctx,'effects');expect(desktopSaveState.get().settings.reducedEffects).toBe(true);
 await ctx.cheat(OverworldResolveEncounter,{won:false});await adventureStep(ctx,6);
 ctx.render.stats({width:1280,height:720});expect(!!ctx.ui.rect('story-outcome')).toBe(true);
 ctx.render.expectScreenshot('defeat-alert',{width:1280,height:720});
 await adventureStep(ctx,70);ctx.render.stats({width:1280,height:720});expect(desktopState.get().resultReady).toBe(true);
 expect(shown(ctx,'story-results.outcome-title')).toBe(true);
 ctx.render.expectScreenshot('defeat-results',{width:1280,height:720});
},{scene,memory:'phone-low'});

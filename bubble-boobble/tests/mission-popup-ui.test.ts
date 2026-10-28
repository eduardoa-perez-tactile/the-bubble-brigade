import {expect,renderTest,type WorldTestContext} from '@gameengine/test';
import {finishAnimations,views,reducedMotion} from '@gameengine/ui';
import {Time,loading} from '@gameengine/runtime';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {session} from '../src/arcade/session';
import {State} from '../src/arcade/types';
import {cartoonFlowTiming} from '../src/cartoon/flow-timing';
import {adventureStep} from './support/adventure-time';

async function act(ctx:WorldTestContext,action:string){
 ctx.input.emit(DesktopIntent,{action});await adventureStep(ctx,2);
}
async function openCard(ctx:WorldTestContext){
 ctx.input.action('confirm',1);await adventureStep(ctx,2);
 ctx.input.action('confirm',0);await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('overworld-card');
 expect(loading.active()).toBe(false);
 await adventureStep(ctx,16);finishAnimations();
 expect(ctx.render.stats({width:1280,height:720}).drawCalls).toBeLessThanOrEqual(50);
 await ctx.render.waitForAssets({timeoutMs:30000});
 const stats=ctx.render.stats({width:1280,height:720});
 expect(stats.drawCalls).toBeLessThanOrEqual(50);
 console.log(JSON.stringify({missionPopupDrawCalls:stats.drawCalls}));
}
function button(ctx:WorldTestContext,label:string){
 const found=ctx.ui.interactables().find(item=>item.label===label&&item.enabled&&item.hittable);
 if(!found?.id)throw new Error(`Missing active mission action: ${label}: ${JSON.stringify(ctx.ui.interactables())}`);
 return found;
}

renderTest('mission popup actual buttons animate dismissal and leave no card or loading bar over gameplay',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await adventureStep(ctx,3);
 await openCard(ctx);
 const playId=button(ctx,'PLAY ENCOUNTER').id!;
 const back=button(ctx,'BACK TO MAP');
 await ctx.ui.press(back.id!);await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('overworld');
 // A real document exit retains the drawing briefly, while input is already inert.
 expect(views.leaving().includes('OverworldEncounter')).toBe(true);
 expect(ctx.ui.interactables().some(item=>item.id===playId&&item.enabled&&item.hittable)).toBe(false);
 await adventureStep(ctx,16);
 ctx.render.stats({width:1280,height:720});
 expect(ctx.ui.rect(playId)).toBe(null);
 expect(views.leaving().includes('OverworldEncounter')).toBe(false);

 // Reduced motion must settle the same card and dismissal without stranding it.
 await act(ctx,'effects');
 await openCard(ctx);expect(desktopSaveState.get().settings.reducedEffects).toBe(true);expect(reducedMotion()).toBe(true);
 await ctx.ui.press(button(ctx,'BACK TO MAP').id!);await adventureStep(ctx,16);
 expect(desktopState.get().screen).toBe('overworld');
 expect(views.leaving().includes('OverworldEncounter')).toBe(false);
 expect(ctx.ui.rect(playId)).toBe(null);
 await act(ctx,'effects');

 await openCard(ctx);await ctx.ui.press(button(ctx,'PLAY ENCOUNTER').id!);await adventureStep(ctx,1);
 expect(desktopState.get().transitionAction).toBe('adventure-play');
 const origin=desktopState.get().transitionStartedStep!;
 const timing=cartoonFlowTiming(true,'adventure-play');
 await adventureStep(ctx,Math.max(0,timing.closeAt-(ctx.world.resource(Time).step-origin)));
 ctx.render.stats({width:1280,height:720});
 expect(ctx.ui.rect('loading-bar')).toBe(null);
 expect(ctx.ui.rect('loading-label')).toBe(null);
 await ctx.loaded();await adventureStep(ctx,timing.finishAt+5);finishAnimations();
 for(let ticks=0;session.get().game?.State!==State.Playing&&ticks<500;ticks++)await adventureStep(ctx,1);
 const playing=ctx.render.stats({width:1280,height:720});
 expect(playing.drawCalls).toBeLessThanOrEqual(50);
 console.log(JSON.stringify({missionPlayingDrawCalls:playing.drawCalls}));
 expect(desktopState.get().screen).toBe('play');
 expect(desktopState.get().transitionAction??'').toBe('');
 if(session.get().game!.State!==State.Playing)throw new Error(`Mission did not finish its arrival: ${JSON.stringify({state:session.get().game!.State,countdown:session.get().game!.Countdown,paused:session.get().game!.Paused,transition:desktopState.get().transitionAction,enemies:session.get().game!.Enemies.map(enemy=>({state:enemy.State}))})}`);
 expect(ctx.ui.rect(playId)).toBe(null);
 expect(ctx.ui.interactables().some(item=>item.id===playId||item.label==='PLAY ENCOUNTER')).toBe(false);
 expect(ctx.ui.rect('loading')).toBe(null);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});

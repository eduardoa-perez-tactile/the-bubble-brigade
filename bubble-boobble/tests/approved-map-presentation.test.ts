import {expect,renderTest,type WorldTestContext} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';
import {overworldState} from '../src/overworld/state';
import {OverworldMapPreview,OverworldJournalFixture} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {getOverworldMap,sourceToWorld} from '../src/overworld/maps';
import {overworldDrawPlan} from '../src/overworld/presentation';
import {adventureForProfile} from '../src/overworld/progression';
import {moveOverworld,isOverworldWalkable} from '../src/overworld/navigation';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';
async function settle(ctx:WorldTestContext,width:number,height:number){
 await ctx.loaded();await adventureStep(ctx,3);ctx.render.stats({width,height});
 await ctx.render.waitForAssets({timeoutMs:30000});await adventureStep(ctx,2);return ctx.render.stats({width,height});
}
renderTest('approved mission crests icon shops and directional footfall drawings stay readable without map residents',async ctx=>{
 await ctx.loaded();await adventureStep(ctx,6);let peak=0;
 for(let district=1;district<=5;district++){
  ctx.input.view(1280,720,1);await ctx.cheat(OverworldMapPreview,{district,facing:1});
  const stats=await settle(ctx,1280,720);peak=Math.max(peak,stats.drawCalls);
  const draws=overworldDrawPlan(overworldState.get(),adventureForProfile(desktopSaveState.get().profiles[0]!));
  expect(draws.some(d=>d.text||d.image?.includes('/npc/')||d.image?.includes('resident-shadow'))).toBe(false);
  expect(draws.filter(d=>d.image==='overworld-living/common/markers/shop').length).toBe(1);
  expect(draws.filter(d=>d.image?.includes('/markers/')&& !d.image.endsWith('/shop')).length).toBe(5);
  if(district===1)ctx.render.expectScreenshot('ready-harbor',{width:1280,height:720});
 }
 await ctx.cheat(OverworldMapPreview,{district:1,facing:1});ctx.input.view(360,880,1);await settle(ctx,360,880);
 ctx.render.expectScreenshot('ready-harbor-slim',{width:360,height:880});
 for(const [name,x,y]of [['left',-1,0],['up',0,1],['down-right',1,-1]] as const){
  ctx.input.view(1280,720,1);await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await settle(ctx,1280,720);
  let start:{x:number;y:number}|undefined;
  for(const [nx,ny]of [[700,1070],[690,1090],[650,1100],[550,1080],[450,590],[1050,490]]){
   const candidate=sourceToWorld(getOverworldMap('district-1'),{x:nx!*1536/1254,y:ny!*1536/1254});if(!isOverworldWalkable(candidate.x,candidate.y,'district-1'))continue;
   let p=candidate,count=0;for(let step=0;step<16;step++){const next=moveOverworld(p,x,y,1/60,'district-1');if(next.x!==p.x||next.y!==p.y)count++;p=next;}if(count===16){start=candidate;break;}
  }
  if(!start)throw new Error('No safe authored walk for '+name);
  await ctx.cheat(WarpOverworld,start);await adventureStep(ctx,2);
  for(let frame=0;frame<16;frame++){ctx.input.action('mapX',x);ctx.input.action('mapY',y);await adventureStep(ctx,1);}
  if(overworldState.get().footsteps.length!==1)throw new Error('Missing foot contact '+JSON.stringify({name,state:overworldState.get()}));expect(overworldState.get().footsteps[0]!.age).toBe(0);
  ctx.input.action('mapX',0);ctx.input.action('mapY',0);await adventureStep(ctx,1);
  peak=Math.max(peak,ctx.render.stats({width:1280,height:720}).drawCalls);
  ctx.render.expectScreenshot(`foot-contact-${name}`,{width:1280,height:720});
  if(name==='left'){
   await adventureStep(ctx,5);ctx.render.expectScreenshot('foot-puff-expanded-left',{width:1280,height:720});
   await adventureStep(ctx,5);ctx.render.expectScreenshot('foot-puff-curls-left',{width:1280,height:720});
  }
  await adventureStep(ctx,24);expect(overworldState.get().footsteps).toEqual([]);
 }
 await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.cheat(OverworldJournalFixture);await settle(ctx,1280,720);
 ctx.render.expectScreenshot('completed-harbor',{width:1280,height:720});
 ctx.input.view(360,880,1);ctx.input.emit(DesktopIntent,{action:'overworld-journal'});await settle(ctx,360,880);
 expect(desktopState.get().overworldPanel).toBe('journal');
 const buttons=ctx.ui.interactables().filter(b=>b.enabled&&b.hittable);
 expect(buttons.some(b=>b.label.includes('CLAIM THREE-CLEAR'))).toBe(true);
 for(const button of buttons){const r=button.rect;if(!(r.x>=-1&&r.y>=-1&&r.x+r.width<=361&&r.y+r.height<=881))throw new Error('Journal control outside phone: '+JSON.stringify(button));}
 ctx.render.expectScreenshot('journal-reward-slim',{width:360,height:880});
 console.log(`Approved map preview peak ${peak}/14 draws`);expect(peak).toBeLessThanOrEqual(14);
},{scene,memory:'phone-low'});

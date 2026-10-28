import {adventureStep} from './support/adventure-time';
import {expect,renderTest,type WorldTestContext} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {overworldState} from '../src/overworld/state';
import {overworldDrawPlan} from '../src/overworld/presentation';
import {desktopSaveState} from '../src/desktop/save';
import {adventureForProfile} from '../src/overworld/progression';
import {getOverworldMap,sourceToWorld} from '../src/overworld/maps';
import {overworldEntrancePoint,isOverworldWalkable} from '../src/overworld/navigation';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {OverworldJournalFixture} from '../src/overworld/presentation.cheats';

const scene='scenes/cartoon.scene.json';
const sizes=[
 {width:360,height:880,safe:[0,34,0,24]},
 {width:768,height:1024,safe:[0,24,0,20]},
 {width:1280,height:720,safe:[0,0,0,0]},
 {width:2520,height:1080,safe:[72,0,0,0]},
] as const;
async function intent(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
async function enter(ctx:WorldTestContext){
 await adventureStep(ctx,8);await ctx.loaded();await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();await adventureStep(ctx,4);
}
function assertButtons(ctx:WorldTestContext,width:number,height:number,safe:readonly number[],minimum:number){
 const buttons=ctx.ui.interactables().filter(b=>b.enabled&&b.hittable);
 if(buttons.length<minimum)throw new Error('Too few active controls: '+JSON.stringify({width,height,minimum,screen:desktopState.get().screen,panel:desktopState.get().overworldPanel,buttons:ctx.ui.interactables()}));
 for(const button of buttons){
  const r=button.rect;
  const context=JSON.stringify({width,height,safe,label:button.label,id:button.id,rect:r});
  if(r.x<safe[0]!-1||r.y<safe[1]!-1||r.x+r.width>width-safe[2]!+1||r.y+r.height>height-safe[3]!+1)throw new Error('Button escapes safe area: '+context);
  if(r.width<44||r.height<44)throw new Error('Button smaller than44px: '+context);
 }
 return buttons;
}
async function inspect(ctx:WorldTestContext,id:string){
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',id));await adventureStep(ctx,3);
 await intent(ctx,'overworld-interact',id);await ctx.loaded();await adventureStep(ctx,12);
}

function assertAvatar(ctx:WorldTestContext,width:number,height:number,safe:readonly number[]){
 const s=overworldState.get();
  const save=desktopSaveState.get(),profile=save.profiles[save.active]!,draws=overworldDrawPlan(s,adventureForProfile(profile),profile.avatar);
  const actor=draws.find(d=>d.image?.includes(`/dragon-oblique/${profile.avatar}/`)&&d.x===s.x)!;
  expect(!!actor).toBe(true);
  // The actual normalized frame has a shared [64,120] foot anchor, content top12.
  const head=ctx.input.worldToScreen([actor.x,actor.y+actor.height*(.5-12/128)]),feet=ctx.input.worldToScreen([actor.x,actor.y+actor.height*(.5-120/128)]);
  const left=ctx.input.worldToScreen([actor.x-actor.width*54/128,actor.y]),right=ctx.input.worldToScreen([actor.x+actor.width*54/128,actor.y]);
  if(head[1]!<safe[1]!||feet[1]!>height-safe[3]!||left[0]!<safe[0]!||right[0]!>width-safe[2]!)throw new Error('Avatar clips viewport: '+JSON.stringify({width,height,safe,head,feet,left,right}));
  if(feet[1]!-head[1]!<40)throw new Error('Avatar smaller than40px: '+JSON.stringify({width,height,head,feet}));
}

renderTest('overworld source HUD locked card and guide keep safe touch targets across narrow tablet desktop and ultrawide',async ctx=>{
 await enter(ctx);
 for(const {width,height,safe}of sizes){
  // Let native WorldViewFollow settle after changing the viewport aspect.
  ctx.input.view(width,height,1,[...safe]);await adventureStep(ctx,20);
  ctx.render.stats({width,height});
  const s=overworldState.get(),point=ctx.input.worldToScreen([s.x,s.y+36]);
  expect(point[0]>=safe[0]&&point[0]<=width-safe[2]).toBe(true);
  expect(point[1]>=safe[1]&&point[1]<=height-safe[3]).toBe(true);
  assertAvatar(ctx,width,height,safe);
  const hud=assertButtons(ctx,width,height,safe,1),menu=hud.find(b=>b.label.includes('MENU'))!;
  if(menu.rect.y>safe[1]+48||width-safe[2]-(menu.rect.x+menu.rect.width)>48)throw new Error('HUD menu left top-right corner: '+JSON.stringify({width,height,safe,rect:menu.rect}));
  const coin=ctx.ui.rect('overworld-hud.coins');expect(!!coin).toBe(true);
  if(coin&&(coin.x<safe[0]||coin.y<safe[1]||coin.x>safe[0]+48||coin.y>safe[1]+48))throw new Error('Coins left top-left corner: '+JSON.stringify({width,height,safe,coin}));
  if(width===360)ctx.render.expectScreenshot('slim-source-hud',{width,height});
  if(width===360){
   const start=overworldState.get();
   for(const source of [{x:727.579,y:1253.053},{x:551.196,y:1265.071},{x:420,y:1190}]){
    const target=sourceToWorld(getOverworldMap('district-1'),source);
    // Camera traversal follows paving; the old last waypoint clipped the exact foot boundary.
    expect(isOverworldWalkable(target.x,target.y,'district-1')).toBe(true);let arrived=false;
    for(let frame=0;frame<180;frame++){
     const state=overworldState.get(),dx=target.x-state.x,dy=target.y-state.y,length=Math.hypot(dx,dy);
     if(length<3){arrived=true;break;}
     ctx.input.action('mapX',dx/length);ctx.input.action('mapY',dy/length);await adventureStep(ctx,1);
     assertAvatar(ctx,width,height,safe);
    }
    if(!arrived)throw new Error('Camera traversal waypoint unreachable: '+JSON.stringify({source,target,at:{x:overworldState.get().x,y:overworldState.get().y}}));
   }
   expect(start.x-overworldState.get().x>100).toBe(true);
  }

  await inspect(ctx,'encounter-3');expect(desktopState.get().screen).toBe('overworld-card');
  ctx.render.stats({width,height});const locked=assertButtons(ctx,width,height,safe,1);
  expect(locked.some(b=>b.label==='PLAY ENCOUNTER')).toBe(false);
  if(width===360)ctx.render.expectScreenshot('slim-locked-card',{width,height});
  await intent(ctx,'overworld-back');
  await intent(ctx,'overworld-journal');expect(desktopState.get().overworldPanel).toBe('journal');
  ctx.render.stats({width,height});assertButtons(ctx,width,height,safe,2);
  if(width===360)ctx.render.expectScreenshot('slim-guide',{width,height});
  await intent(ctx,'overworld-back');
 }
},{scene,memory:'phone-low'});

renderTest('overworld full six-action journal and shop remain readable reachable and bounded on supported extremes',async ctx=>{
 await enter(ctx);await ctx.cheat(OverworldJournalFixture);await adventureStep(ctx,3);
 for(const {width,height,safe}of sizes){
  ctx.input.view(width,height,1,[...safe]);await adventureStep(ctx,3);
  await intent(ctx,'overworld-journal');expect(desktopState.get().overworldPanel).toBe('journal');
  ctx.render.stats({width,height});const rows=assertButtons(ctx,width,height,safe,6);
  expect(rows.filter(b=>b.id?.includes('overworld-travel')).length).toBe(4);
  if(width===360)ctx.render.expectScreenshot('slim-full-journal',{width,height});
  if(width===2520)ctx.render.expectScreenshot('ultrawide-full-journal',{width,height});
  await intent(ctx,'overworld-back');
  await inspect(ctx,'vendor');expect(desktopState.get().overworldPanel).toBe('vendor');
  ctx.render.stats({width,height});assertButtons(ctx,width,height,safe,3);
  if(width===360||width===2520)ctx.render.expectScreenshot(`${width===360?'slim':'ultrawide'}-supply-cart`,{width,height});
  await intent(ctx,'overworld-back');
 }
},{scene,memory:'phone-low'});

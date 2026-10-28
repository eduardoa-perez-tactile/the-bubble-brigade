import { ActionState, KeyEvent, LoadingResumed, LocalTransform, ViewInfo, WorldView, WorldViewFollow, NO_ENTITY, defineSystem, query, read, write } from '@gameengine/runtime';
import { DesktopIntent, OverworldAvatar } from '../schema.gen.ts';
import { partyPads } from '../arcade/party-input.ts';
import { focusedOverworldPoi, moveOverworld } from './navigation.ts';
import { overworldState, type OverworldFacing } from './state.ts';
import {advanceMarkerMotion,resumeMarkerCelebration} from './marker-animation';
import {advanceOverworldFootsteps} from './footsteps';
import { getOverworldMap, mapBounds } from './maps.ts';

/** Recorded keyboard actions and controller state drive the authoritative walkable avatar. */
export const OverworldSystem=defineSystem({
  name:'OverworldSystem',after:['DesktopSystem'],query:query(read(ActionState)),events:[DesktopIntent,KeyEvent,LoadingResumed],
  run(ctx,q){
    const s=overworldState.get();if(!s.active)return;
    let markerContext=s.markerMotion;
    for(const event of ctx.events.read(LoadingResumed))markerContext=resumeMarkerCelebration(markerContext,event.name,s.districtId);
    let x=0,y=0,confirm=false,pressed=false,pause=false,confirmKeys=s.confirmKeys;
    for(const c of q.chunks())for(let i=0;i<c.length;i++){
      const a=c.col(ActionState);
      if(c.is(ActionState,i,'name','mapX'))x=a.value[i]!;
      if(c.is(ActionState,i,'name','mapY'))y=a.value[i]!;
      if(c.is(ActionState,i,'name','confirm')){confirm ||= !!a.pressed[i];pressed ||= !!a.justPressed[i];}
      if(c.is(ActionState,i,'name','pause')||c.is(ActionState,i,'name','back'))pause ||= !!a.justPressed[i];
    }
    for(const event of ctx.input){
      if(event.type!=='gamepadButton'||event.pad!==0)continue;
      // Canonical south/A is button0, the same mapping used by party-input. Keep
      // its edge even when down and up are both recorded before the next step.
      if(event.button===0){if(event.down&&!(confirmKeys&4))pressed=true;confirmKeys=event.down?confirmKeys|4:confirmKeys&~4;}
      if(event.down&&(event.button===6||event.button===1))pause=true;
    }
    // DesktopSystem reduces raw recorded controller events once per step; read its sim latch.
    const pad=partyPads.get().pads[0];
    if(pad){
      const px=pad.left||pad.right?Number(pad.right)-Number(pad.left):Math.abs(pad.axis)>=0.25?pad.axis:0;
      const py=pad.up||pad.down?Number(pad.up)-Number(pad.down):Math.abs(pad.axisY)>=0.25?-pad.axisY:0;
      if(!x)x=px;if(!y)y=py;confirm ||= pad.jump;
    }
    // Preserve short down/up taps which can end with ActionState already released.
    for(const event of ctx.events.read(KeyEvent)){
      const bit=event.code===38?1:event.code===37?2:0;if(!bit)continue;
      if(event.down&&!(confirmKeys&bit))pressed=true;
      confirmKeys=event.down?confirmKeys|bit:confirmKeys&~bit;
    }
    confirm ||= confirmKeys!==0;
    const neutral=!confirm&&!pressed&&!x&&!y;
    if(s.modal){
      if(markerContext!==s.markerMotion||s.moving||s.inputArmed||s.confirmHeld!==confirm||s.confirmKeys!==confirmKeys)overworldState.set({...s,moving:false,inputArmed:false,confirmHeld:confirm,confirmKeys,markerMotion:markerContext});
      return;
    }
    const armed=s.inputArmed||neutral;
    if(pause&&armed){
      overworldState.set({...s,modal:true,moving:false,inputArmed:false,confirmHeld:confirm,confirmKeys,markerMotion:markerContext});
      ctx.events.emit(DesktopIntent,{action:'overworld-menu',value:'',index:0,x:0,y:0});return;
    }
    const point=moveOverworld(s,x,y,ctx.dt,s.districtId),moving=point.x!==s.x||point.y!==s.y;
    const facing:OverworldFacing=moving?(Math.abs(x)>=.25&&Math.abs(y)>=.25?`${y>0?'up':'down'}-${x<0?'left':'right'}`:Math.abs(x)>Math.abs(y)?x<0?'left':'right':y>0?'up':'down'):s.facing;
    const focusedPoi=focusedOverworldPoi(s.districtId,point.x,point.y);
    const shortcutLatched=focusedPoi==='shortcut';
    if(shortcutLatched&&!s.shortcutLatched)ctx.events.emit(DesktopIntent,{action:'overworld-shortcut',value:'shortcut',index:0,x:0,y:0});
    const interact=armed&&s.inputArmed&&focusedPoi&&(pressed||confirm&&!s.confirmHeld);
    const walkTick=moving?s.walkTick+1:s.walkTick;
    const footsteps=advanceOverworldFootsteps(s.footsteps??[],s,point,walkTick,facing,!!interact);
    const markerMotion=advanceMarkerMotion(markerContext,focusedPoi,!!interact);
    // Walk poses require displacement; marker clips use their own bounded clock.
    if(markerMotion!==s.markerMotion||s.footsteps?.length||footsteps.length||moving||s.moving!==moving||s.focusedPoi!==focusedPoi||s.inputArmed!==armed||s.confirmHeld!==confirm||s.confirmKeys!==confirmKeys||s.shortcutLatched!==shortcutLatched||interact)
      overworldState.set({...s,...point,facing,moving,focusedPoi,tick:moving?s.tick+1:s.tick,walkTick,footsteps,markerMotion,inputArmed:interact?false:armed,confirmHeld:confirm,confirmKeys,shortcutLatched,modal:!!interact});
    if(interact)ctx.events.emit(DesktopIntent,{action:'overworld-interact',value:focusedPoi,index:0,x:0,y:0});
  },
});

/** A sim entity supplies position to the built-in WorldViewFollow; no custom camera integration. */
export const OverworldTargetSystem=defineSystem({
  name:'OverworldTargetSystem',after:['OverworldSystem'],query:query(read(OverworldAvatar),write(LocalTransform)),
  resources:[read(ViewInfo),write(WorldView),write(WorldViewFollow)],
  run(ctx,q){
    const s=overworldState.get();
    const map=getOverworldMap(s.districtId),bounds=mapBounds(map),orthoSize=map.viewSize;
    const viewport=ctx.get(ViewInfo),aspect=Math.max(.2,viewport.width/Math.max(1,viewport.height));
    // A close portrait view has much less horizontal room than the design frame.
    // Keep follow slack proportional to the visible ground so a walking dragon cannot clip.
    const deadZoneX=Math.min(60,orthoSize*Math.min(16/9,aspect)*.18);
    if(!s.active){
      // Only release our own target, so unrelated camera users remain intact.
      for(const c of q.chunks())for(let i=0;i<c.length;i++)if(ctx.get(WorldViewFollow).target===c.entity(i)){
        ctx.set(WorldViewFollow,{target:NO_ENTITY,primed:false});
        ctx.set(WorldView,{center:[384,360],orthoSize:360,designAspect:768/720,fit:'Contain'});
      }
      return;
    }
    if(!q.count){
      ctx.set(WorldView,{center:[s.x,s.y],orthoSize,designAspect:16/9,fit:'Cover'});
      ctx.commands.spawn({OverworldAvatar:{},LocalTransform:{position:[s.x,s.y,0],rotation:[0,0,0,1],scale:[1,1,1]}});return;
    }
    for(const c of q.chunks())for(let i=0;i<c.length;i++){
      const transform=c.col(LocalTransform).position;
      if(transform[i*3]!==s.x||transform[i*3+1]!==s.y)c.set(LocalTransform,i,{position:[s.x,s.y,0]});
      const target=c.entity(i);
      if(!s.cameraReady||ctx.get(WorldViewFollow).target!==target||Math.abs(ctx.get(WorldViewFollow).deadZone[0]!-deadZoneX)>.01){
        ctx.set(WorldView,{center:[s.x,s.y],orthoSize,designAspect:16/9,fit:'Cover'});
        ctx.set(WorldViewFollow,{target,offset:[0,30],damping:0.16,deadZone:[deadZoneX,35],lookahead:0.08,bounded:true,boundsMin:[bounds.minX,bounds.minY],boundsMax:[bounds.maxX,bounds.maxY],primed:false});
        overworldState.set({...overworldState.get(),cameraReady:true});
      }
      return;
    }
  },
});

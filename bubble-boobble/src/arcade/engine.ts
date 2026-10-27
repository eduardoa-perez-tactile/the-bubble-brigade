import { encounterById, availableEncounter } from '../overworld/content';
import { adventureForProfile, adventurePowerShop } from '../overworld/progression';
import { cartoonFlowStartsRun } from '../cartoon/flow-timing';
import { partyRanking } from './party-config';
import { partyPads, reducePartyPadInput, readPartyAction, applyPartyAction } from './party-input';
import { createPartyGame } from './party';
import {createAdventureLevel} from '../adventure/episodes';
import { createCartoonArena } from '../cartoon/arena';
import { respawn } from './player';
import { resetPartyPads } from './party-input';
import { enableCompanion } from './companion';
import { ActionState, WorldView, defineSystem, query, read, write } from '@gameengine/runtime';
import { ArcadeControl, ArcadeInput } from '../schema.gen.ts';
import campaign from '../../data/levels.json';
import { session } from './session.ts';
import { copyGame, createGame, stepGame } from './game.ts';
import type { Input, Level } from './types.ts';
import { desktopGameRequest, desktopSaveState, desktopState, finishDesktopRun, showDesktopPause, setDesktopRunScore } from '../desktop/index.ts';
export const ArcadeStep=defineSystem({
  name:'ArcadeStep',after:['DesktopSystem'],query:query(read(ActionState)),
  resources:[write(ArcadeControl),write(WorldView)],events:[ArcadeInput],
  run(ctx,q){
    if(!ctx.get(ArcadeControl).active)return;
    const control=ctx.get(ArcadeControl), request=desktopGameRequest.get();
    let current=session.get();
    let handledPauseRequest=false;
    if(request.sequence!==control.requestSequence){
      ctx.setField(ArcadeControl,'requestSequence',request.sequence);
      if(request.action==='adventure'){
        const encounter=encounterById(request.encounterId??''),owner=desktopSaveState.get().profiles[request.profileIndex??-1];
        const progress=owner?adventureForProfile(owner):null;
        if(encounter&&progress&&availableEncounter(encounter.id,progress)&&progress.pending&&progress.pending.id===request.attemptId&&progress.pending.encounterId===encounter.id){
          const level=createAdventureLevel(encounter.level);
          if(encounter.trial)level.enemies=level.enemies.slice(0,3);
          const game=createGame([level],1,1);
          // The receipt captures this loadout; granting a starting flag is not an item pickup.
          const startingPower=adventurePowerShop.find(item=>item.id===progress.pending!.startingPower);
          if(startingPower)game.Players[0]!.Power[startingPower.power]=true;
          if(encounter.trial)game.Players[0]!.Lives=1;current={active:true,mode:'adventure-encounter',game};session.set(current);
        }
      }else if(request.action==='start'||request.action==='party'||request.action==='playtest'){
        const custom=request.action==='playtest'&&request.customLevel;
        const levels=request.cartoon?(campaign as Level[]).map(createCartoonArena):(campaign as Level[]);
        const game=request.action==='party'?createPartyGame(campaign as Level[],1,request.partySlots,10,request.cartoon?'cartoon':'original'):createGame(custom?[custom]:levels,1,request.players);
        if(!game.Party&&request.mode==='ai')enableCompanion(game);
        game.Custom=!!custom;current={active:true,mode:request.action==='party'?'party':custom?'custom':'campaign',game};session.set(current);
      } else if(request.action==='party-controls'&&current.game?.Party){
        const game=copyGame(current.game),slots=request.partySlots!.slice(0,game.Players.length);
        for(let i=0;i<game.Players.length;i++){
          const previous=game.Party!.Slots[i];
          if(slots[i]==='empty'){game.Players[i]!.Lives=0;game.Players[i]!.Downed=false;}
          else if(previous==='empty'){game.Players[i]!.Lives=1;respawn(game,i);}
          game.Companions![i]=null;
          if(slots[i]==='ai')enableCompanion(game,i);
        }
        game.Party!.Slots=slots.slice();game.Paused=false;
        if(game.Companion)game.Companion=game.Companions![1]??undefined;
        resetPartyPads();current={...current,game};session.set(current);
      } else if(request.action==='quit'||request.action==='exit'){current={...current,active:false};session.set(current);}
      else if(current.game&&(request.action==='pause'||request.action==='resume')){
        handledPauseRequest=true;
        const game=copyGame(current.game);game.Paused=request.action==='pause';current={...current,game};session.set(current);
      }
    }
    if(control.skip){ctx.setField(ArcadeControl,'skip',false);return;}
    if(!current.active||!current.game)return;
    // A new arena remains frozen under the cover and Classic's Ready lead-in.
    // The original preparation countdown starts only once the scene is fully introduced.
    const arrival=desktopState.get();
    if(arrival.cartoon&&arrival.transitionAction&&cartoonFlowStartsRun(arrival.transitionAction))return;
    const inputs:Input[]=reducePartyPadInput(partyPads.get().pads,[]).inputs.slice(0,current.game.Players.length);
    let pause=false;
    for(const c of q.chunks())for(let i=0;i<c.length;i++){
      const a=c.col(ActionState);
      if(current.game.Party){
        const action=readPartyAction(c.get(ActionState,i).name,a.value[i]!,a.pressed[i]!==0,a.justPressed[i]!==0);
        if(action)applyPartyAction(inputs,action);
        if(c.is(ActionState,i,'name','pause'))pause=!!a.justPressed[i];
        continue;
      }
      if(c.is(ActionState,i,'name','move')&&a.value[i]!==0)inputs[0]!.Move=a.value[i]!;
      if(c.is(ActionState,i,'name','jump'))inputs[0]!.Jump ||= a.pressed[i]!==0;
      if(c.is(ActionState,i,'name','fire'))inputs[0]!.Fire ||= a.pressed[i]!==0;
      if(c.is(ActionState,i,'name','pause'))pause=!!a.justPressed[i];
      if(c.is(ActionState,i,'name','move2')&&inputs[1]&&a.value[i]!==0)inputs[1].Move=a.value[i]!;
      if(c.is(ActionState,i,'name','jump2')&&inputs[1])inputs[1].Jump ||= a.pressed[i]!==0;
      if(c.is(ActionState,i,'name','fire2')&&inputs[1])inputs[1].Fire ||= a.pressed[i]!==0;
    }
    if(!pause && ctx.events.count(ArcadeInput)===0 && current.game.Sounds.length===0 && (current.game.Paused||current.game.State===3||current.game.State===4))return;
    const game=copyGame(current.game);
    if(pause&&!handledPauseRequest&&desktopState.get().screen==='play'&&!desktopState.get().transitionAction){game.Paused=!game.Paused;showDesktopPause(game.Paused);}
    for(const e of ctx.events.read(ArcadeInput)){
      if(inputs[e.player])inputs[e.player]={Move:e.move,Jump:e.jump,Fire:e.fire};
      if(!desktopState.get().cartoon||!desktopState.get().transitionAction)game.Paused=e.paused;
    }
    // A menu/Retry press must be released before it can become a gameplay action.
    // This document latch is driven only by recorded inputs; preparation still allows fresh practice fire.
    const uiState=desktopState.get();
    if(uiState.cartoon&&(uiState.pauseClosing||uiState.screen==='pause'||uiState.screen==='settings'&&uiState.settingsReturn==='pause'||uiState.partyEditing))game.Paused=true;
    if(uiState.cartoon&&uiState.gameplayInputArmed===false){
      if(inputs.every(i=>!i.Fire&&!i.Jump))desktopState.set({...uiState,gameplayInputArmed:true});
      else for(const input of inputs){input.Fire=false;input.Jump=false;}
    }
    const screen=desktopState.get().screen;
    if((screen==='play'||screen==='pause')&&game.Paused!==(screen==='pause'))showDesktopPause(game.Paused);
    const oldState=game.State;
    stepGame(game,inputs);
    session.set({...current,game});
    setDesktopRunScore(game.Score,game.Party?.Wave??game.Level.number);
    if(game.State!==oldState&&(game.State===3||game.State===4))finishDesktopRun(game.State===4,game.Score,game.Party?.Wave??game.Level.number,partyRanking(game));
  },
});

import {expect,type WorldTestContext} from '@gameengine/test';
import {State} from '../../src/arcade/types';
import {session} from '../../src/arcade/session';
import {DesktopIntent} from '../../src/schema.gen';
import {desktopState} from '../../src/desktop/state';
import {OverworldMapPreview} from '../../src/overworld/presentation.cheats';
import {WarpOverworld} from '../../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../../src/overworld/navigation';
import {adventureStep} from './adventure-time';

/** Enter an actual episode through its recorded map/card flow; no gameplay-state injection. */
export async function enterForegroundPilot(ctx:WorldTestContext,number:number):Promise<void>{
 const district=Math.floor((number-1)/5)+1,id=`encounter-${number}`;
 await ctx.cheat(OverworldMapPreview,{district,facing:1});await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint(`district-${district}`,id));await adventureStep(ctx,5);
 ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:id});await adventureStep(ctx,3);await ctx.loaded();
 ctx.input.emit(DesktopIntent,{action:'adventure-play'});await ctx.loaded();
 for(let i=0;desktopState.get().transitionAction&&i<240;i++)await adventureStep(ctx,1);
 for(let i=0;session.get().game!.State===State.Ready&&i<240;i++)await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('play');
 expect(session.get().game!.State).toBe(State.Playing);
 expect(session.get().game!.Level.number).toBe(number);
}

export async function leaveForegroundPilot(ctx:WorldTestContext):Promise<void>{
 ctx.input.emit(DesktopIntent,{action:'leave'});await adventureStep(ctx,15);await ctx.loaded();
}

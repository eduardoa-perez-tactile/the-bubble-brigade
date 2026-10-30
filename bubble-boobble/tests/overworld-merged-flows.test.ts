import {adventureStep,adventureResult} from './support/adventure-time';
import {expect,worldTest,type WorldTestContext} from '@gameengine/test';
import {Keys} from '@gameengine/runtime';
import {ArcadeAudio,DesktopIntent} from '../src/schema.gen';
import {desktopState,RESULT_INPUT_DELAY} from '../src/desktop/state';
import {STORY_OUTCOME_STEPS} from '../src/adventure/ending';
import {desktopSaveState} from '../src/desktop/save';
import {session} from '../src/arcade/session';
import {overworldState} from '../src/overworld/state';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {adventureForProfile} from '../src/overworld/progression';
import {OverworldResolveEncounter,WarpOverworld} from '../src/overworld/overworld.cheats';

declare const __gameengine_host:(op:string,arg:string)=>string;
const scene='scenes/cartoon.scene.json';
async function intent(ctx:WorldTestContext,action:string){ctx.input.emit(DesktopIntent,{action});await adventureStep(ctx,1);}
function music(ctx:WorldTestContext,track:string,asset:string|null){
 expect(ctx.world.resource(ArcadeAudio).track).toBe(track);
 expect(ctx.audio.status().music).toBe(asset);
}
async function enterEncounter(ctx:WorldTestContext){
 await adventureStep(ctx,8);await ctx.loaded();
 music(ctx,'brigade-menu','audio/brigade/menu');
 await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();await adventureStep(ctx,3);
 expect(desktopState.get().screen).toBe('overworld');music(ctx,'brigade-menu','audio/brigade/menu');
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-2'));await adventureStep(ctx,2);
 // Physical Enter inspects the landmark, then activates its real selected Play button.
 ctx.input.key(Keys.Enter,true);await adventureStep(ctx,2);ctx.input.key(Keys.Enter,false);await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('overworld-card');
 ctx.input.key(Keys.Enter,true);await adventureStep(ctx,2);ctx.input.key(Keys.Enter,false);await adventureStep(ctx,280);await ctx.loaded();
 expect(desktopState.get().screen).toBe('play');expect(desktopState.get().adventureEncounter).toBe('encounter-2');
 expect(session.get().game!.Level.number).toBe(2);music(ctx,'brigade-gameplay','audio/brigade/gameplay');
}
async function back(ctx:WorldTestContext,controller:boolean,down:boolean){
 if(controller)__gameengine_host('test.input',JSON.stringify([{type:'gamepadButton',pad:0,button:1,down}]));
 else ctx.input.key(Keys.Escape,down); // Recorded Escape, through ActionState/back.
 await adventureStep(ctx,1);
}
for(const won of [true,false])worldTest(`adventure merged music ${won?'victory controller B':'defeat Escape'} guards result and returns to selected entrance`,async ctx=>{
 await enterEncounter(ctx);
 const attempt=desktopState.get().adventureAttempt;
 await ctx.cheat(OverworldResolveEncounter,{won});await adventureResult(ctx);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().won).toBe(won);
 expect(desktopState.get().resultReady).toBe(false);music(ctx,'brigade-silent',null);
 // An early Back must not skip result input protection or turn into a delayed exit.
 await back(ctx,won,true);await back(ctx,won,false);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().transitionAction??'').toBe(won?'story-results':'');
 await adventureStep(ctx,(won?RESULT_INPUT_DELAY:STORY_OUTCOME_STEPS)+3);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().resultReady).toBe(true);
 expect(desktopState.get().adventureAttempt).toBe(attempt);music(ctx,'brigade-silent',null);
 await back(ctx,won,true);await back(ctx,won,false);await adventureStep(ctx,100);await ctx.loaded();await adventureStep(ctx,3);
 expect(desktopState.get().screen).toBe('overworld');expect(session.get().active).toBe(false);
 expect(overworldState.get().focusedPoi).toBe('encounter-2');
 const entrance=overworldEntrancePoint('district-1','encounter-2');
 expect(overworldState.get().x).toBe(entrance.x);expect(overworldState.get().y).toBe(entrance.y);
 music(ctx,'brigade-menu','audio/brigade/menu');
 const profile=desktopSaveState.get().profiles[0]!,progress=adventureForProfile(profile);
 expect(profile.played).toBe(0);expect(progress.pending).toBe(null);
 expect(progress.coins).toBe(won?10:0);
 expect(progress.cleared['encounter-2']?.clears??0).toBe(won?1:0);
},{scene});

import {expect,worldTest,type WorldTestContext} from '@gameengine/test';
import {initialMarkerMotion,advanceMarkerMotion,queueMarkerCelebration,resumeMarkerCelebration,sampleMarkerImage} from '../src/overworld/marker-animation';
import {OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld,OverworldResolveEncounter} from '../src/overworld/overworld.cheats';
import {overworldState} from '../src/overworld/state';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {desktopState,RESULT_INPUT_DELAY} from '../src/desktop/state';
import {STORY_OUTCOME_STEPS} from '../src/adventure/ending';
import {DesktopIntent} from '../src/schema.gen';
import {adventureStep,adventureResult} from './support/adventure-time';
const scene='scenes/cartoon.scene.json',prefix='overworld-living/common/markers/';
async function intent(ctx:WorldTestContext,action:string,value=''){ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,1);}
worldTest('marker animation samples authored frames with staggered short ready shop bursts and safe defaults',async()=>{
 for(const state of ['available','locked','cleared','shop'] as const){
  expect(sampleMarkerImage(state,'encounter-1',undefined,0)).toBe(prefix+state);
  expect(sampleMarkerImage(state,'encounter-1',{...initialMarkerMotion(),clock:12,celebrationId:'encounter-1',celebrationAge:12},0,true)).toBe(prefix+state);
 }
 for(const state of ['available','shop'] as const){
  let animated=0;
  for(let clock=0;clock<240;clock++){
   const motion={...initialMarkerMotion(),clock},image=sampleMarkerImage(state,'unfocused',motion,0);
   if(image.includes('/animated/'))animated++;
   expect(image===sampleMarkerImage(state,'unfocused',{...motion,clock:clock+240},0)).toBe(true);
  }
  expect(animated).toBe(26);
  const motion={...initialMarkerMotion(),clock:12};
  expect(sampleMarkerImage(state,'unfocused',motion,0)).toBe(prefix+`animated/${state}-1`);
  expect(sampleMarkerImage(state,'unfocused',motion,1)).toBe(prefix+state);
 }
 for(const state of ['locked','cleared'] as const)for(let clock=0;clock<480;clock++)expect(sampleMarkerImage(state,'unfocused',{...initialMarkerMotion(),clock},0)).toBe(prefix+state);
},{scene});
worldTest('marker animation approaches once without held focus retriggers and restarts only after leaving',async()=>{
 for(const [state,id]of [['available','encounter-1'],['locked','encounter-2'],['shop','vendor']] as const){
  let motion=advanceMarkerMotion(undefined,id);expect(motion.focusAge).toBe(0);
  for(let age=0;age<80;age++){
   const image=sampleMarkerImage(state,id,motion,0),frame=age<6?0:age<14?1:age<22?2:age<32?3:0;
   expect(image).toBe(prefix+(frame?`animated/${state}-${frame}`:state));
   motion=advanceMarkerMotion(motion,id);
  }
  expect(motion.focusAge).toBe(32);
  motion=advanceMarkerMotion(advanceMarkerMotion(motion,''),id);expect(motion.focusAge).toBe(0);
  expect(advanceMarkerMotion(motion,id,true)).toEqual(motion);
 }
 expect(advanceMarkerMotion(undefined,'collectible').focusId).toBe('');
},{scene});
worldTest('marker animation completed crests celebrate one queued win then retain all three static stars',async()=>{
 const initial=initialMarkerMotion();
 expect(queueMarkerCelebration(initial,'encounter-1',false)).toEqual(initial);
 expect(queueMarkerCelebration(initial,'trial-1',true)).toEqual(initial);
 let motion=queueMarkerCelebration(initial,'encounter-1',true);
 for(let covered=0;covered<120;covered++)motion=advanceMarkerMotion(motion,'encounter-1');
 expect(motion.celebrationAge).toBe(0);expect(sampleMarkerImage('cleared','encounter-1',motion,0)).toBe(prefix+'cleared');
 expect(resumeMarkerCelebration(motion,'adventure-lighthouse','district-1')).toEqual(motion);
 motion=resumeMarkerCelebration(motion,'overworld-district-1','district-1')!;
 for(let reveal=0;reveal<15;reveal++){expect(sampleMarkerImage('cleared','encounter-1',motion,0)).toBe(prefix+'cleared');motion=advanceMarkerMotion(motion,'encounter-1');}
 expect(motion.celebrationAge).toBe(0);
 for(let age=0;age<80;age++){
  const image=sampleMarkerImage('cleared','encounter-1',motion,0);
  expect(image.includes('/animated/')).toBe(age>=6&&age<32);
  expect(sampleMarkerImage('cleared','encounter-2',motion,0)).toBe(prefix+'cleared');
  motion=advanceMarkerMotion(motion,'encounter-1');
 }
 expect(motion.celebrationId).toBe('');expect(sampleMarkerImage('cleared','encounter-1',motion,0)).toBe(prefix+'cleared');
},{scene});
worldTest('marker animation map clock focus and burst ages freeze during real modal pause',async ctx=>{
 const step=(n:number)=>adventureStep(ctx,n);await step(8);await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();await step(3);
 const first=overworldState.get().markerMotion!.clock;await step(5);expect(overworldState.get().markerMotion!.clock).toBe((first+5)%240);
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-2'));await step(7);
 expect(overworldState.get().markerMotion!.focusId).toBe('encounter-2');
 await intent(ctx,'overworld-menu');const frozen=overworldState.get().markerMotion;await step(50);expect(overworldState.get().markerMotion).toEqual(frozen);
 await intent(ctx,'overworld-back');expect(overworldState.get().markerMotion!.clock).toBe((frozen!.clock+1)%240);
 await ctx.cheat(OverworldMapPreview,{district:2,facing:1});
 expect(overworldState.get().markerMotion!.clock<5).toBe(true);expect(overworldState.get().markerMotion!.celebrationId).toBe('');
},{scene});
for(const won of [true,false])worldTest(`marker animation real ${won?'won':'lost'} encounter return ${won?'queues exactly one celebration':'never celebrates'}`,async ctx=>{
 const step=(n:number)=>adventureStep(ctx,n);await step(8);await ctx.loaded();await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();await step(3);
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-2'));await step(3);await intent(ctx,'overworld-interact','encounter-2');await intent(ctx,'adventure-play');await step(280);await ctx.loaded();
 expect(desktopState.get().screen).toBe('play');await ctx.cheat(OverworldResolveEncounter,{won});await adventureResult(ctx);expect(desktopState.get().screen).toBe('result');
 await step((won?RESULT_INPUT_DELAY:STORY_OUTCOME_STEPS)+3);await intent(ctx,'leave');await ctx.loaded();
 expect(desktopState.get().screen).toBe('overworld');expect(overworldState.get().markerMotion!.celebrationId).toBe(won?'encounter-2':'');
 if(won){expect(overworldState.get().markerMotion!.celebrationPending).toBe(false);await step(8);expect(sampleMarkerImage('cleared','encounter-2',overworldState.get().markerMotion,0).includes('/animated/')).toBe(true);}
 await step(40);expect(overworldState.get().markerMotion!.celebrationId).toBe('');await step(240);expect(overworldState.get().markerMotion!.celebrationId).toBe('');
},{scene});

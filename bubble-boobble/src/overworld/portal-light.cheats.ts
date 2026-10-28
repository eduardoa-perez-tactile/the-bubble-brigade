import {defineDoc} from '@gameengine/runtime';
import {defineCheat} from '@gameengine/runtime/cheats';
import {desktopSaveState} from '../desktop/save';
import {districtById,districts} from './content';
import {adventureForProfile} from './progression';
import {initialMarkerMotion} from './marker-animation';
import {overworldState} from './state';

// Debug-only, recorded fixture state. No game module imports this file, and
// release builds strip it. Existing player profiles are never reset or altered.
const fixture=defineDoc('portal-light-qa',{profileIndex:-1});
export const PortalLightFixture=defineCheat({
 id:'overworld.portal-light-fixture',group:'Adventure QA',title:'Capture portal warm light',
 description:'Isolated headless QA only: creates a separate QA profile, sets local completion and exact visible animation phase. Never resets an existing player profile.',
 params:{ready:{type:'bool',default:true},phase:{type:'int',min:0,max:239,default:0},reduced:{type:'bool',default:false}},
 current:()=>{
  const map=overworldState.get(),save=desktopSaveState.get(),profile=save.profiles[save.active],district=districtById(map.districtId);
  return {ready:!!profile&&!!district&&district.encounterIds.every(id=>!!adventureForProfile(profile).cleared[id]),phase:map.markerMotion?.clock??0,reduced:!!save.settings.reducedEffects};
 },
 run(ctx,{ready,phase,reduced}){
  if(!desktopSaveState.loaded())throw new Error('Wait for the profile save to load before portal-light QA');
  const map=overworldState.get(),district=districtById(map.districtId);
  if(!map.active||!district)throw new Error('Enter the desired map with overworld.map-preview first');
  let profileIndex=fixture.get().profileIndex;
  if(profileIndex<0){
   const save=desktopSaveState.get();
   if(save.profiles.length>=8)throw new Error('Portal-light QA needs a free profile slot; use a fresh isolated headless session');
   let suffix=1;while(save.profiles.some(p=>p.name===`PORTAL QA${suffix}`))suffix++;
   const created=desktopSaveState.dispatch('create',`PORTAL QA${suffix}`,ctx.time);
   if(!created.ok)throw new Error(`Cannot create portal-light QA profile: ${created.reason}`);
   profileIndex=desktopSaveState.get().active;fixture.set({profileIndex});
  }
  desktopSaveState.dispatch('select',profileIndex,ctx.time);
  desktopSaveState.dispatch('adventureReset',{profileIndex},ctx.time);
  // Prior districts establish a valid progress fixture without bypassing save
  // invariants. Repeated captures only reset this session's new QA profile.
  for(const d of districts.filter(d=>d.index<district.index||ready&&d.index===district.index))for(const id of d.encounterIds){
   const begun=desktopSaveState.dispatch('adventureBeginAttempt',{profileIndex,encounterId:id},ctx.time);
   const pending=adventureForProfile(desktopSaveState.get().profiles[profileIndex]!).pending;
   if(!begun.ok||!pending)throw new Error(`Cannot prepare portal-light QA encounter ${id}`);
   const complete=desktopSaveState.dispatch('adventureComplete',{profileIndex,encounterId:id,attemptId:pending.id,score:100},ctx.time);
   if(!complete.ok)throw new Error(`Cannot complete portal-light QA encounter ${id}: ${complete.reason}`);
  }
  if(!!desktopSaveState.get().settings.reducedEffects!==reduced)desktopSaveState.dispatch('setting',{action:'effects',delta:0},ctx.time);
  // The ordinary OverworldSystem advances one step after this PreUpdate cheat.
  // Capture tooling verifies the reported current phase before taking a shot.
  overworldState.set({...map,modal:false,moving:false,inputArmed:false,confirmHeld:false,confirmKeys:0,
   markerMotion:{...initialMarkerMotion(),clock:(phase+239)%240}});
 },
});

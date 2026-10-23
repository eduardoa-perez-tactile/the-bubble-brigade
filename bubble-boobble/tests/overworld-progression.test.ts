import { expect, worldTest } from '@gameengine/test';
import { desktopSave, initialDesktopSave } from '../src/desktop/save.ts';
import {getOverworldMap,mapBounds} from '../src/overworld/maps';
import { districts, encounters, availableDistrict, availableEncounter, trials, trialForDistrict } from '../src/overworld/content.ts';
import { initialAdventure, completeAdventure, beginAdventureAttempt, abandonAdventureAttempt, adventureForProfile, setAdventureAnchor, discoverAdventureShortcut, claimAdventureGuideReward, purchaseAdventureItem, claimAdventureCollectible, adventureCleared, validAdventure, type AdventureProgress } from '../src/overworld/progression.ts';
const scene='scenes/arcade.scene.json';
function clear(progress:AdventureProgress,encounterId:string,score=100):AdventureProgress {
 const begun=beginAdventureAttempt(progress,encounterId);
 if(!begun.pending)throw new Error(`encounter unavailable: ${encounterId}`);
 return completeAdventure(begun,{encounterId,attemptId:begun.pending.id,score});
}
worldTest('adventure campaign branches and all five district gates are reachable',async()=>{
 let progress=initialAdventure();
 expect(encounters.map(value=>value.level)).toEqual(Array.from({length:25},(_,i)=>i+1));
 for(const district of districts){
  expect(availableDistrict(district.id,progress)).toBe(true);
  const [first,second,third,fourth,fifth]=district.encounterIds as [string,string,string,string,string];
  expect(availableEncounter(first,progress)).toBe(true);
  expect(availableEncounter(second,progress)).toBe(true);
  expect(availableEncounter(third,progress)).toBe(false);
  progress=clear(progress,second);
  expect(availableEncounter(third,progress)).toBe(true);
  expect(availableEncounter(fourth,progress)).toBe(false);
  progress=clear(progress,third);
  expect(availableEncounter(fourth,progress)).toBe(true);
  expect(availableEncounter(fifth,progress)).toBe(true);
  for(const id of [fourth,fifth])progress=clear(progress,id);
  const next=districts[district.index+1];
  if(next)expect(availableDistrict(next.id,progress)).toBe(false);
  progress=clear(progress,first);
  if(next)expect(availableDistrict(next.id,progress)).toBe(true);
 }
 expect(Object.keys(progress.cleared).length).toBe(25);
 expect(progress.coins).toBe(250);
 expect(validAdventure(progress)).toBe(true);
},{scene});
worldTest('adventure receipts survive reload and protect rewards and records',async()=>{
 let save=desktopSave.load({v:1,state:{...initialDesktopSave,profiles:initialDesktopSave.profiles.map(p=>({...p,high_score:999,played:3,won:1,lost:2,xp:125}))}});
 expect(save.profiles[0]!.adventure).toBe(undefined);
 const begin=desktopSave.apply(save,'adventureBeginAttempt',{profileIndex:0,encounterId:'encounter-1'});
 expect(begin.ok).toBe(true);if(!begin.ok)return;save=begin.state;
 const attemptId=adventureForProfile(save.profiles[0]!).pending!.id;
 const complete=desktopSave.apply(save,'adventureComplete',{profileIndex:0,encounterId:'encounter-1',attemptId,score:200});
 expect(complete.ok).toBe(true);if(!complete.ok)return;
 save=desktopSave.load(JSON.parse(JSON.stringify(desktopSave.store(complete.state))));
 const duplicate=desktopSave.apply(save,'adventureComplete',{profileIndex:0,encounterId:'encounter-1',attemptId,score:900});
 expect(duplicate.ok).toBe(true);if(!duplicate.ok)return;
 expect(duplicate.state).toEqual(save);
 expect(save.profiles[0]!.high_score).toBe(999);expect(save.profiles[0]!.played).toBe(3);
 let progress=adventureForProfile(save.profiles[0]!);
 expect(progress.coins).toBe(10);expect(progress.cleared['encounter-1']!.clears).toBe(1);
 progress=clear(progress,'encounter-1',300);
 expect(progress.coins).toBe(10);expect(progress.cleared['encounter-1']).toEqual({bestScore:300,clears:2});
 expect(progress.nextAttempt).toBe(3);
 expect(completeAdventure(progress,{encounterId:'encounter-2',attemptId:'forged',score:100})).toEqual(progress);
},{scene});
worldTest('adventure profile isolation safe anchors abandoned attempts and optional rewards',async()=>{
 const created=desktopSave.apply(initialDesktopSave,'create','OTHER');expect(created.ok).toBe(true);if(!created.ok)return;
 const begun=desktopSave.apply(created.state,'adventureBeginAttempt',{profileIndex:0,encounterId:'encounter-1'});expect(begun.ok).toBe(true);if(!begun.ok)return;
 expect(begun.state.profiles[1]!.adventure).toBe(undefined);
 const reset=desktopSave.apply(begun.state,'adventureReset',{profileIndex:0});expect(reset.ok).toBe(true);if(!reset.ok)return;
 expect(adventureForProfile(reset.state.profiles[0]!).pending).toBe(null);
 expect(adventureForProfile(reset.state.profiles[0]!).nextAttempt).toBe(2);
 let progress=adventureForProfile(begun.state.profiles[0]!);
 const abandonedId=progress.pending!.id;progress=abandonAdventureAttempt(progress);
 expect(progress.cleared).toEqual({});expect(progress.coins).toBe(0);
 expect(completeAdventure(progress,{encounterId:'encounter-1',attemptId:abandonedId,score:100})).toEqual(progress);
 expect(setAdventureAnchor(progress,{districtId:'district-2',x:0,y:0})).toEqual(progress);
 expect(setAdventureAnchor(progress,{districtId:'district-1',x:Infinity,y:0})).toEqual(progress);
 expect(setAdventureAnchor(progress,{districtId:'district-1',x:mapBounds(getOverworldMap('district-1')).maxX+1,y:0})).toEqual(progress);
 progress=setAdventureAnchor(progress,{districtId:'district-1',x:30,y:-100});
 expect(progress.anchor).toEqual({districtId:'district-1',x:30,y:-100});
 progress=discoverAdventureShortcut(progress,'district-1:shortcut');
 expect(progress.discoveredShortcuts['district-1:shortcut']).toBe(true);
 expect(claimAdventureGuideReward(progress)).toEqual(progress);
 expect(purchaseAdventureItem(progress,'brigade-ribbon')).toEqual(progress);
 for(const id of ['encounter-1','encounter-2','encounter-3'])progress=clear(progress,id);
 progress=claimAdventureGuideReward(progress);expect(progress.coins).toBe(45);
 expect(claimAdventureGuideReward(progress)).toEqual(progress);
 progress=purchaseAdventureItem(progress,'brigade-ribbon');expect(progress.coins).toBe(25);
 expect(progress.purchases['brigade-ribbon']).toBe(true);
 expect(purchaseAdventureItem(progress,'brigade-ribbon')).toEqual(progress);
 progress=claimAdventureCollectible(progress,'district-1');expect(progress.coins).toBe(30);
 expect(claimAdventureCollectible(progress,'district-1')).toEqual(progress);
 expect(claimAdventureCollectible(progress,'district-2')).toEqual(progress);
 expect(validAdventure(progress)).toBe(true);
},{scene});

worldTest('adventure malformed saves fail closed instead of discarding stored progress',async()=>{
 const malformed=[null,{}, {...initialDesktopSave,profiles:null},
  {...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:{...initialAdventure(),cleared:[]}}]},
  {...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:{...initialAdventure(),pending:{id:'attempt-9',encounterId:'encounter-1'}}}]},
  {...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:{...initialAdventure(),anchor:{districtId:'district-5',x:0,y:0}}}]},
 ];
 for(const state of malformed){let rejected=false;try{desktopSave.load({v:2,state});}catch{rejected=true;}expect(rejected).toBe(true);}
 const stored={v:1,state:initialDesktopSave};
 const before=JSON.stringify(stored);desktopSave.load(stored);expect(JSON.stringify(stored)).toBe(before);
},{scene});

worldTest('adventure optional mastery trials reward once without opening main campaign gates',async()=>{
 let progress=initialAdventure();
 expect(trials.length).toBe(5);expect(trialForDistrict('district-1')!.id).toBe('trial-1');
 expect(availableEncounter('trial-1',progress)).toBe(true);expect(availableEncounter('trial-2',progress)).toBe(false);
 progress=clear(progress,'trial-1',200);
 expect(progress.cleared['trial-1']!.bestScore).toBe(200);expect(progress.coins).toBe(10);
 expect(adventureCleared(progress)).toBe(0);expect(availableEncounter('encounter-3',progress)).toBe(false);
 progress=clear(progress,'trial-1',100);expect(progress.coins).toBe(10);expect(progress.cleared['trial-1']!.clears).toBe(2);
 expect(validAdventure(progress)).toBe(true);
},{scene});

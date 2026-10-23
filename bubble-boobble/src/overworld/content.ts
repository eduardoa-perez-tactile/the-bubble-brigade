import {getOverworldMap,sourceToWorld,mapEncounterPoint,mapPoiPoint} from './maps';
import type { AdventureProgress } from './progression.ts';

export interface AdventureEncounter {
  id: string;
  name: string;
  districtId: string;
  level: number;
  x: number;
  y: number;
  rewardCoins: number;
  requiresAny: string[];
  requiresAll: string[];
  trial?: boolean;
}
export interface AdventureDistrict {
  id: string;
  name: string;
  index: number;
  encounterIds: string[];
  spawn: { x: number; y: number };
}
const districtNames = ['Brigade Landing', 'Whistling Woods', 'Coppercloud Heights', 'Moonlit Marsh', 'Stormglass Citadel'];
const destinationNames = [
  ['Bubble Yard', 'Bellflower Mill', 'Tanglewood Gate', 'Honeycomb Hall', 'Landing Lighthouse'],
  ['Mossy Steps', 'Acorn Arcade', 'Willow Watch', 'Bramble Bridge', 'Woodland Beacon'],
  ['Copper Kettle', 'Cloudstep Depot', 'Windmill Crossing', 'Thunder Workshop', 'Highland Observatory'],
  ['Lantern Landing', 'Firefly Ferry', 'Moonpool Crossing', 'Reedpipe Ruins', 'Marshlight Manor'],
  ['Crystal Courtyard', 'Stormglass Foundry', 'Tempest Terrace', 'Brigade Battlements', 'Skybell Summit'],
];
/** Stable IDs survive destination renames and future changes to the campaign ordering. */
export const districts: AdventureDistrict[] = districtNames.map((name,index) => ({
  id: `district-${index+1}`, name, index,
  encounterIds: Array.from({length:5}, (_,i) => `encounter-${index*5+i+1}`),
  spawn: sourceToWorld(getOverworldMap(`district-${index+1}`),getOverworldMap(`district-${index+1}`).spawn),
}));
export const encounters: AdventureEncounter[] = districts.flatMap(district => district.encounterIds.map((id,index) => ({
  id, name:getOverworldMap(district.id).pois.find(poi=>poi.kind==='encounter'&&poi.slot===index)?.label??destinationNames[district.index]![index]!, districtId:district.id,
  level:district.index*5+index+1, ...mapEncounterPoint(district.id,index), rewardCoins:10,
  requiresAny:index===2 ? district.encounterIds.slice(0,2) : [],
  requiresAll:index>=3 ? [district.encounterIds[2]!] : [],
})));
/** Optional one-life capture/pop trials never gate the main 25-encounter campaign. */
export const trials: AdventureEncounter[] = districts.map(district=>({
  id:`trial-${district.index+1}`,name:getOverworldMap(district.id).pois.find(poi=>poi.kind==='trial')?.label??`${district.name} Mastery`,districtId:district.id,
  level:district.index*5+1,...mapPoiPoint(district.id,'trial'),rewardCoins:10,requiresAny:[],requiresAll:[],trial:true,
}));
export const encounterById = (id:string):AdventureEncounter|undefined => encounters.find(encounter=>encounter.id===id)??trials.find(encounter=>encounter.id===id);
export const trialForDistrict = (districtId:string):AdventureEncounter|undefined => trials.find(trial=>trial.districtId===districtId);
export const districtById = (id:string):AdventureDistrict|undefined => districts.find(district=>district.id===id);
export function availableDistrict(id:string, progress:AdventureProgress):boolean {
  const district=districtById(id);
  if(!district)return false;
  return district.index===0 || districts.slice(0,district.index).every(previous=>previous.encounterIds.every(key=>!!progress.cleared[key]));
}
export function availableEncounter(id:string, progress:AdventureProgress):boolean {
  const encounter=encounterById(id);
  return !!encounter && availableDistrict(encounter.districtId,progress)
    && encounter.requiresAll.every(key=>!!progress.cleared[key])
    && (encounter.requiresAny.length===0 || encounter.requiresAny.some(key=>!!progress.cleared[key]));
}

import {getOverworldMap,mapBounds} from './maps';
import { availableDistrict, availableEncounter, districtById, districts, encounterById, encounters } from './content.ts';

export interface AdventureAnchor { districtId:string; x:number; y:number }
export interface AdventureClear { bestScore:number; clears:number }
export interface AdventureProgress {
  version:2;
  cleared:Record<string,AdventureClear>;
  attemptReceipts:Record<string,true>;
  anchor:AdventureAnchor;
  discoveredShortcuts:Record<string,true>;
  rewardClaims:Record<string,true>;
  coins:number;
  nextAttempt:number;
  pending:{id:string;encounterId:string;startingPower:AdventurePowerId|null;startingPowers?:AdventurePowerId[]}|null;
  purchases:Record<string,true>;
  /** Legacy save field. New encounters use the complete purchased-power set. */
  equippedPower:AdventurePowerId|null;
}
export interface AdventureCompletion { encounterId:string; attemptId:string; score:number }
export const initialAdventure = ():AdventureProgress => ({
  version:2, cleared:{}, attemptReceipts:{},
  anchor:{districtId:districts[0]!.id,...districts[0]!.spawn},
  discoveredShortcuts:{}, rewardClaims:{}, coins:0, nextAttempt:1, pending:null, purchases:{}, equippedPower:null,
});
export const adventureForProfile = (profile:{adventure?:AdventureProgress}):AdventureProgress => profile.adventure ?? initialAdventure();
const integer=(value:number)=>Number.isSafeInteger(value)&&value>=0;
const knownKeys=(record:object,known:(key:string)=>boolean)=>Object.keys(record).every(known);
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
function validPendingAdventure(progress:AdventureProgress):boolean {
 const pending=progress.pending;
 if(pending===null)return true;
 if(!record(pending)||!encounterById(pending.encounterId)||pending.id!==`attempt-${progress.nextAttempt-1}`)return false;
 const old=pending.startingPower;
 if(old!==null&&(!adventurePowerShop.some(item=>item.id===old)||!progress.purchases[old]))return false;
 const powers=pending.startingPowers;
 return powers===undefined||Array.isArray(powers)&&powers.length<=adventurePowerShop.length&&new Set(powers).size===powers.length&&powers.every(id=>adventurePowerShop.some(item=>item.id===id)&&!!progress.purchases[id]);
}
export function validAdventure(progress:AdventureProgress):boolean {
  if(!record(progress) || progress.version!==2 || !record(progress.cleared) || !record(progress.attemptReceipts) || !record(progress.anchor) || !record(progress.discoveredShortcuts) || !record(progress.rewardClaims)||!record(progress.purchases))return false;
  const district=districtById(progress.anchor.districtId);
  return !!district && availableDistrict(district.id,progress)
    && Number.isFinite(progress.anchor.x)&&Number.isFinite(progress.anchor.y)
    && Math.abs(progress.anchor.x)<=4096&&Math.abs(progress.anchor.y)<=4096
    && integer(progress.coins) && Number.isSafeInteger(progress.nextAttempt)&&progress.nextAttempt>0
    && validPendingAdventure(progress)
    && !!progress.purchases && Object.entries(progress.purchases).every(([key,value])=>([...adventureShop,...adventurePowerShop]).some(item=>item.id===key)&&value===true)
    && (progress.equippedPower===null||adventurePowerShop.some(item=>item.id===progress.equippedPower)&&!!progress.purchases[progress.equippedPower])
    && knownKeys(progress.cleared,key=>!!encounterById(key))
    && Object.values(progress.cleared).every(clear=>!!clear&&integer(clear.bestScore)&&Number.isSafeInteger(clear.clears)&&clear.clears>0)
    && Object.entries(progress.attemptReceipts).every(([key,value])=>key.length>0&&value===true)
    && Object.entries(progress.rewardClaims).every(([key,value])=>(key==='guide-three-clears'?adventureCleared(progress)>=3:key.endsWith(':coin')?!!districtById(key.slice(0,-5)):!!encounterById(key)&&!!progress.cleared[key])&&value===true)
    && Object.entries(progress.discoveredShortcuts).every(([key,value])=>districts.some(d=>key===`${d.id}:shortcut`)&&value===true);
}
/** A replayed receipt cannot grant another clear, record or coin reward. */
export function completeAdventure(progress:AdventureProgress,payload:AdventureCompletion):AdventureProgress {
  if(!payload.attemptId || payload.attemptId.length>128 || !integer(payload.score))return progress;
  if(progress.attemptReceipts[payload.attemptId] || !availableEncounter(payload.encounterId,progress) || progress.pending?.id!==payload.attemptId || progress.pending.encounterId!==payload.encounterId)return progress;
  const encounter=encounterById(payload.encounterId)!;
  const previous=progress.cleared[encounter.id];
  const claimed=!!progress.rewardClaims[encounter.id];
  return {...progress, pending:null,
    cleared:{...progress.cleared,[encounter.id]:{bestScore:Math.max(previous?.bestScore??0,payload.score),clears:(previous?.clears??0)+1}},
    attemptReceipts:{...progress.attemptReceipts,[payload.attemptId]:true},
    rewardClaims:claimed?progress.rewardClaims:{...progress.rewardClaims,[encounter.id]:true},
    coins:progress.coins+(claimed?0:encounter.rewardCoins),
  };
}
/** Only persist safe map positions in a district this profile can enter. */
export function setAdventureAnchor(progress:AdventureProgress,anchor:AdventureAnchor):AdventureProgress {
  const bounds=mapBounds(getOverworldMap(anchor.districtId));
  if(!availableDistrict(anchor.districtId,progress)||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y)||anchor.x<bounds.minX||anchor.x>bounds.maxX||anchor.y<bounds.minY||anchor.y>bounds.maxY)return progress;
  return {...progress,anchor:{...anchor}};
}
export function discoverAdventureShortcut(progress:AdventureProgress,id:string):AdventureProgress {
  const district=districts.find(d=>id===`${d.id}:shortcut`);
  if(!district||!availableDistrict(district.id,progress)||progress.discoveredShortcuts[id])return progress;
  return {...progress,discoveredShortcuts:{...progress.discoveredShortcuts,[id]:true}};
}
export const adventureCleared = (progress:AdventureProgress):number => encounters.filter(encounter=>!!progress.cleared[encounter.id]).length;

export function beginAdventureAttempt(progress:AdventureProgress,encounterId:string):AdventureProgress {
  if(!availableEncounter(encounterId,progress)||progress.nextAttempt>=Number.MAX_SAFE_INTEGER)return progress;
  return {...progress,nextAttempt:progress.nextAttempt+1,pending:{id:`attempt-${progress.nextAttempt}`,encounterId,startingPower:null,startingPowers:adventureStartingPowers(progress)}};
}
export const abandonAdventureAttempt = (progress:AdventureProgress):AdventureProgress => progress.pending?{...progress,pending:null}:progress;
export const adventureShop = [
  {id:'brigade-ribbon',name:'Brigade Ribbon',price:20,description:'A keepsake for your Adventure journal.'},
  {id:'skybell-badge',name:'Skybell Badge',price:40,description:'A keepsake for your Adventure journal.'},
];
export const adventurePowerShop = [
  {id:'pink_candy',name:'Pink Candy',price:10,power:'Pink',description:'Longer bubble range.'},
  {id:'blue_candy',name:'Blue Candy',price:15,power:'Blue',description:'Faster bubbles.'},
  {id:'yellow_candy',name:'Yellow Candy',price:20,power:'Yellow',description:'Faster bubble firing.'},
  {id:'shoes',name:'Shoes',price:25,power:'Shoes',description:'Faster movement.'},
] as const;
export type AdventurePowerId = typeof adventurePowerShop[number]['id'];
/** Every purchased upgrade is automatically active; catalog order keeps receipts stable. */
export function adventureStartingPowers(progress:AdventureProgress):AdventurePowerId[] {
 return adventurePowerShop.filter(item=>progress.purchases[item.id]).map(item=>item.id);
}
/** Older pending attempts retain their original single-power receipt. */
export function attemptStartingPowers(pending:NonNullable<AdventureProgress['pending']>):AdventurePowerId[] {
 return pending.startingPowers??(pending.startingPower?[pending.startingPower]:[]);
}
/** Retained for old recorded intents/save actions; powers are no longer individually equipped. */
export function equipAdventurePower(progress:AdventureProgress,_id:string|null):AdventureProgress { return progress; }
export function purchaseAdventureItem(progress:AdventureProgress,id:string):AdventureProgress {
  const item=[...adventureShop,...adventurePowerShop].find(value=>value.id===id);
  if(!item||progress.purchases[id]||progress.coins<item.price)return progress;
  return {...progress,coins:progress.coins-item.price,purchases:{...progress.purchases,[id]:true}};
}
export function claimAdventureGuideReward(progress:AdventureProgress):AdventureProgress {
  if(adventureCleared(progress)<3||progress.rewardClaims['guide-three-clears'])return progress;
  return {...progress,coins:progress.coins+15,rewardClaims:{...progress.rewardClaims,'guide-three-clears':true}};
}

/** One hidden map coin per district. Navigation decides when the player finds it. */
export function claimAdventureCollectible(progress:AdventureProgress,districtId:string):AdventureProgress {
  const key=`${districtId}:coin`;
  if(!availableDistrict(districtId,progress)||progress.rewardClaims[key])return progress;
  return {...progress,coins:progress.coins+5,rewardClaims:{...progress.rewardClaims,[key]:true}};
}

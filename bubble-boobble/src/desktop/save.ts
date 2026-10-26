import { defineMeta, refuse } from '@gameengine/meta';
import { adventureForProfile, validAdventure, beginAdventureAttempt, abandonAdventureAttempt, completeAdventure, setAdventureAnchor, discoverAdventureShortcut, purchaseAdventureItem, claimAdventureGuideReward, claimAdventureCollectible, initialAdventure, type AdventureProgress, type AdventureAnchor, type AdventureCompletion } from '../overworld/progression.ts';
export { adventureForProfile } from '../overworld/progression.ts';
import { metaInWorld } from '@gameengine/meta/world';
import type { Level } from '../arcade/types.ts';
import { validateLevel } from './editor.ts';
import { cycleDragonSkin, isDragonSkin, type DragonSkin } from './skins.ts';
export interface Profile {name:string;avatar:DragonSkin;high_score:number;best_round:number;played:number;won:number;lost:number;xp:number;adventure?:AdventureProgress}
export interface DesktopSave {profiles:Profile[];active:number;settings:{music:number;sound:number;fullscreen:boolean;reducedEffects?:boolean};custom_level:Level|null}
const profile=(name:string):Profile=>({name,avatar:'green',high_score:0,best_round:1,played:0,won:0,lost:0,xp:0});
// strings.TrimSpace/ToUpper in Go do not expand a Unicode rune into ASCII letters.
const trimName=(name:string)=>name.replace(/^[\t\n\v\f\r \u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+|[\t\n\v\f\r \u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/g,'');
const upperName=(name:string)=>Array.from(name,c=>{const upper=c.toUpperCase();return Array.from(upper).length===1?upper:c;}).join('');
export function validateName(name:string):string {
 const bytes=Array.from(name,c=>{const n=c.codePointAt(0)!;return n<128?1:n<2048?2:n<65536?3:4;}).reduce((sum,n)=>sum+n,0);
 if(name!==trimName(name)||bytes<1||bytes>16)return 'use 1 to 16 characters';
 if(!/^[A-Za-z0-9 _-]+$/.test(name))return 'use letters, numbers, spaces, - or _';
 return '';
}
export const validName=(name:string)=>validateName(name)==='';
export const initialDesktopSave:DesktopSave={profiles:[profile('PLAYER1')],active:0,settings:{music:50,sound:75,fullscreen:false},custom_level:null};
function updateAdventure(s:DesktopSave,index:number,action:(progress:AdventureProgress)=>AdventureProgress):DesktopSave {
 if(!Number.isInteger(index)||index<0||index>=s.profiles.length)return s;
 const current=s.profiles[index]!; const before=adventureForProfile(current); const after=action(before);
 if(after===before)return s;
 return {...s,profiles:s.profiles.map((value,i)=>i===index?{...value,adventure:after}:value)};
}
export const desktopSave = defineMeta({name:'bubblebobble-desktop',version:2,initial:initialDesktopSave,
  migrate:(old:unknown,from:number)=>{if(from!==1)throw new Error('unsupported desktop save version');return old as DesktopSave;},
  actions:{
    adventureReset:(s:DesktopSave,p:{profileIndex:number})=>updateAdventure(s,p.profileIndex,progress=>({...initialAdventure(),nextAttempt:progress.nextAttempt})),
    adventureCollectible:(s:DesktopSave,p:{profileIndex:number;districtId:string})=>updateAdventure(s,p.profileIndex,progress=>claimAdventureCollectible(progress,p.districtId)),
    adventureBeginAttempt:(s:DesktopSave,p:{profileIndex:number;encounterId:string})=>updateAdventure(s,p.profileIndex,progress=>beginAdventureAttempt(progress,p.encounterId)),
    adventureAbandon:(s:DesktopSave,p:{profileIndex:number})=>updateAdventure(s,p.profileIndex,abandonAdventureAttempt),
    adventureComplete:(s:DesktopSave,p:AdventureCompletion&{profileIndex:number})=>updateAdventure(s,p.profileIndex,progress=>completeAdventure(progress,p)),
    adventureAnchor:(s:DesktopSave,p:AdventureAnchor&{profileIndex:number})=>updateAdventure(s,p.profileIndex,progress=>setAdventureAnchor(progress,p)),
    adventureShortcut:(s:DesktopSave,p:{profileIndex:number;id:string})=>updateAdventure(s,p.profileIndex,progress=>discoverAdventureShortcut(progress,p.id)),
    adventurePurchase:(s:DesktopSave,p:{profileIndex:number;id:string})=>updateAdventure(s,p.profileIndex,progress=>purchaseAdventureItem(progress,p.id)),
    adventureGuideReward:(s:DesktopSave,p:{profileIndex:number})=>updateAdventure(s,p.profileIndex,claimAdventureGuideReward),
    create:(s:DesktopSave,name:string)=>{name=upperName(trimName(name));const error=validateName(name);if(error)refuse(error);if(s.profiles.length>=8)refuse('all eight profile slots are occupied');if(s.profiles.some(p=>p.name.toUpperCase()===name))refuse('that profile already exists');return {...s,profiles:[...s.profiles,profile(name)],active:s.profiles.length};},
    select:(s:DesktopSave,index:number)=>index>=0&&index<s.profiles.length?{...s,active:index}:s,
    setting:(s:DesktopSave,p:{action:string;delta:number})=>{if(p.action==='effects')return {...s,settings:{...s.settings,reducedEffects:!s.settings.reducedEffects}};if(p.action==='avatar')return {...s,profiles:s.profiles.map((v,i)=>i===s.active?{...v,avatar:cycleDragonSkin(v.avatar,p.delta)}:v)};if(p.action==='fullscreen')return {...s,settings:{...s.settings,fullscreen:!s.settings.fullscreen}};if(p.action==='music'||p.action==='sound')return {...s,settings:{...s.settings,[p.action]:(s.settings[p.action]+p.delta+125)%125}};return s;},
    custom:(s:DesktopSave,level:Level)=>{const error=validateLevel(level);if(error)refuse(error);return {...s,custom_level:level};},
    record:(s:DesktopSave,p:{won:boolean;score:number;round:number})=>({...s,profiles:s.profiles.map((v,i)=>i!==s.active?v:{...v,played:v.played+1,won:v.won+(p.won?1:0),lost:v.lost+(p.won?0:1),xp:v.xp+(p.won?75:25),high_score:Math.max(v.high_score,p.score),best_round:Math.max(v.best_round,p.won?25:Math.min(25,Math.max(1,p.round)))})}),
  },invariants:{valid:(s:DesktopSave)=>{try{return !!s&&Array.isArray(s.profiles)&&!!s.settings&&typeof s.settings.fullscreen==='boolean'&&(s.settings.reducedEffects===undefined||typeof s.settings.reducedEffects==='boolean')&&s.profiles.length>=1&&s.profiles.length<=8&&Number.isInteger(s.active)&&s.active>=0&&s.active<s.profiles.length&&new Set(s.profiles.map(p=>p.name.toUpperCase())).size===s.profiles.length&&s.profiles.every(p=>validName(p.name)&&isDragonSkin(p.avatar)&&(p.adventure===undefined||validAdventure(p.adventure))&&p.played>=0&&p.won>=0&&p.lost>=0&&p.played===p.won+p.lost&&[p.played,p.won,p.lost,p.xp,p.high_score,p.best_round].every(Number.isInteger)&&p.xp>=0&&p.high_score>=0&&p.best_round>=1&&p.best_round<=25)&&Number.isInteger(s.settings.music)&&Number.isInteger(s.settings.sound)&&s.settings.music>=0&&s.settings.music<=100&&s.settings.sound>=0&&s.settings.sound<=100&&(!s.custom_level||!validateLevel(s.custom_level));}catch{return false;}}},
});
export const desktopSaveState=metaInWorld(desktopSave,{persist:true});
export const leaderboard=(s:DesktopSave)=>[...s.profiles].sort((a,b)=>b.high_score-a.high_score||b.won-a.won);

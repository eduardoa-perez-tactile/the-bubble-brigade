/** Recorded-intent adapter between the desktop shell, map simulation and encounter runner. */
import { desktopState, desktopGameRequest, type DesktopState } from '../desktop/documents.ts';
import { desktopSaveState } from '../desktop/save';
import { adventureForProfile, adventureCleared, adventureShop, adventurePowerShop } from './progression';
import { districts, districtById, encounterById, trialForDistrict, availableDistrict, availableEncounter } from './content';
import { overworldState, enterOverworld, suspendOverworld, setOverworldModal, returnToEntrance } from './state';
import {overworldEntrancePoint as importShortcutPoint} from './navigation';
import { overworldPoi } from './navigation';
import {adventureJournalModel} from './journal-model';

export function handleAdventureAction(action:string,value:string,now:number):boolean {
 const s=desktopState.get(),map=overworldState.get();
 const patch=(p:Partial<DesktopState>)=>desktopState.set({...desktopState.get(),...p});
 const save=desktopSaveState.get(),profileIndex=save.active,profile=save.profiles[profileIndex]!;
 const progress=adventureForProfile(profile);
 const panel=(kind:string,message='')=>{setOverworldModal(true);patch({screen:'overworld-panel',overworldPanel:kind,panelMessage:message,shopItem:'pink_candy',shopHelp:false,shopReaction:0,selected:0});};
 const quit=()=>desktopGameRequest.set({...desktopGameRequest.get(),sequence:desktopGameRequest.get().sequence+1,action:'quit'});
 const anchor=()=>desktopSaveState.dispatch('adventureAnchor',{profileIndex,districtId:map.districtId,x:map.x,y:map.y},now);
 const close=()=>{if(!map.active){patch({screen:'menu',overworldPanel:'',selected:0});return;}setOverworldModal(false);patch({screen:'overworld',overworldPanel:'',panelMessage:'',selected:0});};
 if((s.adventure||map.active)&&(action.startsWith('profile:')||['profiles','new-profile','create-profile','navigate'].includes(action)))return true;
 if(action==='adventure-menu'){
  quit();suspendOverworld();patch({screen:'overworld-panel',overworldPanel:'menu',adventure:false,partyRun:false,selected:0,status:''});return true;
 }
 if(action==='adventure-continue'){
  if(!desktopSaveState.loaded()){patch({status:'SAVE IS LOADING'});return true;}
  desktopSaveState.dispatch('adventureAbandon',{profileIndex},now);quit();
  enterOverworld(progress.anchor.districtId,progress.anchor);
  patch({screen:'overworld',adventure:false,adventureEncounter:'',adventureAttempt:'',adventureProfile:profileIndex,partyRun:false,custom:false,selected:0,status:''});return true;
 }
 if(action==='adventure-new'){
  if(!['menu','overworld-panel','settings'].includes(s.screen))return true;
  if(!desktopSaveState.loaded()){patch({status:'SAVE IS LOADING'});return true;}
  panel('reset');return true;
 }
 if(action==='adventure-reset'){
  if(s.screen!=='overworld-panel'||s.overworldPanel!=='reset'||!desktopSaveState.loaded())return true;
  desktopSaveState.dispatch('adventureReset',{profileIndex},now);enterOverworld(districts[0]!.id);quit();
  patch({screen:'overworld',adventure:false,adventureEncounter:'',adventureAttempt:'',adventureProfile:profileIndex,overworldPanel:'',panelMessage:'',status:'',custom:false,partyRun:false,selected:0});return true;
 }
 if(action==='adventure-arcade'){suspendOverworld();patch({screen:'party',partyReturn:s.screen==='overworld-panel'?'overworld-panel':'menu',partyEditing:false,adventure:false,selected:0,status:''});return true;}
 if(action==='overworld-interact'){
  if(!map.active||s.screen!=='overworld'||map.focusedPoi!==value)return true;
  const poi=overworldPoi(map.districtId,value);if(!poi||poi.kind==='guide'||(poi.x-map.x)**2+(poi.y-map.y)**2>(poi.radius??68)**2)return true;
  anchor();
  if(poi.kind==='encounter'||poi.kind==='trial'){setOverworldModal(true);patch({screen:'overworld-card',adventureEncounter:poi.kind==='trial'?trialForDistrict(map.districtId)!.id:poi.id,status:'',selected:0});return true;}
  if(poi.kind==='collectible'){
   const claimed=!!progress.rewardClaims[`${map.districtId}:coin`];
   desktopSaveState.dispatch('adventureCollectible',{profileIndex,districtId:map.districtId},now);
   panel('collectible',claimed?'You already found this hidden coin.':'A hidden coin cache! Five coins have been added to your purse.');return true;
  }
  if(poi.kind==='shortcut'){
   desktopSaveState.dispatch('adventureShortcut',{profileIndex,id:`${map.districtId}:shortcut`},now);panel('shortcut','You found the secret trail. It connects the upper landmarks without changing which encounters you have cleared.');return true;
  }
  panel(poi.kind);return true;
 }
 if(action==='adventure-play'||action==='restart'&&s.adventure){
  if(!desktopSaveState.loaded()||s.adventureProfile!==undefined&&s.adventureProfile!==profileIndex)return true;
  const encounter=encounterById(s.adventureEncounter??'');
  const retry=s.adventure&&['pause','result'].includes(s.screen);
  if(!encounter||!availableEncounter(encounter.id,progress)||!retry&&(s.screen!=='overworld-card'||map.focusedPoi!==(encounter.trial?'trial':encounter.id)))return true;
  desktopSaveState.dispatch('adventureBeginAttempt',{profileIndex,encounterId:encounter.id},now);
  const pending=adventureForProfile(desktopSaveState.get().profiles[profileIndex]!).pending;if(!pending)return true;
  suspendOverworld();
  desktopGameRequest.set({sequence:desktopGameRequest.get().sequence+1,action:'adventure',mode:'solo',players:1,level:encounter.level,customLevel:null,cartoon:true,encounterId:encounter.id,attemptId:pending.id,profileIndex});
  patch({screen:'play',adventure:true,adventureProfile:profileIndex,adventureAttempt:pending.id,adventureEncounter:encounter.id,partyRun:false,custom:false,recorded:false,score:0,round:encounter.level,selected:0,gameplayInputArmed:false,pauseConfirm:''});return true;
 }
 if(action==='leave'&&s.adventure){
  desktopSaveState.dispatch('adventureAbandon',{profileIndex:s.adventureProfile!},now);quit();returnToEntrance(s.adventureEncounter!,s.screen==='result'&&s.won);
  patch({screen:'overworld',adventure:false,recorded:true,pauseConfirm:'',selected:0});return true;
 }
 if(action==='overworld-shortcut-travel'&&map.active&&s.screen==='overworld-panel'&&s.overworldPanel==='shortcut'&&progress.discoveredShortcuts[`${map.districtId}:shortcut`]){
  const destination=districtById(map.districtId)!.encounterIds[2]!;
  enterOverworld(map.districtId,importShortcutPoint(map.districtId,destination));
  const at=overworldState.get();desktopSaveState.dispatch('adventureAnchor',{profileIndex,districtId:at.districtId,x:at.x,y:at.y},now);
  patch({screen:'overworld',overworldPanel:'',selected:0});return true;
 }
 if(action==='overworld-shortcut'&&map.active&&map.focusedPoi==='shortcut'){desktopSaveState.dispatch('adventureShortcut',{profileIndex,id:`${map.districtId}:shortcut`},now);return true;}
 if(action==='overworld-menu'&&map.active){anchor();panel('pause');return true;}
 if(action==='overworld-journal'&&map.active){panel('journal');patch({journalDistrict:map.districtId,journalEntry:'',journalMemories:false});return true;}
 if(action.startsWith('overworld-journal-page:')&&map.active&&s.screen==='overworld-panel'&&s.overworldPanel==='journal'){
  const id=action.slice('overworld-journal-page:'.length);if(districtById(id))patch({journalDistrict:id,journalEntry:'',journalMemories:false,panelMessage:'',selected:districtById(id)!.index});return true;
 }
 if(action.startsWith('overworld-journal-entry:')&&map.active&&s.screen==='overworld-panel'&&s.overworldPanel==='journal'){
  const id=action.slice('overworld-journal-entry:'.length),entry=encounterById(id);
  if(entry?.districtId===(s.journalDistrict??map.districtId))patch({journalEntry:id,panelMessage:''});return true;
 }
 if(action==='overworld-journal-memories'&&map.active&&s.screen==='overworld-panel'&&s.overworldPanel==='journal'){
  const next={...s,journalMemories:!s.journalMemories,panelMessage:''};
  const selected=adventureJournalModel(next,save,map.districtId).buttons.findIndex(b=>b.key==='overworld-journal-memories');
  patch({journalMemories:next.journalMemories,panelMessage:'',selected:Math.max(0,selected)});return true;
 }
 if(action.startsWith('overworld-journal-show:')&&map.active&&s.screen==='overworld-panel'&&s.overworldPanel==='journal'){
  const id=action.slice('overworld-journal-show:'.length),entry=encounterById(id);
  if(!entry||entry.districtId!==map.districtId||entry.districtId!==(s.journalDistrict??map.districtId)||!availableEncounter(id,progress))return true;
  close();const current=overworldState.get();
  const poiId=entry.trial?'trial':id;
  overworldState.set({...current,waypointId:current.focusedPoi===poiId?'':id});return true;
 }
 if(action==='overworld-guide-claim'&&s.screen==='overworld-panel'&&s.overworldPanel==='journal'){
  desktopSaveState.dispatch('adventureGuideReward',{profileIndex},now);patch({panelMessage:progress.rewardClaims['guide-three-clears']?'Three-clear reward already collected.':adventureCleared(progress)>=3?'Three-clear reward: 15 coins saved.':'Clear any three encounters to claim 15 coins in the journal.'});return true;
 }
 if(action==='overworld-shop-help'&&s.screen==='overworld-panel'&&['vendor','shop'].includes(s.overworldPanel??'')){patch({shopHelp:!s.shopHelp});return true;}
 if(action.startsWith('overworld-browse:')&&s.screen==='overworld-panel'&&['vendor','shop'].includes(s.overworldPanel??'')){
  const id=action.slice(17),index=adventurePowerShop.findIndex(item=>item.id===id);
  if(index>=0)patch({shopItem:id,selected:index,panelMessage:''});return true;
 }
 if(action.startsWith('overworld-buy:')&&s.screen==='overworld-panel'&&['vendor','shop'].includes(s.overworldPanel??'')){
  const id=action.slice(14),item=[...adventureShop,...adventurePowerShop].find(i=>i.id===id);
  desktopSaveState.dispatch('adventurePurchase',{profileIndex,id},now);
  patch({shopReaction:item&&!progress.purchases[id]&&progress.coins>=item.price?(s.shopReaction??0)+1:s.shopReaction??0,panelMessage:item?(progress.purchases[id]?'Already owned.':progress.coins<item.price?'You need more coins.':adventurePowerShop.some(power=>power.id===id)?`${item.name} bought. All your powers work together.`:'Keepsake added to your Adventure journal.'):'Unknown item.'});return true;
 }
 // Ignore obsolete equip/unequip intents: all purchased powers now stack automatically.
 if(action.startsWith('overworld-equip:')&&s.screen==='overworld-panel'&&['vendor','shop'].includes(s.overworldPanel??''))return true;
 if(action.startsWith('overworld-travel:')&&map.active&&s.screen==='overworld-panel'&&['gate','journal'].includes(s.overworldPanel??'')){
  const id=action.slice(17);if(!availableDistrict(id,progress))return true;
  if(id===map.districtId){close();return true;}
  enterOverworld(id);const at=overworldState.get();desktopSaveState.dispatch('adventureAnchor',{profileIndex,districtId:id,x:at.x,y:at.y},now);
  patch({screen:'overworld',overworldPanel:'',selected:0});return true;
 }
 if(action==='overworld-main-menu'&&map.active){anchor();suspendOverworld();patch({screen:'menu',adventure:false,selected:0});return true;}
 if(action==='settings'&&map.active){setOverworldModal(true);patch({settingsReturn:s.screen,screen:'settings',selected:0});return true;}
 if(action==='menu'&&s.screen==='settings'&&s.settingsReturn?.startsWith('overworld')){
  const screen=s.settingsReturn;patch({screen,settingsReturn:'menu',selected:0});if(screen==='overworld')setOverworldModal(false);return true;
 }
 if(['overworld-journal-return','overworld-journal-close'].includes(action)){
  if(map.active&&s.screen==='overworld-panel'&&s.overworldPanel==='journal')close();return true;
 }
 if(action==='overworld-back'||action==='menu'&&s.screen.startsWith('overworld')){close();return true;}
 return false;
}

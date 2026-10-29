import type { DesktopState } from '../desktop/state';
import type { DesktopSave } from '../desktop/save';
import type { OverworldPanelModel } from './model';
import { adventureForProfile, adventureCleared, adventureShop } from './progression';
import { districts, districtById, encounterById, availableDistrict } from './content';
import { adventureShopModel } from './shop-model';
import { overworldState } from './state';
import {adventureJournalModel} from './journal-model';
export function adventurePanel(s:DesktopState,save:DesktopSave):OverworldPanelModel {
 const profile=save.profiles[save.active]!,p=adventureForProfile(profile),map=overworldState.get(),district=districtById(map.districtId)??districts[0]!;
 const b=(key:string,label:string)=>({key,label}),back=b('overworld-back','BACK TO MAP');
 let title='ADVENTURE',subtitle=profile.name,body='';let buttons:import('./model').OverworldChoice[]=[back];
 switch(s.overworldPanel){
 case 'menu':subtitle='CHOOSE YOUR NEXT ADVENTURE';body='Explore the islands, find hidden trails and lead the Brigade home.';buttons=[b('adventure-continue',adventureCleared(p)?'CONTINUE ADVENTURE':'BEGIN ADVENTURE'),b('adventure-arcade','PARTY PLAY'),b('adventure-new','RESTART ADVENTURE'),b('overworld-back','MAIN MENU')];break;
 case 'reset':title='RESTART ADVENTURE?';subtitle='YOUR PLAYER PROFILE AND ARCADE RECORDS WILL BE KEPT';body='Start again at the harbor. This erases your Adventure clears, coins, purchased powerups, keepsakes and discovered shortcuts. Your current Adventure cannot be recovered.';buttons=[b('overworld-back','KEEP MY ADVENTURE'),b('adventure-reset','RESTART FROM SCRATCH')];break;
 case 'pause':title='TAKE A BREATHER';subtitle=district.name;body=`${adventureCleared(p)} / 25 encounters cleared`;buttons=[b('overworld-back','RESUME EXPLORING'),b('overworld-journal','ADVENTURE JOURNAL'),b('settings','OPTIONS'),b('overworld-main-menu','MAIN MENU')];break;
 case 'journal':title='ADVENTURE JOURNAL';subtitle=`${adventureCleared(p)} / 25 CLEARED • ${p.coins} COINS`;body=district.encounterIds.map(id=>`${p.cleared[id]?'CLEARED':'PENDING'}: ${encounterById(id)!.name}`).join('\n')+'\n\nKEEPSAKES: '+(adventureShop.filter(i=>p.purchases[i.id]).map(i=>i.name).join(', ')||'None yet');buttons=adventureJournalModel(s,save,map.districtId).buttons;break;
 case 'vendor':case 'shop':{const shop=adventureShopModel(s,save);return {presentation:'adventure-shop',title:'BRIGADE SHOP',subtitle:shop.coins,body:shop.description,buttons:shop.buttons};}
 case 'gate':{const next=districts[district.index+1];title=next?'ONWARD, BRIGADE!':'THE BRIGADE IS HOME';subtitle=district.name;const remaining=district.encounterIds.filter(id=>!p.cleared[id]);body=remaining.length?'Clear these encounters to open the way:\n'+remaining.map(id=>encounterById(id)!.name).join('\n'):next?`The route to ${next.name} is open.`:'All 25 encounters cleared. Explore again, improve your records, and enjoy the islands.';buttons=[...(next&&availableDistrict(next.id,p)?[b(`overworld-travel:${next.id}`,`TRAVEL TO ${next.name}`)]:[]),b('overworld-journal','JOURNAL / RETURN TRAVEL'),back];break;}
 case 'trial':title='BUBBLE MASTERY';subtitle='A PLACE TO PRACTICE';body='Practice capture and popping in the first local encounter. This uses the encounter’s regular rules and clear rewards.';buttons=[back];break;
 case 'collectible':title='A HIDDEN FIND';subtitle='EXPLORATION PAYS OFF';body=s.panelMessage??'';break;
 case 'shortcut':title='SECRET TRAIL';subtitle='A NEW WAY AROUND';body=s.panelMessage??'';buttons=[b('overworld-shortcut-travel','TAKE THE SERVICE PATH'),back];break;
 }
 const presentation=s.overworldPanel==='pause'?'adventure-pause':s.overworldPanel==='journal'?'adventure-journal':['shop','vendor'].includes(s.overworldPanel??'')?'adventure-shop':'adventure-dialogue';
 const guidance=adventureCleared(p)<3?'Visit a crest. Clear three encounters for a 15-coin journal reward.':'Clear all five local encounters to open the next district.';
 return {presentation,title,subtitle,body,status:s.overworldPanel==='journal'?(s.panelMessage||guidance):s.panelMessage??s.status,buttons:buttons.map((button,i)=>({...button,selected:i===s.selected}))};
}

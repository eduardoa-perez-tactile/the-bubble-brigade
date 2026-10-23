import type { DesktopState } from '../desktop/state';
import type { DesktopSave } from '../desktop/save';
import type { OverworldPanelModel } from './model';
import { adventureForProfile, adventureCleared, adventureShop } from './progression';
import { districts, districtById, encounterById, availableDistrict } from './content';
import { overworldState } from './state';
export function adventurePanel(s:DesktopState,save:DesktopSave):OverworldPanelModel {
 const profile=save.profiles[save.active]!,p=adventureForProfile(profile),map=overworldState.get(),district=districtById(map.districtId)??districts[0]!;
 const b=(key:string,label:string)=>({key,label}),back=b('overworld-back','BACK TO MAP');
 let title='ADVENTURE',subtitle=profile.name,body='',buttons=[back];
 switch(s.overworldPanel){
 case 'menu':subtitle='CHOOSE YOUR NEXT ADVENTURE';body='Explore the islands, find hidden trails and lead the Brigade home.';buttons=[b('adventure-continue',adventureCleared(p)?'CONTINUE ADVENTURE':'BEGIN ADVENTURE'),b('adventure-arcade','ARCADE MODES'),b('adventure-new','NEW ADVENTURE'),b('overworld-back','MAIN MENU')];break;
 case 'reset':title='NEW ADVENTURE?';subtitle='YOUR ARCADE RECORDS WILL BE KEPT';body='This resets this profile’s Adventure clears, coins and keepsakes. Your current Adventure cannot be recovered.';buttons=[b('overworld-back','KEEP MY ADVENTURE'),b('adventure-reset','RESET ADVENTURE')];break;
 case 'pause':title='TAKE A BREATHER';subtitle=district.name;body=`${adventureCleared(p)} / 25 encounters cleared`;buttons=[b('overworld-back','RESUME EXPLORING'),b('overworld-journal','ADVENTURE JOURNAL'),b('settings','OPTIONS'),b('overworld-main-menu','MAIN MENU')];break;
 case 'journal':title='ADVENTURE JOURNAL';subtitle=`${adventureCleared(p)} / 25 CLEARED • ${p.coins} COINS`;body=district.encounterIds.map(id=>`${p.cleared[id]?'✓':'○'} ${encounterById(id)!.name}`).join('\n')+'\n\nKEEPSAKES: '+(adventureShop.filter(i=>p.purchases[i.id]).map(i=>i.name).join(', ')||'None yet');buttons=[...districts.filter(d=>availableDistrict(d.id,p)).map(d=>b(`overworld-travel:${d.id}`,d.name)),back];break;
 case 'guide':title='BRIGADE GUIDE';subtitle='A LITTLE HELP FOR THE ROAD';body='Walk to a landmark and press Enter / A to inspect it. The first two encounters are open. Clear either to reach the crossroads. Clear all five to open the next district.\n\nClear three encounters and return for 15 coins.';buttons=[b('overworld-guide-claim',p.rewardClaims['guide-three-clears']?'REWARD COLLECTED':'CLAIM THREE-CLEAR REWARD'),back];break;
 case 'vendor':case 'shop':title='SUPPLY CART';subtitle=`${p.coins} COINS • OPTIONAL KEEPSAKES`;body='A little something for your Adventure journal. These keepsakes never change combat strength.';buttons=[...adventureShop.map(i=>b(`overworld-buy:${i.id}`,`${p.purchases[i.id]?'OWNED • ':''}${i.name} — ${i.price} COINS`)),back];break;
 case 'gate':{const next=districts[district.index+1];title=next?'ONWARD, BRIGADE!':'THE BRIGADE IS HOME';subtitle=district.name;const remaining=district.encounterIds.filter(id=>!p.cleared[id]);body=remaining.length?'Clear these encounters to open the way:\n'+remaining.map(id=>encounterById(id)!.name).join('\n'):next?`The route to ${next.name} is open.`:'All 25 encounters cleared. Explore again, improve your records, and enjoy the islands.';buttons=[...(next&&availableDistrict(next.id,p)?[b(`overworld-travel:${next.id}`,`TRAVEL TO ${next.name}`)]:[]),b('overworld-journal','JOURNAL / RETURN TRAVEL'),back];break;}
 case 'trial':title='BUBBLE MASTERY';subtitle='A PLACE TO PRACTICE';body='Practice capture and popping in the first local encounter. This uses the encounter’s regular rules and clear rewards.';buttons=[back];break;
 case 'collectible':title='A HIDDEN FIND';subtitle='EXPLORATION PAYS OFF';body=s.panelMessage??'';break;
 case 'shortcut':title='SECRET TRAIL';subtitle='A NEW WAY AROUND';body=s.panelMessage??'';break;
 }
 return {title,subtitle,body,status:s.panelMessage??s.status,buttons:buttons.map((button,i)=>({...button,selected:i===s.selected}))};
}

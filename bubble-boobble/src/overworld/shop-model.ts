/** Shop decisions stay in the controller model, never in the view. */
import type {DesktopState} from '../desktop/documents';
import type {DesktopSave} from '../desktop/save';
import {adventureForProfile,adventurePowerShop} from './progression';
import type {OverworldChoice} from './model';

export function adventureShopModel(s:DesktopState,save:DesktopSave,viewport={width:1280,height:720}) {
 const p=adventureForProfile(save.profiles[save.active]!);
 const item=adventurePowerShop.find(i=>i.id===s.shopItem)??adventurePowerShop[0];
 const equipped=adventurePowerShop.find(i=>i.id===p.equippedPower);
 const owned=!!p.purchases[item.id],active=p.equippedPower===item.id,affordable=p.coins>=item.price;
 const actionKey=owned?`overworld-equip:${item.id}`:`overworld-buy:${item.id}`;
 const actionEnabled=!active&&(owned||affordable);
 const actionLabel=active?'EQUIPPED':owned?'EQUIP':affordable?`BUY & EQUIP · ${item.price}`:`NEED ${item.price-p.coins} MORE COINS`;
 const buttons:OverworldChoice[]=[...adventurePowerShop.map(i=>({key:`overworld-browse:${i.id}`,label:i.name})),{key:actionKey,label:actionLabel},...(equipped?[{key:'overworld-equip:none',label:'REMOVE'}]:[]),{key:'overworld-shop-help',label:'HELP'},{key:'overworld-back',label:'BACK TO MAP'}];
 const benefits={pink_candy:'Reach enemies from farther away.',blue_candy:'Send bubbles toward enemies faster.',yellow_candy:'Send the next bubble sooner.',shoes:'Move around the arena faster.'};
 return {
  layout:(viewport.width/viewport.height<.7?'portrait':viewport.width/viewport.height<1.2?'tablet':'landscape') as 'portrait'|'tablet'|'landscape',
  coins:`${p.coins}`,name:item.name.toUpperCase(),description:item.description,benefit:benefits[item.id],
  illustration:`cartoon/frames/item/${item.id}`,actionLabel,actionEnabled,actionUnavailable:!actionEnabled,
  actionKey,actionFocused:s.selected===4,backFocused:s.selected===buttons.length-1,removeFocused:!!equipped&&s.selected===5,
  consequence:active?'Ready for your next encounter and retry.':equipped?`Replaces ${equipped.name}.`:'Your first starting power. Equipped as soon as you buy.',
  balance:owned?'Owned permanently · free to equip':affordable?`${p.coins-item.price} coins after purchase`:'Earn coins from first clears, hidden finds and journal rewards.',
  equippedLabel:`Equipped: ${equipped?.name??'None'}`,
  equippedArt:`cartoon/frames/item/${equipped?.id??'pink_candy'}`,hasEquipped:!!equipped,
  ownerClip:save.settings.reducedEffects?'cartoon/shop/owner-open.clip2d.json':'cartoon/shop/owner-idle.clip2d.json',ownerHidden:false,status:s.panelMessage??'',showStatus:!!s.panelMessage,helpOpen:!!s.shopHelp,helpFocused:s.selected===buttons.length-2,merchantNod:s.shopReaction??0,
  products:adventurePowerShop.map((i,index)=>({key:`overworld-browse:${i.id}`,label:i.name.toUpperCase(),illustration:`cartoon/frames/item/${i.id}`,price:p.purchases[i.id]?'OWNED':`${i.price}`,showCoin:!p.purchases[i.id],large:i.id==='shoes',equipped:p.equippedPower===i.id,selected:i.id===item.id,focused:s.selected===index})),
  buttons:buttons.map((b,index)=>({...b,selected:index===s.selected})),
 };
}
export type AdventureShopModel=ReturnType<typeof adventureShopModel>;

/** Left/right browse the shelf; down moves straight to its transaction. */
export function shopFocusIndex(s:DesktopState,count:number,dx:number,dy:number):number {
 const product=Math.max(0,adventurePowerShop.findIndex(i=>i.id===s.shopItem));
 if(dx)return ((s.selected<4?s.selected:product)+dx+4)%4;
 if(dy>0)return s.selected<4?4:s.selected<count-1?s.selected+1:product;
 return s.selected<4?count-1:s.selected===4?product:s.selected-1;
}

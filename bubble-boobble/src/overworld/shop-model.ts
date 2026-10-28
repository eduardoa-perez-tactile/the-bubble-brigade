/** Shop decisions stay in the controller model, never in the view. */
import type {DesktopState} from '../desktop/documents';
import type {DesktopSave} from '../desktop/save';
import {adventureForProfile,adventurePowerShop} from './progression';
import type {OverworldChoice} from './model';

export function adventureShopModel(s:DesktopState,save:DesktopSave,viewport={width:1280,height:720}) {
 const p=adventureForProfile(save.profiles[save.active]!);
 const item=adventurePowerShop.find(i=>i.id===s.shopItem)??adventurePowerShop[0];
 const powers=adventurePowerShop.filter(i=>p.purchases[i.id]);
 const owned=!!p.purchases[item.id],affordable=p.coins>=item.price;
 const actionKey=`overworld-buy:${item.id}`;
 const actionEnabled=!owned&&affordable;
 const actionLabel=owned?'OWNED':affordable?`BUY · ${item.price}`:`NEED ${item.price-p.coins} MORE COINS`;
 const buttons:OverworldChoice[]=[...adventurePowerShop.map(i=>({key:`overworld-browse:${i.id}`,label:i.name})),{key:actionKey,label:actionLabel},{key:'overworld-shop-help',label:'HELP'},{key:'overworld-back',label:'BACK TO MAP'}];
 return {
  layout:(viewport.width/viewport.height<.7?'portrait':viewport.width/viewport.height<1.2?'tablet':'landscape') as 'portrait'|'tablet'|'landscape',
  coins:`${p.coins}`,name:item.name.toUpperCase(),description:item.description,
  actionLabel,actionEnabled,actionUnavailable:!owned&&!affordable,showOwned:owned,
  actionKey,actionFocused:s.selected===4,backFocused:s.selected===6,
  consequence:owned?'Ready every encounter and retry.':'Combines with all your other powers.',
  stackLabel:powers.length?'STARTING POWERS':'NO POWERS YET',
  activePowers:powers.map(i=>({key:i.id,illustration:`cartoon/frames/item/${i.id}`})),
  ownerClip:save.settings.reducedEffects?'cartoon/shop/owner-open.clip2d.json':'cartoon/shop/owner-idle.clip2d.json',ownerHidden:false,
  status:s.panelMessage??'',showStatus:!!s.panelMessage,helpOpen:!!s.shopHelp,helpFocused:s.selected===5,merchantNod:s.shopReaction??0,
  products:adventurePowerShop.map((i,index)=>({key:`overworld-browse:${i.id}`,label:i.name.toUpperCase(),illustration:`cartoon/frames/item/${i.id}`,price:`${i.price}`,showCoin:!p.purchases[i.id],owned:!!p.purchases[i.id],large:i.id==='shoes',selected:i.id===item.id,focused:s.selected===index})),
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

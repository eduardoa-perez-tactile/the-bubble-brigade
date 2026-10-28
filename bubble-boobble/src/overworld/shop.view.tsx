import {defineView,Widget,Flipbook} from '@gameengine/ui';
import {adventureShopModel,type AdventureShopModel} from './shop-model';
import {initialDesktopState} from '../desktop/documents';
import {initialDesktopSave} from '../desktop/save';
import {initialAdventure,type AdventurePowerId} from './progression';

const sample=(coins:number,purchases:Record<string,true>={},equippedPower:AdventurePowerId|null=null)=>adventureShopModel({...initialDesktopState,shopItem:'pink_candy'},
 {...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:{...initialAdventure(),coins,purchases,equippedPower}}]});

export const AdventureShopView=defineView<AdventureShopModel>({
 name:'AdventureShop',blockInput:true,
 samples:{narrow:{...sample(35,{yellow_candy:true},'yellow_candy'),layout:'portrait'},browse:sample(35,{yellow_candy:true},'yellow_candy'),poor:sample(6),owned:sample(25,{pink_candy:true}),equipped:sample(25,{pink_candy:true},'pink_candy'),help:{...sample(35,{yellow_candy:true},'yellow_candy'),helpOpen:true},blink:{...sample(35,{yellow_candy:true},'yellow_candy'),ownerClip:'cartoon/shop/owner-closed.clip2d.json'},hidden:{...sample(35,{yellow_candy:true},'yellow_candy'),ownerHidden:true},purchased:{...sample(25,{pink_candy:true},'pink_candy'),status:'Pink Candy unlocked and equipped.',showStatus:true,merchantNod:1}},
 render:(model,{intent})=><Widget doc="adventure-shop" class="overworld-screen shop-screen" props={{
  layout:()=>model().layout,coins:()=>model().coins,name:()=>model().name,description:()=>model().description,
  consequence:()=>model().consequence,actionLabel:()=>model().actionLabel,
  actionEnabled:()=>model().actionEnabled,actionUnavailable:()=>model().actionUnavailable,
  equippedLabel:()=>model().equippedLabel,equippedArt:()=>model().equippedArt,hasEquipped:()=>model().hasEquipped,
  status:()=>model().status,showStatus:()=>model().showStatus,helpOpen:()=>model().helpOpen,helpFocused:()=>model().helpFocused,
  merchantNod:()=>model().merchantNod,ownerHidden:()=>model().ownerHidden,products:()=>model().products,backFocused:()=>model().backFocused,removeFocused:()=>model().removeFocused,
 }} codeAreas={{
  merchant:()=>Flipbook({id:'shop-owner',class:'shop-owner-flipbook',clip:()=>model().ownerClip}),
  action:()=>Widget({id:'shop-purchase',doc:'shop-paper-button',props:{label:()=>model().actionLabel,selected:()=>model().actionFocused},disabled:()=>!model().actionEnabled,onIntent:()=>intent(model().actionKey)}),
 }}
 onIntent={(_,e)=>intent(e.item??(e.path.at(-1)==='help'?'overworld-shop-help':e.path.at(-1)==='remove'?'overworld-equip:none':e.path.at(-1)==='back'?'overworld-back':e.path.at(-1)!))}/>,
});

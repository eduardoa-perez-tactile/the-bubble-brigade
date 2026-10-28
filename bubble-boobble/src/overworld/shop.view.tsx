import {defineView,Widget} from '@gameengine/ui';
import {adventureShopModel,type AdventureShopModel} from './shop-model';
import {initialDesktopState} from '../desktop/documents';
import {initialDesktopSave} from '../desktop/save';
import {initialAdventure,type AdventurePowerId} from './progression';

const sample=(coins:number,purchases:Record<string,true>={},equippedPower:AdventurePowerId|null=null)=>adventureShopModel({...initialDesktopState,shopItem:'pink_candy'},
 {...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:{...initialAdventure(),coins,purchases,equippedPower}}]});

export const AdventureShopView=defineView<AdventureShopModel>({
 name:'AdventureShop',blockInput:true,
 samples:{browse:sample(35,{yellow_candy:true},'yellow_candy'),poor:sample(6),owned:sample(25,{pink_candy:true}),equipped:sample(25,{pink_candy:true},'pink_candy')},
 render:(model,{intent})=><Widget doc="adventure-shop" class="overworld-screen shop-screen" props={{
  coins:()=>model().coins,name:()=>model().name,description:()=>model().description,benefit:()=>model().benefit,
  consequence:()=>model().consequence,illustration:()=>model().illustration,actionLabel:()=>model().actionLabel,
  actionEnabled:()=>model().actionEnabled,actionUnavailable:()=>model().actionUnavailable,balance:()=>model().balance,
  equippedLabel:()=>model().equippedLabel,equippedArt:()=>model().equippedArt,hasEquipped:()=>model().hasEquipped,
  status:()=>model().status,products:()=>model().products,backFocused:()=>model().backFocused,removeFocused:()=>model().removeFocused,
 }} codeAreas={{action:()=>Widget({id:'shop-purchase',doc:'shop-action',props:{label:()=>model().actionLabel,selected:()=>model().actionFocused},disabled:()=>!model().actionEnabled,onIntent:()=>intent(model().actionKey)})}}
 onIntent={(_,e)=>intent(e.item??(e.path.at(-1)==='remove'?'overworld-equip:none':e.path.at(-1)==='back'?'overworld-back':e.path.at(-1)!))}/>,
});

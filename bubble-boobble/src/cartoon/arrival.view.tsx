import {defineView,Screen,Widget} from '@gameengine/ui';
export interface CartoonArrivalModel {mode:string}
/** Billing card shown only while the deterministic launch cover is opaque. */
export const CartoonArrivalView=defineView<CartoonArrivalModel>({
 name:'CartoonArrival',layer:'overlay',blockInput:true,samples:{madness:{mode:'BUBBLE MADNESS / WAVE 01'},classic:{mode:'CLASSIC / ROUND 01'}},
 render:model=><Screen safeArea class="desktop-screen cartoon-arrival-screen"><Widget doc="cartoon-arrival" class="cartoon-arrival" props={{mode:()=>model().mode}}/></Screen>,
});

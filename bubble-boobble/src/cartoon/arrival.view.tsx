import {defineView,Screen,Widget} from '@gameengine/ui';
import type {CartoonArrivalModel} from './arrival-model';
export type {CartoonArrivalModel} from './arrival-model';
/** Billing card shown only while the deterministic launch cover is opaque. */
export const CartoonArrivalView=defineView<CartoonArrivalModel>({
 name:'CartoonArrival',layer:'overlay',blockInput:true,samples:{story:{title:'LANTERN LANDING',mode:'STORY MODE / EPISODE 01'},trial:{title:'LANTERN LANDING',mode:'MASTERY TRIAL / EPISODE 01'},madness:{title:'COURTYARD CAPER',mode:'WAVE SURVIVAL / WAVE 01'},classic:{title:'COURTYARD CAPER',mode:'CLASSIC / ROUND 01'}},
 render:model=><Screen safeArea class="desktop-screen cartoon-arrival-screen"><Widget id="arrival" doc="cartoon-arrival" class="cartoon-arrival" props={{title:()=>model().title,mode:()=>model().mode}}/></Screen>,
});

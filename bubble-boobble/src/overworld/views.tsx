import {defineView,Screen,Widget} from '@gameengine/ui';
import type {OverworldHudModel,EncounterCardModel,OverworldDialogueModel} from './model';
const hud:OverworldHudModel={district:'BRIGADE LANDING',progress:'0 / 5 LANDMARKS CLEARED',coins:'COINS  0',prompt:'',help:'WASD / ARROWS · WALK     ENTER / SPACE · INTERACT'};
export const OverworldHudView=defineView<OverworldHudModel>({
 name:'OverworldHUD',samples:{explore:hud,entrance:{...hud,prompt:'[ENTER] BUBBLE YARD'}},
 render:(model,{intent})=><Screen safeArea class="overworld-screen overworld-hud-screen"><Widget id="overworld-hud" doc="overworld-hud" class="overworld-hud" props={{district:()=>model().district,progress:()=>model().progress,coins:()=>model().coins,prompt:()=>model().prompt,help:()=>model().help}} onIntent={(_,e)=>intent(e.path.at(-1)!)}/></Screen>,
});
const card:EncounterCardModel={title:'Bubble Yard',subtitle:'BRIGADE LANDING · ENCOUNTER 01',description:'Clear the courtyard of troublesome creatures.',status:'READY TO EXPLORE',reward:'FIRST CLEAR · 10 COINS',locked:false,playLabel:'PLAY ENCOUNTER'};
export const OverworldEncounterView=defineView<EncounterCardModel>({
 name:'OverworldEncounter',dims:true,blockInput:true,samples:{ready:card,locked:{...card,locked:true,status:'CLEAR BUBBLE YARD OR BELLFLOWER MILL FIRST'}},
 render:(model,{intent})=><Screen safeArea class="overworld-screen"><Widget doc="overworld-encounter" class="overworld-card" props={{title:()=>model().title,subtitle:()=>model().subtitle,description:()=>model().description,status:()=>model().status,reward:()=>model().reward,locked:()=>model().locked,playLabel:()=>model().playLabel}} onIntent={(_,e)=>intent(e.path.at(-1)!)}/></Screen>,
});
export const OverworldDialogueView=defineView<OverworldDialogueModel>({
 name:'OverworldDialogue',dims:true,blockInput:true,samples:{guide:{speaker:'THE LANDING KEEPER',message:'Follow either path to find your first challenge. Each landmark has a story to tell.',detail:'Clear landmarks to open the road ahead.',buttons:[]},shop:{speaker:'THE TRAIL MERCHANT',message:'A little color for your next adventure.',detail:'Your purchases belong to this profile.',buttons:[{key:'green',label:'MOSS GREEN · OWNED'},{key:'blue',label:'SKY BLUE · 20 COINS'}]}},
 render:(model,{intent})=><Screen safeArea class="overworld-screen"><Widget doc="overworld-dialogue" class="overworld-card" props={{speaker:()=>model().speaker,message:()=>model().message,detail:()=>model().detail??'',buttons:()=>model().buttons??[]}} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/></Screen>,
});
/** Shared journal, travel, vendor and pause panel; every action is supplied by the controller. */
export const OverworldPanelView=defineView<import('./model').OverworldPanelModel>({
 name:'OverworldPanel',dims:true,blockInput:true,samples:{adventure:{title:'ADVENTURE',subtitle:'THE BUBBLE BRIGADE',body:'A new journey begins at Brigade Landing.',status:'YOUR PROGRESS IS SAVED PER PROFILE',buttons:[{key:'continue',label:'CONTINUE ADVENTURE',selected:true},{key:'arcade',label:'ARCADE MODES'},{key:'back',label:'BACK'}]}},
 render:(model,{intent})=><Screen safeArea class="overworld-screen"><Widget doc="overworld-dialogue" class="overworld-card" props={{speaker:()=>model().title,message:()=>model().body,detail:()=>[model().subtitle,model().status].filter(Boolean).join('\n'),buttons:()=>model().buttons,showBack:false}} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/></Screen>,
});

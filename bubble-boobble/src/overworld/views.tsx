import {defineView,Screen,Widget,createMemo} from '@gameengine/ui';
import type {OverworldHudModel,EncounterCardModel,OverworldDialogueModel} from './model';
import {encounterCardModel} from './encounter-model';
import {encounterById} from './content';
import {initialAdventure} from './progression';
const hud:OverworldHudModel={district:'BRIGADE LANDING',progress:'0 / 5 LANDMARKS CLEARED',coins:'COINS  0',prompt:'',help:'WASD / ARROWS · WALK     ENTER / SPACE · INTERACT'};
export const OverworldHudView=defineView<OverworldHudModel>({
 name:'OverworldHUD',samples:{explore:hud,entrance:{...hud,prompt:'[ENTER / A]  Visit Landing Lighthouse'}},
 render:(model,{intent})=>{
  // Retain the departing label while the document plays its short hide pose.
  let lastPrompt='';
  const prompt=createMemo(()=>{const next=model().prompt;if(next)lastPrompt=next;return lastPrompt;});
  return <Screen safeArea class="overworld-screen overworld-hud-screen"><Widget id="overworld-hud" doc="overworld-hud" class="overworld-hud" props={{district:()=>model().district,progress:()=>model().progress,coins:()=>model().coins,prompt,help:()=>model().help,showPrompt:()=>!!model().prompt}} onIntent={(_,e)=>intent(e.path.at(-1)!)}/></Screen>;
 },
});
const card:EncounterCardModel=encounterCardModel(encounterById('encounter-1')!,initialAdventure());
const twoActs:EncounterCardModel={...encounterCardModel(encounterById('encounter-5')!,{...initialAdventure(),cleared:{'encounter-3':{bestScore:1500,clears:1}}})};
// Keep modal documents at the view root: the stack owns their safe area, scrim and Enter/Exit poses.
export const OverworldEncounterView=defineView<EncounterCardModel>({
 name:'OverworldEncounter',dims:true,blockInput:true,samples:{
  ready:card,twoActs,threeActs:{...twoActs,title:'A Three-Act Encounter',actsLabel:'3 acts',enemiesLabel:'12 enemies',actSummary:'3 ACTS · 12 ENEMIES',actBreakdown:'Act 1: 3 · Act 2: 4 · Act 3: 5'},
  locked:encounterCardModel(encounterById('encounter-3')!,initialAdventure()),
  replay:encounterCardModel(encounterById('encounter-5')!,{...initialAdventure(),cleared:{'encounter-3':{bestScore:1500,clears:1},'encounter-5':{bestScore:3250,clears:2}},rewardClaims:{'encounter-5':true}}),
  trial:encounterCardModel(encounterById('trial-1')!,initialAdventure()),
  error:{...card,status:'MISSION COULD NOT LOAD. PLEASE TRY AGAIN.'},
 },
 render:(model,{intent})=><Widget id="overworld-encounter" doc="overworld-encounter" class="overworld-screen overworld-card mission-briefing" props={{objective:()=>model().objective,badge:()=>model().badge,actsLabel:()=>model().actsLabel,enemiesLabel:()=>model().enemiesLabel,hasStatus:()=>!!model().status,rewardAmount:()=>model().rewardAmount,rewardCaption:()=>model().rewardCaption,playSelected:()=>!model().locked&&(model().selected??0)===0,backSelected:()=>model().locked||(model().selected??0)===1,illustration:()=>model().illustration??'adventure/lighthouse',title:()=>model().title,subtitle:()=>model().subtitle,description:()=>model().description,actSummary:()=>model().actSummary,actBreakdown:()=>model().actBreakdown,status:()=>model().status,reward:()=>model().reward,locked:()=>model().locked,playLabel:()=>model().playLabel}} onIntent={(_,e)=>intent(e.path.at(-1)!)}/>,
});
export const OverworldDialogueView=defineView<OverworldDialogueModel>({
 name:'OverworldDialogue',dims:true,blockInput:true,samples:{guide:{speaker:'THE LANDING KEEPER',message:'Follow either path to find your first challenge. Each landmark has a story to tell.',detail:'Clear landmarks to open the road ahead.',buttons:[]},shop:{speaker:'THE TRAIL MERCHANT',message:'A little color for your next adventure.',detail:'Your purchases belong to this profile.',buttons:[{key:'green',label:'MOSS GREEN · OWNED'},{key:'blue',label:'SKY BLUE · 20 COINS'}]}},
 render:(model,{intent})=><Widget doc="overworld-dialogue" class="overworld-screen overworld-card" props={{speaker:()=>model().speaker,message:()=>model().message,detail:()=>model().detail??'',buttons:()=>model().buttons??[]}} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/>,
});
/** Shared journal, travel, vendor and pause panel; every action is supplied by the controller. */
export const OverworldPanelView=defineView<import('./model').OverworldPanelModel>({
 name:'OverworldPanel',dims:true,blockInput:true,samples:{pause:{presentation:'adventure-pause',title:'TAKE A BREATHER',subtitle:'BRIGADE LANDING',body:'3 / 25 encounters cleared',buttons:[{key:'back',label:'RESUME EXPLORING',selected:true},{key:'journal',label:'ADVENTURE JOURNAL'},{key:'settings',label:'OPTIONS'},{key:'menu',label:'MAIN MENU'}]},journal:{presentation:'adventure-journal',title:'ADVENTURE JOURNAL',subtitle:'3 / 25 CLEARED · 35 COINS',body:'CLEARED: Landing Lighthouse\nCLEARED: Tidepool Lookout\nCLEARED: Shell Market\nPENDING: Harbor Crossing\nPENDING: Captain’s Quay\n\nKEEPSAKES: None yet',status:'Clear all five local encounters to open the next district.',buttons:[{key:'claim',label:'CLAIM REWARD · 15 COINS',selected:true},{key:'back',label:'BACK TO MAP'}]},adventure:{title:'ADVENTURE',subtitle:'THE BUBBLE BRIGADE',body:'A new journey begins at Brigade Landing.',status:'YOUR PROGRESS IS SAVED PER PROFILE',buttons:[{key:'continue',label:'CONTINUE ADVENTURE',selected:true},{key:'arcade',label:'PARTY PLAY'},{key:'back',label:'BACK'}]}},
 render:(model,{intent})=><Widget doc={model().presentation??'adventure-dialogue'} class="overworld-screen overworld-card" props={{portrait:()=>model().portrait??(model().presentation==='adventure-shop'?'overworld-living/common/npc/vendor-0':'overworld-living/common/npc/guide-0'),speaker:()=>model().title,message:()=>model().body,detail:()=>[model().subtitle,model().status].filter(Boolean).join('\n'),buttons:()=>model().buttons,showBack:false}} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/>,
});

/** Read-only presentation contracts. Controllers own state and all decisions. */
import type {OverworldPoi} from './navigation';

/** Tell the player what confirming will open, as well as which control to use. */
export function overworldActionPrompt(poi:OverworldPoi|undefined):string {
 if(!poi||poi.kind==='guide')return '';
 const verb=poi.kind==='encounter'||poi.kind==='trial'?'Visit':poi.kind==='vendor'?'Shop at':poi.kind==='collectible'?'Collect':poi.kind==='shortcut'?'Explore':'Travel through';
 return `[ENTER / A]  ${verb} ${poi.label}`;
}

export interface OverworldHudModel {
 district:string; progress:string; coins:string; prompt:string; help:string;
}
export interface EncounterCardModel {
 title:string; subtitle:string; description:string; status:string; reward:string;
 actSummary:string;actBreakdown:string;
 selected?:number; illustration?:string; locked:boolean; playLabel:string;
}
export interface OverworldChoice {key:string;label:string;selected?:boolean;illustration?:string;detail?:string;showArt?:boolean}
export interface OverworldDialogueModel {
 speaker:string; message:string; detail?:string; buttons?:OverworldChoice[];
}
export interface OverworldPanelModel {
 title:string;subtitle:string;body:string;status?:string;buttons:OverworldChoice[];
 portrait?:string;
 presentation?:'adventure-pause'|'adventure-journal'|'adventure-shop'|'adventure-result'|'adventure-dialogue';
}

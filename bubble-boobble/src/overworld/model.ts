/** Read-only presentation contracts. Controllers own state and all decisions. */
export interface OverworldHudModel {
 district:string; progress:string; coins:string; prompt:string; help:string;
}
export interface EncounterCardModel {
 title:string; subtitle:string; description:string; status:string; reward:string;
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

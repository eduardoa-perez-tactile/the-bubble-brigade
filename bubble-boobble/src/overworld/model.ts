/** Read-only presentation contracts. Controllers own state and all decisions. */
export interface OverworldHudModel {
 district:string; progress:string; coins:string; prompt:string; help:string;
}
export interface EncounterCardModel {
 title:string; subtitle:string; description:string; status:string; reward:string;
 locked:boolean; playLabel:string;
}
export interface OverworldChoice {key:string;label:string;selected?:boolean}
export interface OverworldDialogueModel {
 speaker:string; message:string; detail?:string; buttons?:OverworldChoice[];
}
export interface OverworldPanelModel {
 title:string;subtitle:string;body:string;status?:string;buttons:OverworldChoice[];
}

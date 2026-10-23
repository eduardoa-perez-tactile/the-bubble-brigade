/** Authoritative shell documents, shared below shell and Adventure orchestration. */
import {defineDoc} from '@gameengine/runtime';
import type {DocHandle,DocValue} from '@gameengine/runtime';
import {defaultPartySlots,type DragonResult} from '../arcade/party-config';
import type {PartySlot,Level} from '../arcade/types';
import campaignData from '../../data/levels.json';
import {cloneLevel} from './editor.ts';
const campaign=campaignData as Level[];
export type PlayMode='solo'|'ai'|'human';
export type DesktopScreen='title'|'menu'|'profiles'|'new-profile'|'settings'|'scores'|'help'|'credits'|'editor'|'play'|'pause'|'result'|'party'|'modes'|'overworld'|'overworld-card'|'overworld-panel';
export interface DesktopState {cartoon?:boolean;resultDetails?:boolean;settingsReturn?:DesktopScreen;adventure?:boolean;adventureEncounter?:string;adventureAttempt?:string;adventureProfile?:number;overworldPanel?:string;panelMessage?:string;adventureTrial?:boolean;pauseClosing?:boolean;resumeStartedStep?:number;pauseConfirm?:"restart"|"leave"|"";gameplayInputArmed?:boolean;transitionHasTitle?:boolean;transitionAction?:string;transitionStartedStep?:number;transitionCommitted?:boolean;dragonResults?:DragonResult[];resultStartedStep?:number;resultReady?:boolean;developmentMenu?:boolean;partySlots:PartySlot[];partyRun:boolean;partyEditing:boolean;screen:DesktopScreen;confirmKeys:number;playMode:PlayMode;name:string;status:string;statusStartedStep:number;selected:number;custom:boolean;recorded:boolean;won:boolean;score:number;round:number;tool:number;template:number;painting:boolean;deleteHeldAt:number;level:Level;history:Level[]}
export const initialDesktopState:DesktopState={developmentMenu:false,partySlots:defaultPartySlots.slice(),partyRun:false,partyEditing:false,screen:'title',confirmKeys:0,playMode:'solo',name:'',status:'',statusStartedStep:-1,selected:0,custom:false,recorded:false,won:false,score:0,round:1,tool:0,template:0,painting:false,deleteHeldAt:-1,level:cloneLevel(campaign[0]!),history:[]};
export const desktopState=defineDoc('desktop-ui',initialDesktopState as unknown as DocValue) as unknown as DocHandle<DesktopState>;
export interface DesktopGameRequest {cartoon?:boolean;sequence:number;action:string;mode:PlayMode;players:number;level:number;customLevel:Level|null;partySlots?:PartySlot[];encounterId?:string;attemptId?:string;profileIndex?:number}
export const desktopGameRequest=defineDoc('desktop-game-request',{sequence:0,action:'',mode:'solo',players:1,level:1,customLevel:null} as DocValue) as unknown as DocHandle<DesktopGameRequest>;

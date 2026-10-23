/** Cartoon document variants keep the established models, selections and intents. */
import { createMemo, defineView, Screen, Widget, Particles, Sprite } from '@gameengine/ui';
import { desktopModel, type DesktopModel } from '../desktop/model.ts';
import { initialDesktopState } from '../desktop/state.ts';
import { initialDesktopSave } from '../desktop/save.ts';
const portrait=(skin:string)=>`cartoon/frames/dragon/${skin}/idle-0`;
export const CartoonShellView=defineView<DesktopModel>({name:'CartoonShell',samples:Object.fromEntries((['help','credits','pause','result'] as const).map(screen=>[screen,desktopModel({...initialDesktopState,screen},initialDesktopSave)])),render:(model,{intent})=><Screen safeArea class="desktop-screen"><Widget doc="cartoon-shell" id="desktop-shell" class={()=>`cartoon-shell cartoon-${model().page}`}  codeAreas={{confetti:()=>Particles({effect:'fx/team-victory.vfx.json',emitting:()=>model().celebrate,restart:()=>model().celebrate?1:0,seed:42,style:{width:'680px',height:'300px'}})}} props={{resultReady:()=>model().resultReady,resultHint:()=>model().resultHint,celebration:()=>model().celebrate?1:0,resultScore:()=>model().resultScore,resultStats:()=>model().resultStats,showResultStats:()=>model().showResultStats,page:()=>model().page as Exclude<DesktopModel['page'],'party'|'modes'>,title:()=>model().title,subtitle:()=>model().page==='credits'?'THE BUBBLE BRIGADE / ART AND TECHNOLOGY':model().subtitle,body:()=>model().body,status:()=>model().status,buttons:()=>model().buttons,keys:()=>model().keys,rows:()=>model().rows,logo:()=>model().logo}} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/></Screen>});
export const CartoonEditorView=defineView<DesktopModel>({name:'CartoonEditor',samples:{round1:desktopModel({...initialDesktopState,screen:'editor'},initialDesktopSave)},render:(model,{intent})=><Screen safeArea class="desktop-screen"><Widget doc="cartoon-editor" class="cartoon-editor" props={{enemyCount:()=>model().enemyCount,subtitle:()=>model().subtitle,status:()=>model().status,tools:()=>model().tools,copyLabel:()=>model().toolbar[1]?.label??"COPY ROUND 01",elementLabel:()=>model().footer[0]?.label??"BUBBLES: NONE",themeLabel:()=>model().footer[1]?.label??"TILE: 01",sel0:()=>model().selected===0,sel1:()=>model().selected===1,sel2:()=>model().selected===2,sel3:()=>model().selected===3,sel4:()=>model().selected===4,sel16:()=>model().selected===16,sel17:()=>model().selected===17,sel18:()=>model().selected===18,sel19:()=>model().selected===19,sel20:()=>model().selected===20,sel21:()=>model().selected===21}} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/></Screen>});

const accountSamples=Object.fromEntries((['profiles','scores','new-profile','settings'] as const).map(screen=>[screen,desktopModel({...initialDesktopState,screen,name:'BUB'},initialDesktopSave)]));
export const CartoonAccountView=defineView<DesktopModel>({
 name:'CartoonAccount',samples:accountSamples,
 render:(model,{intent})=>{
  const profiles=createMemo(()=>model().profiles.map(p=>({...p,avatar:portrait(p.avatar)})));
  const name=createMemo(()=>model().name+(model().frame%60<30?'_':''));
  return <Screen safeArea class={()=>`desktop-screen ${model().page==='settings'?'cartoon-options-screen':''}`}><Widget doc="cartoon-account" id="desktop-account" class={()=>`cartoon-account ${model().page==='settings'?'cartoon-account-settings':''}`}
   codeAreas={{settingsAvatar:()=>Sprite({src:()=>portrait(model().avatar),class:"cartoon-settings-portrait"})}} props={{page:()=>model().page as 'profiles'|'scores'|'new-profile'|'settings',title:()=>model().title,subtitle:()=>model().page==='credits'?'THE BUBBLE BRIGADE / ART AND TECHNOLOGY':model().subtitle,name,status:()=>model().status,showStatus:()=>!!model().status,statsName:()=>model().statsName,stats:()=>model().stats,profiles,scores:()=>model().scores,keyRows:()=>model().keyRows,optionRows:()=>model().buttons.map(b=>{const split=b.label.indexOf(':');return {...b,key:b.key==='menu'?'settings-back':b.key,label:split<0?b.label:b.label.slice(0,split),value:split<0?'':b.label.slice(split+1).trim(),adjustable:split>=0};}),
   backSelected:()=>model().page==='profiles'?model().selected===model().profileCount+1:model().selected===0,newSelected:()=>model().selected===model().profileCount,spaceSelected:()=>model().selected===36,deleteSelected:()=>model().selected===37,createSelected:()=>model().selected===38,cancelSelected:()=>model().selected===39}}
   onIntent={(_,e)=>{const key=e.item??e.path.at(-1)!;intent(key==='settings-back'?'menu':key);}}/></Screen>;
 },
});

export const CartoonPartyView=defineView<DesktopModel>({
 name:'CartoonParty',samples:{team:desktopModel({...initialDesktopState,screen:'party',selected:0},initialDesktopSave)},
 render:(model,{intent})=><Screen safeArea class="desktop-screen"><Widget doc="cartoon-party" id="party-lobby" class="cartoon-party"
 props={{heading:()=>model().buttons[10]?.label==='RESUME SURVIVAL'?'YOUR DRAGON TEAM':'CHOOSE YOUR DRAGONS',status:()=>model().status,
 mode0:()=>model().partyModes[0]??'OPEN SLOT',sel0:()=>model().selected===0,
 mode1:()=>model().partyModes[1]??'OPEN SLOT',sel1:()=>model().selected===1,
 mode2:()=>model().partyModes[2]??'OPEN SLOT',sel2:()=>model().selected===2,
 mode3:()=>model().partyModes[3]??'OPEN SLOT',sel3:()=>model().selected===3,
 mode4:()=>model().partyModes[4]??'OPEN SLOT',sel4:()=>model().selected===4,
 mode5:()=>model().partyModes[5]??'OPEN SLOT',sel5:()=>model().selected===5,
 mode6:()=>model().partyModes[6]??'OPEN SLOT',sel6:()=>model().selected===6,
 mode7:()=>model().partyModes[7]??'OPEN SLOT',sel7:()=>model().selected===7,
 mode8:()=>model().partyModes[8]??'OPEN SLOT',sel8:()=>model().selected===8,
 mode9:()=>model().partyModes[9]??'OPEN SLOT',sel9:()=>model().selected===9,
 startSelected:()=>model().selected===10,backSelected:()=>model().selected===11,startLabel:()=>model().buttons[10]?.label??'START SURVIVAL'}}
 onIntent={(_,e)=>{const key=e.path.at(-1)!;intent(key.startsWith('dragon-')?`party-slot:${key.slice(7)}`:key);}}/></Screen>,
});

export const CartoonModeView=defineView<DesktopModel>({name:'CartoonModes',samples:{classic:desktopModel({...initialDesktopState,screen:'modes',selected:0},initialDesktopSave),madness:desktopModel({...initialDesktopState,screen:'modes',selected:1},initialDesktopSave)},render:(model,{intent})=><Screen safeArea class="desktop-screen cartoon-mode-screen"><Widget doc="cartoon-modes" id="mode-select" class="cartoon-modes" props={{classicSelected:()=>model().selected===0,madnessSelected:()=>model().selected===1,backSelected:()=>model().selected===2}} onIntent={(_,e)=>intent(e.path.at(-1)!)}/></Screen>});

const resultSample=(won:boolean,count=10)=>desktopModel({...initialDesktopState,screen:'result',partyRun:true,won,score:58200,round:10,resultReady:true,dragonResults:Array.from({length:count},(_,slot)=>({slot,kills:30-slot*3}))},initialDesktopSave);
export const CartoonResultsView=defineView<DesktopModel>({
 name:'CartoonResults',samples:{victory:resultSample(true),sixDragons:resultSample(true,6),soloDragon:resultSample(true,1),twoDragons:resultSample(true,2),classic:desktopModel({...initialDesktopState,screen:'result',won:true,resultReady:true},initialDesktopSave)},
 render:(model,{intent})=><Screen safeArea class="desktop-screen cartoon-results-screen"><Widget doc="cartoon-results" id="run-results" class="cartoon-results"
 props={{eyebrow:()=>model().resultParty?'BRIGADE SURVIVAL / TEAM RESULTS':model().resultEyebrow,title:()=>model().resultParty?'BRIGADE VICTORY!':model().resultTitle,subtitle:()=>model().resultSubtitle,score:()=>model().resultScore,champion:()=>model().resultChampion,stats:()=>model().resultStats,hint:()=>model().resultHint,won:()=>model().resultWon,party:()=>model().resultParty,moreRanks:()=>model().resultList.length>0,ready:()=>model().resultReady,showStats:()=>model().showResultStats,ranking:()=>model().resultList.map(r=>({...r,image:portrait(r.color)})),podium:()=>model().podium.map(p=>({...p,image:portrait(p.image.split('/').at(-1)??'green')})),buttons:()=>model().buttons}}
 codeAreas={{confetti:()=>Particles({effect:'fx/team-victory.vfx.json',emitting:()=>model().celebrate,restart:()=>model().celebrate?1:0,seed:42,style:{width:'672px',height:'193px'}})}}
 onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/></Screen>,
});

import type {DesktopModel} from '../desktop/model';

/** Presentation-only adapter: every displayed number comes from the completed run. */
export function victoryPresentation(model:DesktopModel){
 const round=model.resultProgressLabel.match(/^(WAVE|ROUND) (\d+) \/ (\d+)/);
 const score=model.resultScore.replace(/^SCORE\s+/,''),top=model.ranking[0];
 const tied=!!top&&model.ranking.filter(r=>r.kills===top.kills).length>1;
 const metrics=model.resultParty?[
  {key:'score',label:'TEAM SCORE',value:score},
  {key:'round',label:'WAVES CLEARED',value:round?`${round[2]} / ${round[3]}`:'COMPLETE'},
  {key:'kills',label:'TEAM KOs',value:String(model.ranking.reduce((sum,r)=>sum+Number(r.kills),0))},
  {key:'leader',label:tied?'LEADING KOs':'TOP DRAGON',value:top?(tied?top.kills:`${top.name} / ${top.kills}`):'THE BRIGADE'},
 ]:[
  {key:'score',label:'SCORE',value:score},
  {key:'round',label:round?'ROUNDS CLEARED':'CUSTOM ROUND',value:round?`${round[2]} / ${round[3]}`:'COMPLETE'},
  {key:'player',label:'PLAYER',value:model.statsName.split(' / ')[0]??'BUB'},
  {key:'best',label:'PERSONAL BEST',value:model.resultStats.match(/BEST (\d+)/)?.[1]??score},
 ];
 return {
  eyebrow:model.resultParty?'BUBBLE MADNESS / FINAL BOSS DEFEATED':round?'A BRIGADE ADVENTURE / RUN COMPLETE':'CUSTOM ROUND / PLAY TEST COMPLETE',
  heroCaption:'THE BUBBLE BRIGADE',outcome:model.resultParty?'BRIGADE VICTORY!':round?'ADVENTURE COMPLETE!':'ROUND COMPLETE!',
  detailHeading:model.resultParty?'TEAM RANKING / KNOCKOUTS':'YOUR ADVENTURE',metrics,
  ranking:model.resultParty?model.ranking.map(r=>({key:r.key,rank:r.rank,name:r.name,mode:r.mode,kills:r.kills})):
   metrics.map(r=>({key:r.key,rank:'',name:r.label,mode:'',kills:r.value})),
 };
}

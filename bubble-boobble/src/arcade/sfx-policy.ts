import {ActorSize,type GameState} from './types';

export const brigadeSfxBank='audio/brigade/sfx/core.bank';
export interface BrigadeSound {sound:string;volume:number;priority:number;pitch:number;maxVoices:number}
const routes:Readonly<Record<string,readonly [string,number,number,number]>>={
 shoot:['bubble-shot',.48,10,3],pop:['bubble-pop',.5,30,2],jump:['jump',.3,20,3],
 death:['player-downed',.7,100,2],food:['food-pickup',.35,40,3],item:['power-up',.65,60,2],
 fire:['fire',.5,30,2],water:['water',.45,25,2],laser:['thunder',.45,35,2],
 explosion:['explosion',.7,75,2],rescue:['rescue',.7,90,2],'boss-capture':['boss-capture',.8,95,2],
};
export function brigadeTokenSound(token:string,tick:number,pops=0):BrigadeSound|null{
 const route=routes[token];if(!route)return null;
 const [name,volume,priority,maxVoices]=route;
 const pitch=token==='shoot'?1+(tick%5)*.025:token==='pop'?1+Math.min(6,pops)*.045:1;
 return {sound:`audio/brigade/sfx/${name}`,volume,priority,pitch,maxVoices};
}
/** A fresh boost is applied after movement, so its JumpStep is still zero. */
export function brigadeBubbleBounceCount(g:GameState):number{
 return g.Players.filter(p=>!p.Ground&&!p.Downed&&p.Dead===0&&p.VY<0&&p.JumpStep===0&&
  g.Bubbles.some(b=>!b.Removed&&b.Age>20&&!(g.Party&&b.ThunderShot)&&
   Math.abs(p.Y+ActorSize-b.Y)<.001&&p.X+ActorSize>b.X+4&&p.X<b.X+36)).length;
}
/** One bounded voice per token family per step, independent of team size. */
export function brigadeStepSounds(g:GameState):BrigadeSound[]{
 const result:BrigadeSound[]=[],seen=new Set<string>();
 const pops=g.Particles.filter(p=>!p.Text&&p.Life===14).length;
 const jumps=g.Sounds.filter(token=>token==='jump').length;
 for(const token of g.Sounds){
  if(seen.has(token))continue;seen.add(token);
  // Presentation owns the distinct bounce cue; do not layer a generic jump.
  if(token==='jump'&&jumps<=brigadeBubbleBounceCount(g))continue;
  const cue=brigadeTokenSound(token,g.Tick,pops);if(cue)result.push(cue);
 }
 if(g.Bubbles.some(b=>b.EnemyID&&b.CapturedAge===1))result.push({sound:'audio/brigade/sfx/capture',volume:.55,priority:50,pitch:1,maxVoices:2});
 return result;
}

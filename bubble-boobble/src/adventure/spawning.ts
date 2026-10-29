import {blocked,solid} from '../arcade/physics';
import {ADVENTURE_ACT_READY_STEPS,ADVENTURE_ACT_ACTION_STEPS} from './timing';
import {ActorSize,EnemyState,State,Tile,alive,arenaColumns,arenaRows,type Enemy,type GameState} from '../arcade/types';

// Match the drawn cartoon silhouettes, rather than only the 44px hitboxes.
export const adventureSpawnWidth=136,adventureSpawnHeight=116;
export const adventureSpawnDescent=48,adventureSpawnStagger=4,adventureSpawnSettle=12;
export const adventureSpawnOpeningCue=60;
/** Drawing only: simulation bodies reserve their destinations throughout preparation. */
export function adventureArrivalY(e:Enemy):number {
 const progress=1-Math.min(adventureSpawnDescent,Math.max(0,e.SpawnTicks??0))/adventureSpawnDescent;
 return -120+(e.Y+120)*(1-(1-progress)*(1-progress));
}
interface Spot {X:number;Y:number;Ground?:boolean}
const overlaps=(a:Spot,b:Spot,width=adventureSpawnWidth,height=adventureSpawnHeight)=>
 Math.abs(a.X-b.X)<width&&Math.abs(a.Y-b.Y)<height;
const flying=(e:Enemy)=>e.Kind==='monsta'||e.Kind==='pulpul';
function supported(g:GameState,p:Spot):boolean {
 const row=(p.Y+ActorSize)/Tile;
 if(!Number.isInteger(row))return false;
 for(let col=Math.floor(p.X/Tile);col<=Math.floor((p.X+ActorSize-.01)/Tile);col++)
  if(!solid(g,col,row))return false;
 return true;
}
export function adventureSpawnSafe(g:GameState,e:Enemy):boolean {
 return !blocked(g,e.X,e.Y,ActorSize)
  && !g.Players.some(p=>alive(p)&&overlaps(e,p,148,140))
  && !g.Enemies.some(other=>other!==e&&other.State!==EnemyState.Defeated&&overlaps(e,other));
}
/** Built once at an act boundary while player and combat are held still. */
function candidates(g:GameState):Spot[] {
 const spots:Spot[]=[];
 for(let row=5;row<arenaRows(g);row++)for(let x=2*Tile+2;x+ActorSize<=(arenaColumns(g)-2)*Tile;x+=Tile/2){
  const p:Spot={X:x,Y:row*Tile-ActorSize};
  if(blocked(g,p.X,p.Y,ActorSize)||g.Players.some(player=>alive(player)&&overlaps(p,player,148,140)))continue;
  p.Ground=supported(g,p);spots.push(p);
 }
 return spots;
}
function choose(g:GameState,e:Enemy,spots:readonly Spot[]):Spot|undefined {
 let best:Spot|undefined,distance=Infinity;
 for(const p of spots){
  if(p.Ground===flying(e))continue;
  const score=Math.abs(p.X-e.X)+Math.abs(p.Y-e.Y);
  if(score>=distance||g.Enemies.some(other=>other!==e&&other.State!==EnemyState.Defeated&&overlaps(p,other)))continue;
  best=p;distance=score;
 }
 return best;
}
/** Reserve safe destinations, then bring the whole cast down before combat begins. */
export function stageAdventureEnemies(g:GameState,enemies:Enemy[],opening:boolean):void {
 const spots=candidates(g);
 // Unplaced members must not reserve their old, potentially duplicated anchors.
 for(const e of enemies)e.State=EnemyState.Defeated;
 for(const air of [false,true])for(const e of enemies){
  if(flying(e)!==air)continue;
  const spot=choose(g,e,spots);
  if(!spot)throw new Error(`No safe Adventure spawn for ${e.Kind}`);
  Object.assign(e,spot,{State:EnemyState.Spawning,SpawnTicks:adventureSpawnDescent+enemies.indexOf(e)*adventureSpawnStagger});
 }
 g.State=State.Ready;
 const arrivalSteps=adventureSpawnDescent+Math.max(0,enemies.length-1)*adventureSpawnStagger+adventureSpawnSettle;
 g.Countdown=opening?arrivalSteps+adventureSpawnOpeningCue:Math.max(arrivalSteps,ADVENTURE_ACT_READY_STEPS)+ADVENTURE_ACT_ACTION_STEPS;
 g.EpisodeReadyTicks=g.Countdown;
 g.Projectiles=[];
}
/** All arrivals settle first and activate together at the end of preparation. */
export function stepAdventureSpawns(g:GameState):void {
 const arriving=g.Enemies.filter(e=>e.State===EnemyState.Spawning);
 for(const e of arriving)e.SpawnTicks=Math.max(0,(e.SpawnTicks??0)-1);
 if(g.Countdown>1||arriving.some(e=>(e.SpawnTicks??0)>0))return;
 for(const e of arriving){
  e.State=EnemyState.Active;e.Age=0;delete e.SpawnTicks;
 }
}

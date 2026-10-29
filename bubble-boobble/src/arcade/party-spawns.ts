import { blocked, solid } from './physics';
import { partySpawn } from './party-config';
import { ActorSize, EnemyState, Tile, arenaColumns, arenaRows, position, type GameState } from './types';

interface Spot { X:number; Y:number }
export interface EnemySpawn extends Spot { Ground:boolean }
export const isFlyingEnemy = (kind:string) => kind==='monsta'||kind==='pulpul';
const overlaps=(a:Spot,b:Spot,gap:number)=>Math.abs(a.X-b.X)<ActorSize+gap&&Math.abs(a.Y-b.Y)<ActorSize+gap;
function supported(g:GameState,p:Spot):boolean {
 const feet=p.Y+ActorSize;
 if(feet%Tile!==0)return false;
 for(let col=Math.floor(p.X/Tile);col<=Math.floor((p.X+ActorSize-.01)/Tile);col++)
  if(!solid(g,col,feet/Tile))return false;
 return true;
}
/** Only runs when constructing a wave: reserve real footing before allocating flyers. */
export function partyEnemyFormation(g:GameState,kinds:readonly string[]):EnemySpawn[] {
 if(g.Level.arena==='cartoon-courtyard')return cartoonEnemyFormation(g,kinds,[],false);
 const protectedSpots:Spot[]=g.Players.filter(p=>p.Lives>0||p.Downed).map(p=>({X:p.X,Y:p.Y}));
 g.Party!.Slots.forEach((slot,index)=>{
  if(slot==='empty')return;
  const [X,Y]=position(partySpawn(index,g.Players.length,g.Level),ActorSize,g.Level);protectedSpots.push({X,Y});
 });
 const clear=(p:Spot)=>!blocked(g,p.X,p.Y,ActorSize)&&!protectedSpots.some(other=>overlaps(p,other,8));
 const ground:Spot[]=[];
 for(let row=4;row<arenaRows(g);row++)for(let x=2*Tile+2;x+ActorSize<=(arenaColumns(g)-2)*Tile;x+=Tile/2){
  const p={X:x,Y:row*Tile-ActorSize};
  if(supported(g,p)&&clear(p))ground.push(p);
 }
 // Preserve the formation's broad spread and alternating direction as preferred anchors.
 const courtyard:Spot[]=[];
 if(g.Players.length>6)for(const row of [9,14,19,22])for(let col=3;col<=arenaColumns(g)-5;col+=4){
  const p={X:col*Tile,Y:row*Tile-ActorSize};if(!blocked(g,p.X,p.Y,ActorSize))courtyard.push(p);
 }
 const columns=[0,7,3,4,1,6,2,5],rows=[20,10,15,5];
 const preferred=(index:number):Spot=>{
  if(courtyard.length){const offset=index*7%courtyard.length;return courtyard[g.Party!.Wave%2?offset:courtyard.length-1-offset]!;}
  const column=columns[Math.floor(index/rows.length)]!;
  return {X:(8+(g.Party!.Wave%2?column:7-column)*2)*Tile,Y:rows[index%rows.length]!*Tile-ActorSize};
 };
 const placed:(EnemySpawn|undefined)[]=Array(kinds.length);
 let air:Spot[]|undefined;
 const choose=(pool:Spot[],target:Spot):Spot|undefined=>{
  let best:Spot|undefined,distance=Infinity;
  for(const p of pool){
   const score=Math.abs(p.X-target.X)+Math.abs(p.Y-target.Y);
   if(score>=distance||placed.some(other=>other&&overlaps(p,other,4)))continue;
   best=p;distance=score;
  }
  return best;
 };
 for(const flying of [false,true])for(let i=0;i<kinds.length;i++){
  if(isFlyingEnemy(kinds[i]!)!==flying)continue;
  const target=preferred(i);
  let spot=choose(ground,target);
  if(!spot&&flying){
   if(!air){
    air=[];
    for(let row=4;row<arenaRows(g);row+=2)for(let col=2;col<arenaColumns(g)-3;col+=2){
     const p={X:col*Tile+2,Y:row*Tile-ActorSize};if(clear(p))air.push(p);
    }
   }
   spot=choose(air,target);
  }
  if(!spot)throw new Error(`No safe ${flying?'flying':'grounded'} spawn for ${kinds[i]}`);
  placed[i]={...spot,Ground:supported(g,spot)};
 }
 return placed as EnemySpawn[];
}

// Authored spawn envelopes cover the cartoon silhouettes; collision stays 44px.
// Their vertical reserve also clears adjacent projected platform tiers.
export const cartoonSpawnWidth=136,cartoonSpawnHeight=116;
const spawnOverlap=(a:Spot,b:Spot,width=cartoonSpawnWidth,height=cartoonSpawnHeight)=>
 Math.abs(a.X-b.X)<width&&Math.abs(a.Y-b.Y)<height;
function protectedCartoonSpots(g:GameState):Spot[]{
 const spots:Spot[]=g.Players.filter(p=>p.Lives>0||p.Downed).map(p=>({X:p.X,Y:p.Y}));
 g.Party!.Slots.forEach((slot,index)=>{
  if(slot==='empty')return;
  const [X,Y]=position(partySpawn(index,g.Players.length,g.Level),ActorSize,g.Level);spots.push({X,Y});
 });
 return spots;
}
/** Recheck the warning location before materializing a reinforcement. */
export function partySpawnSafe(g:GameState,spot:Spot,reserved:readonly Spot[]=[]):boolean{
 return !blocked(g,spot.X,spot.Y,ActorSize)&&
  !protectedCartoonSpots(g).some(p=>spawnOverlap(spot,p,148,140))&&
  !g.Enemies.some(e=>e.State!==EnemyState.Defeated&&spawnOverlap(spot,e))&&
  !reserved.some(p=>spawnOverlap(spot,p));
}
/** Runtime callers may have no free location while players crowd the board. */
export function partyEnemyReinforcement(g:GameState,kind:string,reserved:readonly Spot[]):EnemySpawn|undefined{
 return cartoonEnemyFormation(g,[kind],reserved,true)[0];
}
function cartoonEnemyFormation(g:GameState,kinds:readonly string[],reserved:readonly Spot[],optional:boolean):EnemySpawn[]{
 const occupied:Spot[]=[...reserved,...g.Enemies.filter(e=>e.State!==EnemyState.Defeated)];
 const right=(arenaColumns(g)-2)*Tile-ActorSize;
 const candidates=(protectedSpots:readonly Spot[],width:number,height:number)=>{
  const ground:Spot[]=[],air:Spot[]=[];
  for(let row=2;row<arenaRows(g);row++)for(let x=2*Tile+2;x<=right;x+=Tile/2){
   const p={X:x,Y:row*Tile-ActorSize};
   if(blocked(g,p.X,p.Y,ActorSize)||protectedSpots.some(other=>spawnOverlap(p,other,width,height))||
    occupied.some(other=>spawnOverlap(p,other)))continue;
   (supported(g,p)?ground:air).push(p);
  }
  return {ground,air};
 };
 const place=(pools:{ground:Spot[];air:Spot[]},compact=false,reverse=false,bottom=false):EnemySpawn[]|undefined=>{
  const placed:(EnemySpawn|undefined)[]=Array(kinds.length),tiers=[3,8,13,18,22];
  if(compact)for(const pool of [pools.ground,pools.air])
   pool.sort((a,b)=>(bottom?b.Y-a.Y:a.Y-b.Y)||(reverse?b.X-a.X:a.X-b.X));
  // Walkers reserve the scarce fully supported feet before flyers use the air.
  for(const flying of [false,true])for(let index=0;index<kinds.length;index++){
   if(isFlyingEnemy(kinds[index]!)!==flying)continue;
   const fraction=(index*7%17)/16;
   const target={X:2*Tile+(g.Party!.Wave%2?fraction:1-fraction)*(right-2*Tile),
    Y:tiers[index%tiers.length]!*Tile-ActorSize-(flying?60:0)};
   let best:Spot|undefined,distance=Infinity;
   for(const spot of flying?pools.air:pools.ground){
    const score=compact?0:Math.abs(spot.X-target.X)+Math.abs(spot.Y-target.Y);
    if(score>=distance||placed.some(p=>p&&spawnOverlap(spot,p)))continue;
    best=spot;distance=score;
    if(compact)break;
   }
   if(!best)return undefined;
   placed[index]={...best,Ground:!flying};
  }
  return placed as EnemySpawn[];
 };
 // Small formations keep the broad spread and generous player silhouette gap.
 const generous=place(candidates(protectedCartoonSpots(g),148,140));
 if(generous)return generous;
 if(optional)return [];
 // A full late wave cannot reserve every former player spawn as well as every
 // large enemy silhouette. Compact rows retain the complete cast and its art
 // envelopes, with a real body +8px gap around each dragon's current position.
 // These targets stay fixed while dragons move through the protected arrival.
 const dragons=g.Players.filter(p=>p.Lives>0||p.Downed);
 const compact=candidates(dragons,ActorSize+8,ActorSize+8);
 for(const bottom of [false,true])for(const reverse of [g.Party!.Wave%2===0,g.Party!.Wave%2!==0]){
  const result=place(compact,true,reverse,bottom);
  if(result)return result;
 }
 throw new Error(`No clear cartoon formation for all ${kinds.length} enemies`);
}

import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame,partyWaveBudget} from '../src/arcade/party';
import {partyEnemyFormation,cartoonSpawnWidth,cartoonSpawnHeight,isFlyingEnemy} from '../src/arcade/party-spawns';
import {blocked,solid} from '../src/arcade/physics';
import {ActorSize,Tile,type PartySlot,type GameState} from '../src/arcade/types';
const scene='scenes/cartoon.scene.json';
const kinds=['zenchan','monsta','banebou','mighta','pulpul','invader'];
const waveKinds=(wave:number,count:number)=>Array.from({length:count},(_,i)=>kinds[(i+wave-1)%Math.min(kinds.length,wave+1)]!);
function assertFormation(g:GameState,cast:readonly string[]){
 const formation=partyEnemyFormation(g,cast);
 expect(formation.length).toBe(cast.length);
 expect(partyEnemyFormation(g,cast)).toEqual(formation);
 for(let i=0;i<formation.length;i++){
  const p=formation[i]!;
  expect(blocked(g,p.X,p.Y,ActorSize)).toBe(false);
  expect(p.Ground).toBe(!isFlyingEnemy(cast[i]!));
  if(p.Ground){
   const feet=p.Y+ActorSize;
   expect(feet%Tile).toBe(0);
   for(let col=Math.floor(p.X/Tile);col<=Math.floor((p.X+ActorSize-.01)/Tile);col++)
    expect(solid(g,col,feet/Tile)).toBe(true);
  }
  for(let j=i+1;j<formation.length;j++){
   const other=formation[j]!;
   expect(Math.abs(p.X-other.X)<cartoonSpawnWidth&&Math.abs(p.Y-other.Y)<cartoonSpawnHeight).toBe(false);
  }
  for(const dragon of g.Players)if(dragon.Lives>0||dragon.Downed)
   expect(Math.abs(p.X-dragon.X)<ActorSize+8&&Math.abs(p.Y-dragon.Y)<ActorSize+8).toBe(false);
 }
}
worldTest('party arrival formation fits every complete cartoon wave for all six and ten slot team sizes',()=>{
 for(const team of [6,10])for(let active=1;active<=team;active++){
  const slots:PartySlot[]=Array.from({length:team},(_,i)=>i<active?'human':'empty');
  const g=createPartyGame(campaign,42,slots,10,'cartoon');g.Enemies=[];
  for(let wave=1;wave<=9;wave++){
   g.Party!.Wave=wave;
   assertFormation(g,waveKinds(wave,partyWaveBudget(wave,active)));
  }
 }
},{scene});
worldTest('party arrival formation reserves all32 destinations when dragons crowd one side or the center',()=>{
 for(const location of ['left','center','original']){
  const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');g.Enemies=[];g.Party!.Wave=9;
  for(let i=0;i<g.Players.length;i++)if(location!=='original'){
   const dragon=g.Players[i]!;
   Object.assign(dragon,location==='left'?{X:50,Y:i*48}:{X:720+i%5*54,Y:148+Math.floor(i/5)*120});
  }
  assertFormation(g,waveKinds(9,32));
 }
},{scene});

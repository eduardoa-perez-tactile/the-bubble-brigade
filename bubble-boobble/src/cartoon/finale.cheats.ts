import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {createBoss,captureBoss} from '../arcade/boss';
import {bubble,effect} from '../arcade/bubbles';
import {item} from '../arcade/items';
import {body,State} from '../arcade/types';
export const BossFinaleShowcase=defineCheat({
 id:'cartoon.boss-finale',group:'Concept verification',title:'Boss mechanic and finale presentation',
 params:{beat:{type:'string',default:'canisters'}},resources:[write(ArcadeControl)],
 run(ctx,{beat}){
  const s=session.get();if(!s.game?.Party)return;const g=copyGame(s.game);
  g.Party!.Boss=createBoss(g.Players.length,g.Level);const b=g.Party!.Boss!;
  Object.assign(b,{X:750,Y:390,Tick:300,Timer:100});
  g.Party!.Phase='boss';g.Party!.Wave=10;g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];
  g.State=State.Playing;g.Freeze=10000;g.LevelTicks=300;g.Enemies=[];g.Bubbles=[];g.Projectiles=[];g.Effects=[];g.Particles=[];g.Items=[];
  for(let i=0;i<g.Players.length;i++){const p=g.Players[i]!;Object.assign(p,{X:120+i*135,Y:484,VY:0,Ground:true,Invincible:10000,Lives:1,Downed:false,Dead:0,Shoot:0});p.Power.Thunder=beat!=='canisters';}
  if(beat==='canisters')g.Items=[180,500,1200].map(x=>({...item(x,484),Power:'thunder_potion',Stationary:true}));
  if(beat==='lightning'){
   g.Bubbles=[300,500,1100].map((x,i)=>({...bubble(x,330),ID:100+i,Shooter:i,Age:30,Floating:true,Element:'thunder',ThunderShot:true}));
   g.Effects=[{...effect(620,410),Element:'thunder',Dir:1,Age:0,Life:90}];
   g.Projectiles=[-1,0,1].map((slope)=>({...body(1000,240+slope*90),VX:3.8,VY:slope*2.56,Bottle:true,Laser:false,Age:12,Removed:false}));
  }
  if(beat==='captured'||beat==='victory'){captureBoss(g);b.Timer=30;}
  if(beat==='victory'){b.Mode='defeated';b.Timer=60;}
  session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
 },
});

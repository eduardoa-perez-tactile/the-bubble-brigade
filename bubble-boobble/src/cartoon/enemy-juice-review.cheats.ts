import {defineCheat} from '@gameengine/runtime/cheats';
import {read,write,Time} from '@gameengine/runtime';
import {ArcadeControl,ArcadeFeel} from '../schema.gen';
import campaign from '../../data/levels.json';
import {createPartyGame,preparePartyWave} from '../arcade/party';
import {body,EnemyState,State} from '../arcade/types';
import {advanceFeel,emptyFeel,packFeel} from '../arcade/juice';
import {desktopAction,desktopGameRequest} from '../desktop/state';
import {session} from '../arcade/session';

/** Fixed-age presentation samples. Live behavior is checked with enemy-showcase;
 * this separate cheat makes contact/rebound and both muzzle directions reviewable. */
export const EnemyJuiceReview=defineCheat({
 id:'cartoon.enemy-juice-review',group:'Concept verification',title:'Enemy motion anger and shot presentation samples',
 params:{stage:{type:'enum',values:['jump','fall','land','charge','release','flight','rage'],default:'land'},
  age:{type:'int',min:0,max:60,default:0}},
 resources:[write(ArcadeControl),read(Time)],
 run(ctx,{stage,age}){
  const g=createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon');
  g.Party!.Wave=9;preparePartyWave(g);
  Object.assign(g.Party!,{Phase:'combat',Timer:0,ToSpawn:0,Telegraphs:[]});
  g.Countdown=0;g.State=State.Playing;g.LevelTicks=121;g.Freeze=10000;
  g.Items=[];g.Effects=[];g.Bubbles=[];g.Projectiles=[];g.Particles=[];
  for(const p of g.Players){p.X=-10000;p.Y=10000;p.Invincible=100000;}
  const template=g.Enemies[0]!;
  const kinds=stage==='charge'||stage==='release'||stage==='flight'
   ?['mighta','mighta','invader']:['zenchan','mighta','banebou','invader'];
  g.Enemies=kinds.map((Kind,i)=>({...template,...body(320+i*340,484),Kind,ID:++g.NextID,
   State:EnemyState.Active,Dir:i%2?-1:1,Ground:true,Age:age,Angry:false,Cooldown:120,Shoot:0}));
  for(const e of g.Enemies){
   // Downward attacks must clear their support shelf, just as in the live
   // shooter showcase; the bottom floor would hide the nozzle and flash.
   if(e.Kind==='invader'&&(stage==='charge'||stage==='release'||stage==='flight')){e.X=975;e.Y=268;}
   if(stage==='jump'||stage==='fall'){e.Ground=false;e.Y-=100;e.VY=stage==='jump'?-Math.max(0,8-age*.5):Math.min(8,age*.5);}
   if(stage==='charge')e.Shoot=-Math.max(1,22-Math.min(21,age));
   if(stage==='release')e.Shoot=Math.max(0,(e.Kind==='invader'?12:30)-age);
   if(stage==='rage'){e.Angry=true;e.RageAge=0;}
   if(stage==='flight'){
    e.Y-=170;
    const laser=e.Kind==='invader';
    g.Projectiles.push({...body(e.X+22+(laser?0:e.Dir*100),e.Y+(laser?110:6)),
     VX:laser?0:e.Dir*3.8,VY:laser?3.8:0,Laser:laser,Age:age,Removed:false});
   }
  }
  desktopAction('cartoon-mode');desktopAction('party');desktopAction('start-party');
  session.set({active:true,mode:'party',game:g});
  const feel=advanceFeel(emptyFeel(),g,ctx.get(Time).step);feel.clock=age;
  if(stage==='land')feel.cues=g.Enemies.map(e=>({kind:'enemy-land',x:e.X+24,y:e.Y+92,at:0,slot:e.ID}));
  ctx.commands.setResource(ArcadeFeel,packFeel(feel));
  ctx.setField(ArcadeControl,'skip',true);
  ctx.setField(ArcadeControl,'requestSequence',desktopGameRequest.get().sequence);
 },
});

import { defineCheat } from '@gameengine/runtime/cheats';
import { write } from '@gameengine/runtime';
import { ArcadeControl } from '../schema.gen';
import campaign from '../../data/levels.json';
import { createPartyGame, preparePartyWave } from '../arcade/party';
import { captureBoss } from '../arcade/boss';
import { bubble, effect } from '../arcade/bubbles';
import { item } from '../arcade/items';
import { arenaHeight, arenaWidth, body, EnemyState, State } from '../arcade/types';
import { desktopAction, desktopGameRequest } from '../desktop/state';
import { session } from '../arcade/session';
import { partySpawnSettleTicks } from '../arcade/party-config';

const families = ['zenchan','monsta','mighta','pulpul','banebou','invader'];
const powers = ['pink_candy','blue_candy','yellow_candy','shoes','orange_parasol','red_parasol',
  'purple_parasol','crystal_ring','amethyst_ring','ruby_ring','dynamite','clock','thunder_potion'];

/** Deterministic recorded QA setup. This file is stripped from release bundles. */
export const CartoonOverhaul = defineCheat({
  id:'cartoon.overhaul', group:'Cartoon overhaul', title:'Inspect complete cartoon content in the new arena',
  params:{
    scenario:{type:'string',default:'combat'},
    team:{type:'int',min:6,max:10,default:10},
    humans:{type:'int',min:1,max:10,default:10},
    wave:{type:'int',min:1,max:10,default:9},
  },
  resources:[write(ArcadeControl)],
  run(ctx,{scenario,team,humans,wave}){
    if(!['combat','enemies','capture','items','elements','rescue','boss','boss-captured','victory'].includes(scenario))
      throw new Error(`Unknown cartoon QA scenario: ${scenario}`);
    const size=team===6?6:10, boss=['boss','boss-captured','victory'].includes(scenario);
    const g=createPartyGame(campaign,42,Array.from({length:size},(_,i)=>i<humans?'human' as const:'ai' as const),10,'cartoon');
    g.Party!.Wave=boss?10:wave; preparePartyWave(g);
    g.Party!.Phase=boss?'boss':'combat';g.Party!.Timer=0;g.Countdown=0;g.State=State.Playing;
    for(const enemy of g.Enemies){enemy.State=EnemyState.Active;delete enemy.SpawnTicks;}
    g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];g.LevelTicks=121;
    const width=arenaWidth(g), height=arenaHeight(g), floor=height-24-44;
    for(const p of g.Players)p.Invincible=100000;
    if(scenario==='enemies'||scenario==='capture'){
      const template=g.Enemies[0]!;
      g.Enemies=families.map((kind,i)=>({...template,...body(94+i*112,height-200),Kind:kind,
        ID:++g.NextID,State:scenario==='capture'?EnemyState.Trapped:EnemyState.Active,
        Dir:i%2?1:-1,Age:i*6,Angry:i%2===1,Shoot:kind==='mighta'?12:0,
        DeadTicks:0,CarriedBy:0,CarryTicks:0,Vertical:1,Cooldown:120,Phase:0}));
      if(scenario==='capture')g.Bubbles=g.Enemies.map((enemy,i)=>({...bubble(enemy.X,enemy.Y),
        ID:++g.NextID,EnemyID:enemy.ID,Age:30,CapturedAge:[30,1100,1250][i%3]!,Floating:true,Shooter:i}));
    }
    if(scenario==='items'){
      g.Enemies=[];const values=[...Array.from({length:25},(_,i)=>({Food:i+1,Power:''})),...powers.map(Power=>({Power,Food:0}))];
      g.Items=values.map((value,i)=>({...item(85+i%10*72,78+Math.floor(i/10)*74),...value,ID:++g.NextID,Stationary:true}));
    }
    if(scenario==='elements'){
      g.Enemies=[];
      g.Bubbles=['','fire','water','thunder'].map((Element,i)=>({...bubble(160+i*160,90),Element,ID:++g.NextID,Age:30,Shooter:i}));
      g.Effects=['fire','water','thunder','fire'].map((Element,i)=>({...effect(160+i*160,220),Element,Ground:i===3,Age:0,Life:120,Dir:i%2?1:-1}));
      g.Projectiles=[{...body(210,310),Age:0,Bottle:false,Laser:false,Removed:false},
        {...body(420,310),Age:0,Bottle:false,Laser:true,Removed:false},
        {...body(630,310),Age:0,Bottle:true,Laser:false,Removed:false}];
      g.Particles=[{...body(350,190),Text:'',Life:12}];
    }
    if(scenario==='rescue'){
      g.Enemies=g.Enemies.slice(0,1);g.Freeze=10000;
      if(g.Enemies[0])Object.assign(g.Enemies[0],{X:width-140,Y:80});
      g.Players[0]!.X=160;g.Players[0]!.Y=floor;g.Players[0]!.Ground=true;
      Object.assign(g.Players[1]!,{X:270,Y:floor,Ground:true,Downed:true,Lives:0,Dead:0});
    }
    if(boss){
      const b=g.Party!.Boss!;
      Object.assign(b,{X:width/2-48,Y:height-160,VX:0,VY:0,HP:scenario==='boss'?1000000:1,Timer:600,Mode:'moving'});
      for(const p of g.Players){p.Y=floor;p.Power.Thunder=true;}
      Object.assign(g.Players[0]!,{X:b.X-150,Y:floor,Ground:true,Dir:1,Cooldown:0});
      if(scenario!=='boss')captureBoss(g);
      if(scenario==='victory'){b.HP=0;b.Timer=30;g.Players[0]!.X=b.X;g.Players[0]!.Y=b.Y;}
    }
    desktopAction('cartoon-mode');desktopAction('party');desktopAction('start-party');
    session.set({active:true,mode:'party',game:g});
    ctx.setField(ArcadeControl,'skip',true);
    ctx.setField(ArcadeControl,'requestSequence',desktopGameRequest.get().sequence);
  },
});

/** Same recorded setup contract as party.reset, with an explicit new-layout opt in. */
export const CartoonPartyReset = defineCheat({
  id:'cartoon.party-reset',group:'Cartoon overhaul',title:'Reset new cartoon party geometry',
  params:{team:{type:'int',min:6,max:10,default:10},wave:{type:'int',min:1,max:10,default:1},
    humans:{type:'int',min:1,max:10,default:1},countdown:{type:'int',min:1,max:180,default:1}},
  resources:[write(ArcadeControl)],
  run(ctx,{team,wave,humans,countdown}){
    const size=team===6?6:10;
    const g=createPartyGame(campaign,42,Array.from({length:size},(_,i)=>i<humans?'human' as const:'ai' as const),10,'cartoon');
    g.Party!.Wave=wave;preparePartyWave(g);g.Party!.Timer=countdown;g.Party!.PrepareTicks=countdown;g.Countdown=countdown;
    for(const enemy of g.Enemies)if(enemy.State===EnemyState.Spawning)
      enemy.SpawnTicks=Math.min(enemy.SpawnTicks??0,Math.max(0,countdown-partySpawnSettleTicks));
    desktopAction('cartoon-mode');desktopAction('party');desktopAction('start-party');
    session.set({active:true,mode:'party',game:g});
    ctx.setField(ArcadeControl,'skip',true);
    ctx.setField(ArcadeControl,'requestSequence',desktopGameRequest.get().sequence);
  },
});

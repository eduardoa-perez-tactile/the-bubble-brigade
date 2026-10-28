import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import campaign from '../../data/levels.json';
import {createPartyGame,preparePartyWave} from '../arcade/party';
import {bubble,effect,popBubble} from '../arcade/bubbles';
import {updateDefeated} from '../arcade/enemies';
import {body,EnemyState,State,type Enemy} from '../arcade/types';
import {desktopAction,desktopGameRequest} from '../desktop/state';
import {session} from '../arcade/session';

const families=['zenchan','mighta','monsta','pulpul','banebou','invader'];
const columns=[120,440,640,1080,1320,1560];

/** Recorded QA setup only. All subsequent steps use the normal party simulation. */
export const EnemyShowcase=defineCheat({
 id:'cartoon.enemy-showcase',group:'Concept verification',title:'Inspect simplified enemy roster and real attacks',
 params:{scenario:{type:'enum',values:['roster','capture','states','shooters','mixed','size-transitions'],default:'roster'},
  frozen:{type:'bool',default:true},defeatAge:{type:'int',min:0,max:49,default:0}},resources:[write(ArcadeControl)],
 run(ctx,{scenario,frozen,defeatAge}){
  const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
  g.Party!.Wave=9;preparePartyWave(g);
  g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];
  g.Countdown=0;g.State=State.Playing;g.LevelTicks=121;g.Freeze=frozen?10000:0;
  g.Items=[];g.Effects=[];g.Bubbles=[];g.Projectiles=[];g.Particles=[];
  for(let i=0;i<g.Players.length;i++)Object.assign(g.Players[i]!,{
   X:100+i*154,Y:484,VX:0,VY:0,Ground:true,Dir:i<5?1:-1,
   Invincible:100000,Lives:1,Downed:false,Dead:0,Shoot:0,Cooldown:0,
  });
  const template=g.Enemies[0]!;
  const make=(kind:string,index:number,row:number):Enemy=>({...template,...body(columns[index]!,row*24-44),
   Kind:kind,ID:++g.NextID,Ground:true,State:EnemyState.Active,Dir:row===13?1:-1,
   Age:index*7,Angry:row===18,Cooldown:120,Shoot:0,DeadTicks:0,CarriedBy:0,CarryTicks:0,Vertical:1,Phase:index*.6});
  if(scenario==='roster')g.Enemies=[13,18].flatMap(row=>families.map((kind,i)=>make(kind,i,row)));
  if(scenario==='capture'){
   g.Enemies=families.map((kind,i)=>({...make(kind,i,13),State:EnemyState.Trapped,Angry:false}));
   g.Bubbles=g.Enemies.map((e,i)=>({...bubble(150+i*275,200+(i%2)*90),
    ID:++g.NextID,EnemyID:e.ID,Age:60,CapturedAge:[100,1050,1220][i%3]!,Floating:true,Shooter:i}));
  }
  if(scenario==='states'){
   const toys=['zenchan','mighta','banebou','invader'];
   g.Enemies=toys.flatMap((kind,i)=>[
    {...make(kind,i,13),X:250+i*350,Y:200,Ground:false,VY:-4},
    {...make(kind,i,18),X:250+i*350,State:i%2?EnemyState.Carried:EnemyState.Defeated,
     DeadTicks:60,Angry:false},
   ]);
   for(const e of g.Enemies.filter(e=>e.State===EnemyState.Carried)){
    const water={...effect(e.X,e.Y+12),ID:++g.NextID,Element:'water',Life:300,Dir:1,Spread:false};
    e.CarriedBy=water.ID;g.Effects.push(water);
   }
  }
  if(scenario==='size-transitions'){
   // Rows are normal, captive, defeated. The defeated row uses the real pop and
   // lifetime update; rebase its traveled position for a same-root pose comparison.
   g.Enemies=[];
   for(const [i,kind] of families.entries())for(const [row,y] of [170,310,450].entries()){
    const e={...make(kind,i,13),X:160+i*270,Y:y,Angry:false,Age:0,Dir:1,
     State:row===0?EnemyState.Active:EnemyState.Trapped};
    g.Enemies.push(e);
    if(row>0){
     g.Bubbles.push({...bubble(e.X,e.Y),ID:++g.NextID,EnemyID:e.ID,Age:60,CapturedAge:100,Floating:true});
     if(row===2){popBubble(g,g.Bubbles.length-1,0);g.Bubbles=g.Bubbles.filter(b=>!b.Removed);}
    }
   }
   for(let age=0;age<defeatAge;age++)updateDefeated(g);
   for(const [i,kind] of families.entries()){
    const dead=g.Enemies.find(e=>e.Kind===kind&&e.State===EnemyState.Defeated)!;
    dead.X=160+i*270;dead.Y=450;
   }
   for(const p of g.Players)p.X=-200;
   g.Items=[];g.Particles=[];
  }
  if(scenario==='shooters'){
   g.Enemies=[{...make('mighta',1,22),X:600,Cooldown:0,Angry:false},
    // The downward nozzle overhangs the shelf into a real gap, so its actual
    // laser survives the supporting tile and becomes visible below the toy.
    {...make('invader',3,13),X:975,Cooldown:0,Angry:false}];
  }
  desktopAction('cartoon-mode');desktopAction('party');desktopAction('start-party');
  session.set({active:true,mode:'party',game:g});
  ctx.setField(ArcadeControl,'skip',true);
  ctx.setField(ArcadeControl,'requestSequence',desktopGameRequest.get().sequence);
 },
});

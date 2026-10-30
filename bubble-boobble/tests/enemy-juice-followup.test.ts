import {expect,renderTest} from '@gameengine/test';
import {EnemyJuiceReview} from '../src/cartoon/enemy-juice-review.cheats';
import {EnemyShowcase} from '../src/cartoon/enemy-showcase.cheats';
import {CombatEnemyShowcase} from '../src/cartoon/combat-feedback.cheats';
import {ArcadeFeel} from '../src/schema.gen';
import {session} from '../src/arcade/session';
import {unpackFeel} from '../src/arcade/juice';
import {CARTOON_ENEMY_WINDUP} from '../src/arcade/enemies';

renderTest('enemy juice integrated motion shots and anger stay inside the phone low draw budget',async({input,step,cheat,render,world})=>{
 let peak=0;
 const sample=(width:number,height:number)=>{
  const stats=render.stats({width,height});peak=Math.max(peak,stats.drawCalls);
  expect(stats.drawCalls).toBeLessThanOrEqual(15);
 };
 await step(3);
 for(const [width,height]of [[360,880],[810,1080],[1680,720]] as const){
  input.view(width,height,1);
  for(const [stage,age]of [['jump',0],['land',0],['land',8],['land',20],['charge',18],['release',0],['release',10],['flight',24],['rage',7],['rage',60]] as const){
   await cheat(EnemyJuiceReview,{stage,age});sample(width,height);
  }
 }
 input.view(768,720,1);
 await cheat(EnemyShowcase,{scenario:'shooters',frozen:false});
 await step(CARTOON_ENEMY_WINDUP+1);
 expect(session.get().game!.Projectiles.some(p=>p.Laser)).toBe(true);
 expect(session.get().game!.Projectiles.some(p=>!p.Laser)).toBe(true);
 for(let i=0;i<4;i++){sample(768,720);await step(6);}
 await cheat(CombatEnemyShowcase,{});
 let jumped=false,landed=false;
 // The arcade clock runs at 30 Hz inside the engine's 60 Hz steps; allow a
 // complete 61-tick authored jump and descent to the next supporting shelf.
 for(let i=0;i<180&&(!jumped||!landed);i++){
  await step(1);
  const feel=unpackFeel(world.resource(ArcadeFeel));
  const fresh=feel.cues.filter(c=>feel.clock-c.at<1);
  jumped ||= fresh.some(c=>c.kind==='enemy-jump');
  landed ||= fresh.some(c=>c.kind==='enemy-land');
  if(fresh.some(c=>c.kind==='enemy-jump'||c.kind==='enemy-land'))sample(768,720);
 }
 console.log(JSON.stringify({enemyJuicePeakDrawCalls:peak,liveHopperJump:jumped,liveHopperLand:landed}));
 expect(jumped).toBe(true);expect(landed).toBe(true);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});

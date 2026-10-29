import {EnemyState,type Enemy,type Projectile,type Effect} from '../arcade/types';
import {CARTOON_ENEMY_WINDUP} from '../arcade/enemies';
import type {CartoonDraw} from './renderer';

const ink:CartoonDraw['color']=[.14,.12,.17,1];
const cream:CartoonDraw['color']=[1,.94,.76,1];
const coral:CartoonDraw['color']=[1,.42,.30,1];
function centered(frame:string,x:number,y:number,width:number,height=width,color?:CartoonDraw['color']):CartoonDraw{
 return {frame,x:x-width/2,y:y-height/2,width,height,color};
}
/** Artwork is centered on the unchanged 16x20 collision body. A dark backing
 * keeps the solid threat readable against both bright stone and dark scenery. */
export function cartoonEnemyProjectileDraws(p:Readonly<Projectile>,reduced=false):CartoonDraw[]{
 if(p.Bottle||p.Removed)return [];
 const x=p.X+8,y=p.Y+10,frame=p.Laser?'effect/laser-0':'effect/boulder-0';
 const width=p.Laser?28:52,height=p.Laser?48:52;
 const out:CartoonDraw[]=[];
 if(!reduced)for(const [lag,size,color]of [[3,13,coral],[5,8,cream]] as const){
  out.push({...centered('solid/#ffffff',x-p.VX*lag,y-p.VY*lag,size,size,color),diamond:true});
 }
 out.push(centered(frame,x,y,width+8,height+8,ink),centered(frame,x,y,width,height));
 return out;
}
/** Charge precedes the first damaging projectile. The essential amber muzzle
 * remains visible in reduced mode; recovery emits one short cream puff. */
export function cartoonEnemyAttackDraws(e:Readonly<Enemy>,reduced=false):CartoonDraw[]{
 if(e.State!==EnemyState.Active||!['mighta','invader'].includes(e.Kind)||e.Shoot===0)return [];
 const laser=e.Kind==='invader',x=laser?e.X+24:e.X+22+e.Dir*48,y=laser?e.Y+54:e.Y+6;
 if(e.Shoot<0){
  const charge=1-Math.min(1,-e.Shoot/CARTOON_ENEMY_WINDUP),size=12+charge*12;
  return [
   {...centered('solid/#231e27',x,y,size+8),diamond:true},
   {...centered('solid/#ffe08a',x,y,size),diamond:true},
   centered('solid/#fff0c9',x,y,4+charge*4),
  ];
 }
 if(reduced)return [];
 const age=(laser?12:30)-e.Shoot;
 if(age<0||age>=8)return [];
 const t=age/8,size=20+18*t;
 return [centered('dust-puff',x+(laser?0:e.Dir*age*1.5),y+(laser?age*1.5:0),size,size,[1,.94,.76,1-t])];
}
export function cartoonEnemyImpactDraws(e:Readonly<Effect>,reduced=false):CartoonDraw[]{
 if(e.Element!=='enemy-impact'||e.Age>=12)return [];
 const t=Math.max(0,e.Age)/12;
 const out=[centered('effect/spark-0',e.X,e.Y,28+20*t,28+20*t,[1,.94,.76,1-t])];
 if(!reduced)for(const dir of [-1,1])out.push(centered('dust-puff',e.X+dir*(8+14*t),e.Y-8*t,18+8*t,18+8*t,[1,.94,.76,(1-t)*.8]));
 return out;
}

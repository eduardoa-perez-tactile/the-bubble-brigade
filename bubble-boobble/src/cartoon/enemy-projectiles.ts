import {EnemyState,type Enemy,type Projectile,type Effect} from '../arcade/types';
import {CARTOON_ENEMY_WINDUP} from '../arcade/enemies';
import type {CartoonDraw} from './renderer';

const ink:CartoonDraw['color']=[.14,.12,.17,1];
const cream:CartoonDraw['color']=[1,.94,.76,1];
const coral:CartoonDraw['color']=[1,.42,.30,1];
function centered(frame:string,x:number,y:number,width:number,height=width,color?:CartoonDraw['color']):CartoonDraw{
 return {frame,x:x-width/2,y:y-height/2,width,height,color};
}
/** Constant-velocity shots can reconstruct their short wake without retained
 * particles. Each sample starts only once its full envelope is behind the real
 * spawn point; the stopped projectile age also stops spin and smoke. */
export function cartoonEnemyProjectileDraws(p:Readonly<Projectile>,reduced=false):CartoonDraw[]{
 if(p.Bottle||p.Removed)return [];
 const x=p.X+8,y=p.Y+10,frame=p.Laser?'effect/laser-0':'effect/boulder-0';
 const width=p.Laser?28:52,height=p.Laser?48:52;
 const speed=Math.hypot(p.VX,p.VY),out:CartoonDraw[]=[];
 if(!reduced&&speed>0){
  const ux=p.VX/speed,uy=p.VY/speed,angle=Math.atan2(uy,ux);
  if(p.Laser){
   // A tight hot wake keeps the downward energy shot distinct from the stone.
   for(let i=2;i>=0;i--){
    const lag=7+i*5,length=24-i*6;
    if(p.Age<lag+length/(2*speed))continue;
    out.push({...centered('solid/#ffffff',x-p.VX*lag,y-p.VY*lag,length,5-i,[1,.61,.35,.72-i*.18]),rotation:angle});
   }
  }else{
   // Oldest first: small fading curls grow towards the spinning leading stone.
   for(let i=3;i>=0;i--){
    const lag=7+i*4,size=26-i*5;
    if(p.Age<lag+size/(2*speed))continue;
    out.push({...centered('dust-puff',x-p.VX*lag,y-p.VY*lag,size,size*.76,[1,.91,.72,.78-i*.16]),flip:p.VX<0});
   }
   for(const side of [-1,1]){
    const lag=9,length=22;
    if(p.Age<lag+length/(2*speed))continue;
    out.push({...centered('solid/#ffffff',x-p.VX*lag-uy*side*10,y-p.VY*lag+ux*side*10,length,3,cream),rotation:angle});
   }
  }
 }
 // The ink backing shares the ball's exact center and angular phase.
 const rotation=reduced||p.Laser?0:p.Age*p.VX/23;
 out.push({...centered(frame,x,y,width+8,height+8,ink),rotation,pivot:[.5,.5]},
  {...centered(frame,x,y,width,height),rotation,pivot:[.5,.5]});
 return out;
}
/** A muzzle-shaped charge, held for the last four warning ticks, resolves into
 * an outward flash and smoke. The warning stays legible with reduced effects. */
export function cartoonEnemyAttackDraws(e:Readonly<Enemy>,reduced=false):CartoonDraw[]{
 if(e.State!==EnemyState.Active||!['mighta','invader'].includes(e.Kind)||e.Shoot===0)return [];
 const laser=e.Kind==='invader',x=laser?e.X+24:e.X+22+e.Dir*48,y=laser?e.Y+54:e.Y+6;
 const ux=laser?0:e.Dir,uy=laser?1:0,angle=Math.atan2(uy,ux);
 if(e.Shoot<0){
  const charge=Math.min(1,(1-Math.min(1,-e.Shoot/CARTOON_ENEMY_WINDUP))/.8);
  const size=22+charge*16;
  const out:CartoonDraw[]=[
   {...centered('effect/spark-0',x,y,size+8,size+8,ink),rotation:angle},
   {...centered('effect/spark-0',x,y,size,size,[1,.72+.22*charge,.38+.38*charge,1]),rotation:angle},
  ];
  if(!reduced)for(const side of [-1,1]){
   const forward=26-10*charge,spread=20-9*charge;
   out.push({...centered('solid/#ffffff',x+ux*forward-uy*side*spread,
    y+uy*forward+ux*side*spread,12+8*charge,4,cream),rotation:angle-side*.6});
  }
  return out;
 }
 if(reduced)return [];
 const age=(laser?12:30)-e.Shoot;
 if(age<0||age>=10)return [];
 const t=age/10,out:CartoonDraw[]=[];
 for(const side of [-1,1]){
  const forward=8+20*t,spread=9+13*t,size=25+15*t;
  out.push({...centered('dust-puff',x+ux*forward-uy*side*spread,
   y+uy*forward+ux*side*spread,size,size*.8,[1,.94,.76,.86*(1-t)]),flip:side<0,rotation:angle});
 }
 if(age<4){
  const flash=1-age/4,cx=x+ux*10,cy=y+uy*10;
  out.push({...centered('effect/spark-0',cx,cy,62*flash,42*flash,coral),rotation:angle},
   {...centered('effect/spark-0',cx,cy,44*flash,28*flash,cream),rotation:angle});
 }
 return out;
}
export function cartoonEnemyImpactDraws(e:Readonly<Effect>,reduced=false):CartoonDraw[]{
 if(e.Element!=='enemy-impact'||e.Age>=12)return [];
 const t=Math.max(0,e.Age)/12;
 const out=[centered('effect/spark-0',e.X,e.Y,28+20*t,28+20*t,[1,.94,.76,1-t])];
 if(!reduced)for(const dir of [-1,1])out.push(centered('dust-puff',e.X+dir*(8+14*t),e.Y-8*t,18+8*t,18+8*t,[1,.94,.76,(1-t)*.8]));
 return out;
}

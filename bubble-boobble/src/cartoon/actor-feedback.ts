import type { GameState, PartyBoss, Player } from '../arcade/types';
import { levelColumns, levelRows, Tile } from '../arcade/types';
import type { FeelCue, FeelState } from '../arcade/juice';
import type { CartoonDraw } from './renderer';

/** Presentation-only geometry, expressed in game coordinates before projection.
 * Every crop is transformed around the same feet root, preserving its seam. */
export function cartoonDragonFeedback(draws:readonly CartoonDraw[],p:Player,slot:number,feel?:FeelState,reduced=false):CartoonDraw[]{
  if(reduced||p.Downed||p.Dead>0||p.Lives<=0)return draws.slice();
  let sx=1,sy=1,dx=0;
  if(p.Shoot>0){
    // The first two release drawings retain their exact mouth registration.
    // Recovery gets a tiny recoil; scaling a shot would alter the release seam.
    if(p.Shoot<=10)dx=-p.Dir*1.25*Math.sin((11-p.Shoot)*Math.PI/10);
  }else{
    if(!p.Ground){const stretch=p.VY<0?.025:p.VY>0?.015:0;sx-=stretch;sy+=stretch;}
    const land=cueAge(feel,'land',slot),turn=cueAge(feel,'turn',slot);
    if(p.Ground&&land<10){const t=1-land/10;sx+=.045*t;sy-=.035*t;}
    if(turn<6){const t=1-turn/6;sx-=.025*t;sy+=.01*t;}
  }
  const x=p.X+22,feet=p.Y+44;
  return draws.map(d=>({...d,x:x+(d.x-x)*sx+dx,y:feet+(d.y-feet)*sy,width:d.width*sx,height:d.height*sy}));
}
function cueAge(feel:FeelState|undefined,kind:FeelCue['kind'],slot?:number){
  let age=Infinity;
  for(const c of feel?.cues??[]){
    const elapsed=feel!.clock-c.at;
    if(c.kind===kind&&(slot===undefined||c.slot===slot)&&elapsed>=0)age=Math.min(age,elapsed);
  }
  return age;
}

/** Find a real, exposed platform below the feet. The same static grounding cue
 * remains in reduced mode; no shadow is projected across a gap or onto a wall. */
export function cartoonDragonShadow(g:GameState,p:Player):CartoonDraw|undefined{
  if(p.Downed||p.Lives<=0||p.Dead>0)return;
  const feet=p.Y+44,center=p.X+22;
  for(let row=Math.max(0,Math.ceil((feet-.01)/Tile));row<levelRows(g.Level);row++){
    const altitude=row*Tile-feet;
    if(altitude>144)break;
    const col=Math.floor(center/Tile);
    if(col<0||col>=levelColumns(g.Level)||!g.Level.tiles[row]?.[col]||g.Level.tiles[row-1]?.[col])continue;
    let left=col,right=col;
    while(left>0&&g.Level.tiles[row]?.[left-1]&&!g.Level.tiles[row-1]?.[left-1])left--;
    while(right+1<levelColumns(g.Level)&&g.Level.tiles[row]?.[right+1]&&!g.Level.tiles[row-1]?.[right+1])right++;
    const t=Math.max(0,altitude)/144,width=Math.min((right-left+1)*Tile-2,34-18*t);
    const x=Math.max(left*Tile+1,Math.min((right+1)*Tile-width-1,center-width/2));
    return {frame:'shadow',x,y:row*Tile-4,width,height:8-3*t,color:[1,1,1,.65-.48*t]};
  }
}

/** Each cloud shares the support plane so a nonuniform courtyard projection
 * cannot stretch the air between its bottom and the painted platform. */
export type CartoonGroundDustDraw=CartoonDraw&{groundY:number};

/** A short, opaque cream crown gives takeoff and landing a readable silhouette
 * even at phone scale. Three takeoff lobes peel away; a landing adds two smaller
 * outer curls. One active event per player bounds a ten-player landing to 50
 * atlas sprites. FeelCue uses the pixel feet (+92); cartoon feet are +44. */
export function cartoonGroundDust(feel:FeelState|undefined,reduced=false):CartoonGroundDustDraw[]{
  if(reduced||!feel)return [];
  const out:CartoonGroundDustDraw[]=[];
  let shownSlots=0;
  for(let index=feel.cues.length-1;index>=0;index--){
    const c=feel.cues[index]!;
    if(c.kind!=='land'&&c.kind!=='jump'||c.slot<0||c.slot>=10)continue;
    const landing=c.kind==='land',age=feel.clock-c.at,life=landing?22:18;
    if(age<0||age>=life||shownSlots&(1<<c.slot))continue;
    shownSlots|=1<<c.slot;
    const t=age/life,strength=Math.max(.4,Math.min(1,c.strength??1));
    // Even a soft landing is legible; stronger falls add breadth rather than
    // multiplying transparent particles. Expansion eases out, then fades.
    const energy=landing?.84+.16*strength:1;
    const bloom=1-(1-Math.min(1,t*3))**2;
    const opacity=(landing?.86:.8)*(1-t)**1.25;
    const groundY=c.y-48,center=c.x-2;
    const puff=(offset:number,width:number,height:number,lift:number,alpha:number,flip=false)=>out.push({
      frame:'dust-puff',x:center+offset-width/2,y:groundY-height-lift,width,height,groundY,flip,
      color:[1,.96,.88,opacity*alpha],
    });
    const drift=landing?20+4*bloom:15+8*bloom;
    const sideWidth=(landing?29:25)*energy*(1+.08*bloom);
    const sideHeight=(landing?30:24)*energy*(1+.14*bloom);
    for(const dir of [-1,1])puff(dir*drift,sideWidth,sideHeight,t*5,1,dir<0);
    // The low middle lobe binds the two sides into a single contact burst.
    puff(0,(landing?36:29)*energy,(landing?22:18)*energy,t*2,.9);
    if(landing)for(const dir of [-1,1])puff(dir*(31+2*bloom),13*energy,16*energy,7+7*t,.85,dir<0);
  }
  return out;
}

/** Windup stays readable in reduced mode through the authored attack frame;
 * decorative compression and recoil are disabled. No sim hitstop or new pose. */
export function cartoonBossFeedback(draw:CartoonDraw,boss:PartyBoss,feel?:FeelState,reduced=false):CartoonDraw{
  if(reduced)return draw;
  if(boss.Mode==='captured')return {...draw,y:draw.y+Math.sin(boss.Timer*.08)*5};
  const windup=boss.Mode==='windup'?Math.max(0,Math.min(1,(30-boss.Timer)/30)):0;
  const age=cueAge(feel,'boss-hit'),impact=age<8?1-age/8:0;
  const breath=Math.sin(boss.Tick*.10)*.025;
  const release=boss.Mode==='moving'&&boss.Timer>132?Math.max(0,(boss.Timer-132)/18):0;
  const hit=Math.max(impact,boss.Invulnerable/8);
  const sx=1+breath+.16*windup-.10*hit-.09*release,sy=1-breath-.12*windup+.10*hit+.06*release;
  const center=draw.x+draw.width/2,feet=draw.y+draw.height*120/128;
  return {...draw,x:center-draw.width*sx/2-boss.Dir*(12*hit+9*release),
    y:feet-draw.height*sy*120/128,width:draw.width*sx,height:draw.height*sy};
}

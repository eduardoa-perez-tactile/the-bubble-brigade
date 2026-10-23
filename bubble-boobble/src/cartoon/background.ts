import type { CartoonDraw } from './renderer';

/** Coordinates belong to the painted 1672 × 941 plate, not the gameplay world.
 * Matching its viewport stretch keeps water and lights registered at every aspect
 * ratio without touching the arena projection, collisions, or actor positions. */
export interface CartoonBackgroundBounds {x:number;y:number;width:number;height:number}
const plateWidth=1672,plateHeight=941;
const waterfalls= [
  {x:141,y:183,width:32,height:114,phase:0},
  {x:178,y:350,width:48,height:238,phase:23},
  {x:248,y:613,width:43,height:177,phase:47},
  {x:1340,y:49,width:32,height:89,phase:11},
  {x:1414,y:342,width:47,height:248,phase:37},
  {x:1364,y:613,width:52,height:180,phase:63},
] as const;
const candles=[{x:43,y:108,phase:0},{x:65,y:119,phase:19},
  {x:362,y:383,phase:43},{x:1289,y:408,phase:71},
  {x:1607,y:118,phase:101},{x:1628,y:106,phase:131}] as const;

/** Small, bounded overlays animate the existing painting. All phases derive from
 * the supplied game tick: pausing cannot advance them, and reduced effects omits
 * them entirely. No mutable history, particles, clocks, or simulation writes. */
export function cartoonBackgroundDraws(tick:number,bounds:CartoonBackgroundBounds,reduced=false):CartoonDraw[]{
  if(reduced||bounds.width<=0||bounds.height<=0)return [];
  const t=Math.max(0,tick),out:CartoonDraw[]=[];
  const sx=bounds.width/plateWidth,sy=bounds.height/plateHeight;
  const add=(frame:string,x:number,y:number,width:number,height:number,color:CartoonDraw['color'],diamond=false)=>{
    out.push({frame,x:bounds.x+x*sx,y:bounds.y+y*sy,width:width*sx,height:height*sy,color,diamond});
  };
  const soft=(x:number,y:number,width:number,height:number,color:CartoonDraw['color'])=>
    add('environment/ambient-soft',x-width/2,y-height/2,width,height,color);

  for(const fall of waterfalls){
    // Seven staggered highlights descend inside the painted water, fading near
    // both ends. Their short length avoids reading as new climbable geometry.
    for(let i=0;i<7;i++){
      const phase=((t*1.8+fall.phase+i*fall.height/7)%fall.height)/fall.height;
      const fade=Math.sin(phase*Math.PI),length=10+(i%3)*5;
      const x=fall.x+((i*17+fall.phase)%29-14)*fall.width/38;
      soft(x,fall.y+phase*(fall.height-length)+length/2,2.2+(i%2),length,[.48,.84,.9,.38*fade]);
    }
    const foot=fall.y+fall.height;
    // A tiny mist pool, a shifting foam line and four ballistic spray glints.
    soft(fall.x,foot+1,fall.width*1.9,17,[.39,.76,.8,.12+.025*Math.sin((t+fall.phase)/17)]);
    soft(fall.x+Math.sin((t+fall.phase)/21)*3,foot,fall.width*1.1,5,[.67,.91,.93,.27]);
    for(let i=0;i<4;i++){
      const age=((t+fall.phase+i*11)%44)/44,dir=i%2?1:-1;
      soft(fall.x+dir*(5+i*3+age*12),foot-4-24*age*(1-age),3,4,[.64,.87,.9,.32*(1-age)]);
    }
  }
  for(const candle of candles){
    const phase=t+candle.phase;
    const pulse=.78+.14*Math.sin(phase*.11)+.08*Math.sin(phase*.27);
    // Soft amber pools warm only the nearby stone. The white texture shares one
    // page with the water and cloth overlays; there are no fullscreen blends.
    soft(candle.x,candle.y+5,78,92,[1,.34,.065,.17*pulse]);
    soft(candle.x,candle.y+1,29,39,[1,.57,.15,.19*pulse]);
    const sway=Math.sin(phase*.14)*1.1,flame=12+2.2*Math.sin(phase*.21);
    soft(candle.x+sway,candle.y-1,5.2,flame,[1,.55,.09,.65]);
    soft(candle.x+sway*.5,candle.y,2.5,flame*.7,[1,.91,.5,.79]);
  }
  // The cloth's paint and dragon crests remain untouched. Broad, low-contrast
  // folds drift across each hanging banner to suggest a slow courtyard breeze.
  for(const [index,banner] of [{x:548,y:90,width:78,height:160},{x:1134,y:106,width:83,height:188}].entries()){
    const phase=t/75+index*2.4;
    for(let fold=0;fold<3;fold++){
      const drift=Math.sin(phase+fold*1.9)*7;
      soft(banner.x-24+fold*24+drift,banner.y+Math.sin(phase)*3,17,banner.height,
        fold%2?[.12,.025,.035,.10]:[.68,.26,.19,.08]);
    }
  }
  return out;
}

import animation from '../../assets/cartoon/animation.json';
import {EnemyState,type Enemy} from '../arcade/types';
import type {CartoonDraw} from './renderer';

type FrameBounds={canvasSize?:readonly number[];visualBounds?:readonly number[]};
const frames=animation.frames as Readonly<Record<string,FrameBounds>>;

/** Identifies the red cores without relying on the actor's original colours. */
export const ENEMY_RAGE_MARK_FRAME='solid/#e34d42';
const veins:readonly (readonly [number,number,number,number])[]=[
  [-.48,-.20,-.20,-.20],[-.20,-.20,-.20,-.48],
  [.20,-.48,.20,-.20],[.20,-.20,.48,-.20],
  [.48,.20,.20,.20],[.20,.20,.20,.48],
  [-.20,.48,-.20,.20],[-.20,.20,-.48,.20],
];

/** Screen-space, above-actor feedback. Four bent veins use one existing white
 * atlas sprite; the two onset puffs reuse the contact-dust art. At most 26 draws
 * per angry actor, no persistent particles, clocks or simulation writes. */
export function cartoonEnemyRageDraws(e:Readonly<Enemy>,actorDraw:Readonly<CartoonDraw>,
  options:{scale:number;left:number;right:number;top:number;bottom:number;minSize?:number},reduced=false):CartoonDraw[]{
  if(e.State!==EnemyState.Active||!e.Angry||actorDraw.width<=0||actorDraw.height<=0)return [];
  const roomWidth=options.right-options.left,roomHeight=options.bottom-options.top;
  if(roomWidth<=0||roomHeight<=0)return [];
  const normalFrame=`enemy/${e.Kind}/${e.Kind==='monsta'||e.Kind==='pulpul'?'walk-0':'simple-travel-0'}`;
  const metadata=frames[actorDraw.frame]?.visualBounds?frames[actorDraw.frame]:frames[normalFrame];
  const canvas=metadata?.canvasSize??[128,128],bounds=metadata?.visualBounds??[0,0,canvas[0]!,canvas[1]!];
  const left=(actorDraw.flip?canvas[0]!-bounds[2]!:bounds[0]!)/canvas[0]!;
  const right=(actorDraw.flip?canvas[0]!-bounds[0]!:bounds[2]!)/canvas[0]!;
  const top=bounds[1]!/canvas[1]!,bottom=bounds[3]!/canvas[1]!;
  const pivot=actorDraw.pivot??[.5,.5],angle=actorDraw.rotation??0;
  const cosine=Math.cos(angle),sine=Math.sin(angle);
  const rootX=actorDraw.x+pivot[0]!*actorDraw.width,rootY=actorDraw.y+pivot[1]!*actorDraw.height;
  let paintedLeft=Infinity,paintedRight=-Infinity,paintedTop=Infinity;
  for(const x of [left,right])for(const y of [top,bottom]){
    const dx=(x-pivot[0]!)*actorDraw.width,dy=(y-pivot[1]!)*actorDraw.height;
    const px=rootX+dx*cosine-dy*sine,py=rootY+dx*sine+dy*cosine;
    paintedLeft=Math.min(paintedLeft,px);paintedRight=Math.max(paintedRight,px);paintedTop=Math.min(paintedTop,py);
  }
  const onsetAge=e.RageAge===undefined?Infinity:e.Age-e.RageAge;
  const onset=onsetAge>=0&&onsetAge<24;
  const pop=!reduced&&onset?1+.18*Math.sin(onsetAge/24*Math.PI):1;
  // The caller converts a 10px minimum to compositor-reference units.
  // Only a physically smaller supplied region may reduce that essential size.
  const size=Math.min(Math.max(options.minSize??10,28*Math.max(0,options.scale))*pop,roomWidth/1.26,roomHeight/1.26);
  const half=size*.63;
  const clamp=(value:number,minimum:number,maximum:number)=>Math.max(minimum,Math.min(maximum,value));
  const centerX=clamp(paintedLeft+(paintedRight-paintedLeft)*(e.Dir<0?.28:.72),options.left+half,options.right-half);
  const centerY=clamp(paintedTop-Math.max(2,5*options.scale)-half,options.top+half,options.bottom-half);
  const out:CartoonDraw[]=[];
  if(!reduced&&onset){
    const t=onsetAge/24,puffSize=Math.max(6,20*options.scale)*(.72+.40*t);
    const width=Math.min(puffSize,roomWidth),height=Math.min(puffSize*.85,roomHeight);
    for(const direction of [-1,1]){
      const x=clamp(centerX+direction*(half+2+t*6)-width/2,options.left,options.right-width);
      const y=clamp(centerY+half*.3-height/2-t*5,options.top,options.bottom-height);
      out.push({frame:'dust-puff',x,y,width,height,flip:direction<0,color:[1,.96,.88,.85*(1-t)]});
    }
  }
  // Layer complete strokes in order, so all quads batch on the same white page.
  // The cream edge survives dark scenery; ink separates the red from pale art.
  for(const [frame,stroke] of [['solid/#fff0c9',.30],['solid/#30252c',.22],[ENEMY_RAGE_MARK_FRAME,.12]] as const){
    const thickness=size*stroke;
    for(const [x0,y0,x1,y1]of veins){
      out.push({frame,x:centerX+Math.min(x0,x1)*size-thickness/2,
        y:centerY+Math.min(y0,y1)*size-thickness/2,
        width:Math.abs(x1-x0)*size+thickness,height:Math.abs(y1-y0)*size+thickness});
    }
  }
  return out;
}

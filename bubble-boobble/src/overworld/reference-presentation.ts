import type {OverworldState} from './state';
import type {OverworldDraw} from './presentation';
/** Source-reference calibration only. Original pixels, no invented scenery or route grid.
 * Pixel origin is top-left of world3_mainland_03, 2028×1476. */
export const REFERENCE_SCALE=.6;
export function referenceWorld(px:number,py:number){return{x:(px-1100)*REFERENCE_SCALE,y:(775-py)*REFERENCE_SCALE};}
export function referenceDrawPlan(s:OverworldState):OverworldDraw[]{
 const out:OverworldDraw[]=[];
 const image=(key:string,px:number,py:number,w:number,h:number,order:number)=>{const p=referenceWorld(px+w/2,py+h/2);out.push({image:key,x:p.x,y:p.y,width:w*REFERENCE_SCALE,height:h*REFERENCE_SCALE,order});};
 out.push({image:'cartoon/white',x:0,y:0,width:4000,height:2600,order:-200,color:[.30,.57,.59,1]});
 image('overworld-reference/mainland03',0,0,2028,1476,-100);
 image('overworld-reference/bee',825,170,601,651,-90);
 // Foreground offsets measured against native base03 lamp/roof landmarks.
 image('overworld-reference/top03',309,39,1774,1391,4000);
 // Existing Brigade character is a calibration proxy; never the rejected generated dragon.
 const stride=s.moving?Math.abs(Math.sin(s.walkTick*.6))*2:0;
 out.push({image:`cartoon/frames/dragon/green/${s.moving?'run-'+Math.floor(s.walkTick/5)%8:'idle-0'}`,x:s.x,y:s.y+36+stride,width:60,height:76,order:2000-s.y,flip:s.facing==='left'});
 if(s.focusedPoi&&!s.modal){out.push({image:'cartoon/white',x:s.x,y:s.y+82,width:26,height:26,order:5000,color:[.96,.94,.85,1]});out.push({text:'A',x:s.x,y:s.y+82,width:26,height:26,fontSize:19,order:5001,color:[.10,.12,.10,1]});}
 return out;
}

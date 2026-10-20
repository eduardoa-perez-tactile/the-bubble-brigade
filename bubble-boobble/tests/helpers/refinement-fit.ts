import alpha from '../../docs/concept-refinement/actor-alpha-bounds.json';

export interface Bounds {x:number;y:number;width:number;height:number}
export function actorAlphaBounds(frame:string,rect:Bounds,flip=false):Bounds|null {
  const source=(alpha.frames as Record<string,{size:number[];alpha:number[]}>)[frame];
  if(!source)return null;
  const [left,top,right,bottom]=source.alpha as [number,number,number,number];
  const [width,height]=source.size as [number,number];
  return {x:rect.x+(flip?width-right:left)/width*rect.width,
    y:rect.y+top/height*rect.height,width:(right-left)/width*rect.width,height:(bottom-top)/height*rect.height};
}
export function projectBounds(rect:Bounds,project:(point:[number,number])=>ArrayLike<number>):Bounds {
  const corners=[[rect.x,720-rect.y],[rect.x+rect.width,720-rect.y],
    [rect.x,720-rect.y-rect.height],[rect.x+rect.width,720-rect.y-rect.height]].map(p=>project(p as [number,number]));
  const left=Math.min(...corners.map(p=>p[0]!)),top=Math.min(...corners.map(p=>p[1]!));
  return {x:left,y:top,width:Math.max(...corners.map(p=>p[0]!))-left,height:Math.max(...corners.map(p=>p[1]!))-top};
}

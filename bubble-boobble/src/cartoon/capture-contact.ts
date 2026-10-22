import raw from '../../data/cartoon-capture-profiles.json';
import {CARTOON_BUBBLE_SIZE,CARTOON_ENEMY_SIZE} from './actor-layout';
import {cartoonInverseY,cartoonProjectY} from './coordinates';
import {solid} from '../arcade/physics';
import {goSin} from '../arcade/trig';
import {intersects,Tile,type Bubble,type Enemy,type GameState} from '../arcade/types';
type Profile={bounds:readonly number[];points:readonly (readonly number[])[]};
const profiles=raw.enemies as Readonly<Record<string,{ticksPerFrame:number;walk:readonly Profile[];shoot?:Profile}>>;

/** A short exact tile traversal prevents an enlarged shell catching through a
 * wall/shelf. It follows the nearest visible silhouette point, not the old body. */
function clearSegment(g:GameState,x:number,y:number,endX:number,endY:number){
 const dx=endX-x,dy=endY-y,sx=Math.sign(dx),sy=Math.sign(dy);
 let col=Math.floor(x/Tile),row=Math.floor(y/Tile);
 const endCol=Math.floor(endX/Tile),endRow=Math.floor(endY/Tile);
 const stepX=dx?Tile/Math.abs(dx):Infinity,stepY=dy?Tile/Math.abs(dy):Infinity;
 let nextX=dx?((sx>0?col+1:col)*Tile-x)/dx:Infinity,nextY=dy?((sy>0?row+1:row)*Tile-y)/dy:Infinity;
 for(let i=0;i<64;i++){
  if(solid(g,col,row))return false;
  if(col===endCol&&row===endRow)return true;
  if(nextX<nextY){col+=sx;nextX+=stepX;}
  else if(nextY<nextX){row+=sy;nextY+=stepY;}
  else {
   if(solid(g,col+sx,row)||solid(g,col,row+sy))return false;
   col+=sx;row+=sy;nextX+=stepX;nextY+=stepY;
  }
 }
 return false;
}

/** Fixed authored geometry baked from alpha silhouettes, selected by sim age.
 * No viewport, renderer, camera, device setting or presentation state is read.
 * Convex hulls include wings and feet while avoiding rectangular empty corners. */
export function cartoonBubbleTouchesEnemy(g:GameState,b:Bubble,e:Enemy){
 const animation=profiles[e.Kind];
 if(!animation)return intersects(b.X,b.Y,40,40,e.X+3,e.Y+3,38,38);
 const profile=e.Kind==='mighta'&&e.Shoot>0&&animation.shoot?animation.shoot:
  animation.walk[Math.floor(Math.max(0,e.Age)/animation.ticksPerFrame)%animation.walk.length]!;
 const unit=CARTOON_ENEMY_SIZE/128,dir=e.Dir<0?-1:1;
 const bx=b.X+22,by=cartoonProjectY(b.Y+22)*1728/1280,feet=cartoonProjectY(e.Y+44)*1728/1280;
 const qx=64+(bx-e.X-22)*dir/unit,qy=120+(by-feet)/unit;
 const t=Math.max(0,Math.min(1,b.Age/16)),growth=.18+.82*t*t*(3-2*t);
 const radius=(CARTOON_BUBBLE_SIZE*60/128*growth)/unit+.5;
 const pad=e.Kind==='banebou'?4:0,bounds=profile.bounds;
 if(qx<bounds[0]!-radius||qx>bounds[2]!+radius||qy<bounds[1]!-pad-radius||qy>bounds[3]!+pad+radius)return false;
 const spring=pad?4*goSin(Math.max(0,e.Age)%32*Math.PI/16):0;
 const yAt=(y:number)=>y<88?y-spring:y<104?104-(104-y)*(16+spring)/16:y;
 let nearest=Infinity,cx=qx,cy=qy,inside=false;
 const points=profile.points;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[j]!,c=points[i]!,ax=a[0]!,ay=yAt(a[1]!),cxEdge=c[0]!,cyEdge=yAt(c[1]!);
  if((ay>qy)!==(cyEdge>qy)&&qx<(cxEdge-ax)*(qy-ay)/(cyEdge-ay)+ax)inside=!inside;
  const dx=cxEdge-ax,dy=cyEdge-ay,length=dx*dx+dy*dy;
  const u=length?Math.max(0,Math.min(1,((qx-ax)*dx+(qy-ay)*dy)/length)):0;
  const x=ax+u*dx,y=ay+u*dy,d=(qx-x)*(qx-x)+(qy-y)*(qy-y);
  if(d<nearest){nearest=d;cx=x;cy=y;}
 }
 if(!inside&&nearest>radius*radius)return false;
 // Move a boundary endpoint very slightly toward the bubble so an enemy's
 // planted foot does not count as entering its supporting platform tile.
 const contactX=inside?bx:e.X+22+(cx-64)*unit*dir,contactY=inside?by:feet+(cy-120)*unit;
 const endX=contactX+(bx-contactX)*.00001;
 const endY=cartoonInverseY((contactY+(by-contactY)*.00001)*1280/1728);
 return clearSegment(g,bx,b.Y+22,endX,endY);
}

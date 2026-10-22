import {CARTOON_BUBBLE_SIZE} from './actor-layout';
import type {Bubble,GameState} from '../arcade/types';
import type {FeelState} from '../arcade/juice';
import type {CartoonDraw} from './renderer';

const bounceKeys=[[0,.8],[2,.8],[7,1.08],[12,.98],[18,1]] as const;

/** Drawn envelopes only; growth and collision remain owned by their existing paths. */
export function cartoonBubbleShape(b:Bubble,diameter:number,reduced=false,bounceAge=Infinity){
 const release=!reduced&&!b.EnemyID?Math.max(0,1-b.Age/16):0;
 const stretch=1+.12*release;
 // Captive artwork and shell share this displacement, with no captive resizing.
 const float=!reduced&&b.Floating?Math.sin(b.Age*.12+b.ID)*1.1:0;
 let squash=1;
 if(!reduced&&bounceAge>=0&&bounceAge<18){
  const keys=bounceKeys;
  let i=0;while(i<keys.length-2&&bounceAge>keys[i+1]![0])i++;
  const a=keys[i]!,b=keys[i+1]!,t=(bounceAge-a[0])/(b[0]-a[0]);
  squash=a[1]+(b[1]-a[1])*t*t*(3-2*t);
 }
 const height=diameter/stretch*squash;
 // Keep the shell's top contact point fixed in authored art units. Drawing
 // applies this offset after projection; captives translate but never resize.
 return {x:b.X+22+float,y:b.Y+22,width:diameter*stretch/squash,height,offsetY:(height-diameter/stretch)/2};
}
export interface CartoonFeedback {sprites:CartoonDraw[];accents:CartoonDraw[]}
/** Reuse painted rims/bursts; white glints and confetti batch after actor markers.
 * All work is capped even during a mass clear. Never emit pixel-art primitives. */
export function cartoonFeedback(g:GameState,feel:FeelState|undefined,reduced=false):CartoonFeedback{
 const sprites:CartoonDraw[]=[],accents:CartoonDraw[]=[];
 const sprite=(frame:string,x:number,y:number,w:number,h:number,color:CartoonDraw['color'])=>sprites.push({frame,x:x-w/2,y:y-h/2,width:w,height:h,color});
 const ring=(x:number,y:number,size:number,color:CartoonDraw['color'])=>sprite('bubble',x,y,size,size,color);
 const star=(x:number,y:number,size:number,color:CartoonDraw['color'])=>{
  accents.push({frame:'solid/#fff0bd',x:x-size/2,y:y-size/8,width:size,height:size/4,color,diamond:true},
   {frame:'solid/#fff0bd',x:x-size/8,y:y-size/2,width:size/4,height:size,color,diamond:true});
 };
 const colors:readonly (readonly [number,number,number,number])[]=[[.51,.73,.29,1],[.27,.55,.78,1],[.81,.39,.35,1],[.89,.73,.33,1],[.66,.50,.74,1],[.86,.58,.32,1],[.33,.72,.75,1],[.85,.56,.67,1],[.77,.78,.65,1],[.44,.51,.59,1]];
 for(const b of g.Bubbles.slice(-24)){
  const color=colors[(b.Shooter??0)%10]!;
  if(b.EnemyID&&b.CapturedAge<12){
   const age=Math.max(0,b.CapturedAge),t=age/12;
   // A separate expanding rim communicates capture; the captive never pulses.
   ring(b.X+22,b.Y+22,CARTOON_BUBBLE_SIZE+(reduced?0:age*2.3),[color[0],color[1],color[2],.42*(1-t)]);
  }
  if(reduced)continue;
  if(!b.Floating&&b.Age>=3&&b.Age<14){
   for(let i=0;i<2;i++)sprite('pop',b.X+22-b.Dir*(18+i*10),b.Y+22,7-i*2,3,[color[0],color[1],color[2],.22-i*.07]);
  }
  if(b.Floating&&(b.Age+b.ID*17)%90<10)star(b.X+2,b.Y+1,4,[1,1,1,.65]);
 }
 for(const p of g.Particles.filter(p=>!p.Text).slice(-18)){
  const age=Math.max(0,15-p.Life),t=Math.min(1,age/15),x=p.X+22,y=p.Y+22;
  ring(x,y,24+(reduced?0:age*2.5),[1,.94,.74,.6*(1-t)]);
  if(!reduced)for(let i=0;i<3;i++){
   const angle=i*Math.PI*2/3+.4,r=8+age*1.4;
   sprite('bubble',x+Math.cos(angle)*r,y+Math.sin(angle)*r+age*.25,5-2*t,5-2*t,[.72,.9,1,.5*(1-t)]);
  }
 }
 for(const cue of feel?.cues.slice(-16)??[]){
  const age=feel!.clock-cue.at;if(age<0)continue;
  const color=colors[cue.slot%10]!;
  if(cue.kind==='rescue'&&age<30){
   const t=age/30,y=cue.y-48-(reduced?0:age*.6);
   ring(cue.x,y,44+(reduced?0:age*1.1),[color[0],color[1],color[2],.65*(1-t)]);
   if(!reduced)for(let i=0;i<3;i++)star(cue.x+(i-1)*18,y-18-age*.6+(i%2)*8,5*(1-t),[1,1,1,1-t]);
  }else if((cue.kind==='boss-hit'||cue.kind==='capture')&&age<12){
   ring(cue.x,cue.y,48+(reduced?0:age*3),[1,.9,.67,.7*(1-age/12)]);
  }else if(!reduced&&(cue.kind==='clear'||cue.kind==='victory')&&age<45){
   const count=cue.kind==='victory'?24:10;
   for(let i=0;i<count;i++){
    const c=colors[i%10]!,vx=(i*17%19-9)*.65,vy=-2.8-i%5*.4;
    accents.push({frame:'solid/#fff0bd',x:cue.x+vx*age,y:cue.y+vy*age+.055*age*age,width:3,height:5,diamond:i%2===0,color:[c[0],c[1],c[2],1-age/45]});
   }
  }
 }
 return {sprites,accents};
}
